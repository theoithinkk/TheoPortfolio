"""Build CTF writeup pages from markdown and refresh the Writeups list on the homepage.

Usage (from the site folder):
    python -I tools/build_writeups.py "<folder of writeups>" <event-slug> "<Event title>"
    python -I tools/build_writeups.py --all "<CTFwriteups checkout>"

--all rebuilds every event listed in tools/writeup_events.json (the GitHub Action uses this); an
event only goes on the site once it is listed there. A leading "(DONE)"-style tag on a challenge
folder name is left out of its title and slug. When the writeups folder is a git checkout with a
GitHub remote, each page links to its writeup.md there and the homepage links to the repo.

The folder holds one subfolder per challenge, each with writeup.md and a screenshots/ folder.
writeup.md starts with "Flag:", "Category:" and "Tools used:" lines, then "Steps:" with numbered
steps, "- " bullets and ![alt](screenshots/x.png) images, and ends with "Key insight:" (and
optionally "Note:") paragraphs.

Output:
    writeups/<event-slug>/<challenge>.html     one page per writeup
    writeups/img/<event-slug>/<challenge>/     screenshots, converted to .webp
    writeups/manifest.json                     every event built so far
    index.html                                 the block between the writeups:start/end markers

Running it again for the same event rebuilds that event; other events in the manifest are kept.
A new category needs nothing special: its filter button appears from the "Category:" line.
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

from PIL import Image

SITE = Path(__file__).resolve().parent.parent
OUT = SITE / "writeups"
VERSION = "20261029a"   # cache tag for style.css / prefs.js on the generated pages
MAX_IMG_W = 1600
CATEGORY_COLORS = {"osint": "#4fc1a6", "crypto": "#a27fe0", "forensics": "#5aa7dc", "web": "#e8b84a",
                   "pwn": "#e0573f", "rev": "#f08a4b", "reverse engineering": "#f08a4b", "misc": "#9aa0a6"}
FALLBACK_COLORS = ["#d77fb3", "#7fc06a", "#c9b458", "#6fb3c9"]


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def git(cwd, *args):
    try:
        return subprocess.run(["git", "-C", str(cwd), *args], capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def github_source(src_dir):
    """(repo URL, URL of src_dir on GitHub) when src_dir sits in a GitHub checkout, else ("", "")."""
    remote = git(src_dir, "remote", "get-url", "origin")
    m = re.match(r"(?:https://github\.com/|git@github\.com:)([\w.-]+/[\w.-]+?)(?:\.git)?/?$", remote)
    if not m:
        return "", ""
    repo = f"https://github.com/{m.group(1)}"
    branch = git(src_dir, "rev-parse", "--abbrev-ref", "HEAD")
    rel = git(src_dir, "rev-parse", "--show-prefix").rstrip("/")
    return repo, f"{repo}/blob/{quote(branch if branch and branch != 'HEAD' else 'main')}/{quote(rel)}"


def inline(text):
    """Escape, then mark up flags (as click-to-reveal spoilers) and leading 'Label:' words."""
    t = html.escape(text, quote=False)
    t = re.sub(r"PacketCapture\{[^}\s]*\}", lambda m: f'<span class="flag" tabindex="0">{m.group(0)}</span>', t)
    t = re.sub(r"^([A-Z][\w /'-]{1,30}):(?=\s)", r"<b>\1:</b>", t)
    return t


def parse(md):
    head, steps, callouts = {}, [], []
    mode = "head"
    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        s = line.strip()
        img = re.match(r"!\[(.*?)\]\((.*?)\)$", s)
        if mode == "head":
            if s == "Steps:":
                mode = "steps"
            elif ":" in s:
                k, v = s.split(":", 1)
                head[k.strip().lower()] = v.strip()
            continue
        if indent == 0 and re.match(r"^[A-Z][A-Za-z ]{1,24}:\s", s) and not re.match(r"^\d+\.", s):
            label, text = s.split(":", 1)
            callouts.append({"label": label, "text": text.strip()})
            mode = "callout"
            continue
        if mode == "callout" and indent == 0 and not re.match(r"^\d+\.", s):
            callouts[-1]["text"] += " " + s
            continue
        m = re.match(r"^(\d+)\.\s+(.*)", s)
        if indent == 0 and m:
            steps.append({"title": m.group(2), "blocks": []})
            mode = "steps"
            continue
        if not steps:
            continue
        blocks = steps[-1]["blocks"]
        if img:
            blocks.append({"fig": img.group(2), "alt": img.group(1)})
        elif s.startswith("- ") and indent <= 4:
            if not blocks or "ul" not in blocks[-1]:
                blocks.append({"ul": []})
            blocks[-1]["ul"].append({"text": s[2:], "subs": []})
        elif s.startswith("- "):
            if blocks and "ul" in blocks[-1] and blocks[-1]["ul"]:
                blocks[-1]["ul"][-1]["subs"].append(s[2:])
        else:  # continuation of the previous line
            if blocks and "ul" in blocks[-1] and blocks[-1]["ul"]:
                item = blocks[-1]["ul"][-1]
                if item["subs"]:
                    item["subs"][-1] += " " + s
                else:
                    item["text"] += " " + s
            elif not blocks:
                steps[-1]["title"] += " " + s
    return head, steps, callouts


def convert_image(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
    if im.width > MAX_IMG_W:
        im = im.resize((MAX_IMG_W, round(im.height * MAX_IMG_W / im.width)), Image.LANCZOS)
    im.save(dest, "WEBP", quality=82)
    return im.size


PAGE = """<!doctype html>
<html lang="en" data-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{title} ({category} writeup) | Theodore Garcia</title>
<meta name="description" content="{desc}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../style.css?v={v}">
<script src="../../prefs.js?v={v}" data-static></script>
</head>
<body class="wu-body">
<header class="wu-hero">
  <div class="wu-wrap">
    <nav class="wu-crumbs" aria-label="Breadcrumb"><a href="../../">Theodore Garcia</a><span>/</span><a href="../../#writeups">Writeups</a><span>/</span><span>{event}</span></nav>
    <p class="wu-kicker"><span class="wu-cat">{category}</span>{level}<span>{steps_n} steps · {minutes} min read</span></p>
    <h1>{title}</h1>
  </div>
</header>
<div class="wu-wrap wu-layout">
  <article class="wu-article">
{tldr}
{steps}
{callouts}
    <nav class="wu-nav" aria-label="More writeups">{nav}</nav>
  </article>
  <aside class="wu-side">
    <dl class="wu-facts">
      <dt>Event</dt><dd>{event}</dd>
      <dt>Category</dt><dd>{category}{level_plain}</dd>
      <dt>Tools</dt><dd><ul class="wu-tools-list">{tools}</ul></dd>
      <dt>Flag</dt><dd class="wu-flag">{flag}<small>Tap, hover or Tab to reveal</small></dd>{source}
    </dl>
    <nav class="wu-route" aria-label="The route"><p>The route</p><ol>{chain}</ol></nav>
  </aside>
</div>
<script src="../wu.js?v={v}" defer></script>
</body>
</html>
"""


def bullet_class(text):
    """Colour-code the writeup's own labels: reasoning, dead ends and results read differently."""
    label = text.split(":", 1)[0].lower() if ":" in text[:32] else ""
    if label.startswith("thinking"):
        return ' class="think"'
    if label.startswith("dead end") or label.startswith("care point"):
        return ' class="dead"'
    if label.startswith("result"):
        return ' class="result"'
    return ""


def chain_label(title):
    """'Pivot: the authors, and where they moved.' -> 'Authors, and where they moved'"""
    t = title.split(":", 1)[1] if ":" in title[:24] else title
    t = re.sub(r"^\s*(the|a|an)\s+", "", t.strip(), flags=re.I).rstrip(". ")
    t = re.sub(r"\s*\([^)]*\)", "", t).strip()          # drop asides like "(the first crossroad)"
    if len(t) > 44 and "," in t:
        t = t.split(",")[0]
    if not re.match(r"\S*[/.@_]", t):   # keep handles, paths and file names exactly as written
        t = t[:1].upper() + t[1:]
    return t if len(t) <= 44 else t[:42].rsplit(" ", 1)[0] + "…"


def render_page(event_slug, event_title, w, prev, nxt):
    steps_html = []
    for n, st in enumerate(w["steps"], 1):
        parts = [f'      <h2>{inline(st["title"])}</h2>']
        for b in st["blocks"]:
            if "ul" in b:
                items = []
                for it in b["ul"]:
                    subs = "".join(f"<li>{inline(x)}</li>" for x in it["subs"])
                    items.append(f"<li{bullet_class(it['text'])}>{inline(it['text'])}{f'<ul>{subs}</ul>' if subs else ''}</li>")
                parts.append(f'      <ul>{"".join(items)}</ul>')
            else:
                src = f'../img/{event_slug}/{w["slug"]}/{b["file"]}'
                parts.append(f'      <figure><a href="{src}" target="_blank" rel="noopener"><img src="{src}" alt="{html.escape(b["alt"])}" width="{b["w"]}" height="{b["h"]}" loading="lazy"></a>'
                             f'<figcaption>{html.escape(b["alt"])}</figcaption></figure>')
        head = f'      <h2><span class="wu-n">{n:02d}</span>{inline(st["title"])}</h2>'
        steps_html.append(f'    <section class="wu-step" id="step-{n}">\n{head}\n' + "\n".join(parts[1:]) + "\n    </section>")
    # The key insight goes up top as the TL;DR; any other notes stay at the end.
    tldr = f'    <aside class="wu-callout key"><h2>The trick</h2><p>{inline(w["insight"])}</p></aside>' if w["insight"] else ""
    callouts = "\n".join(
        f'    <aside class="wu-callout"><h2>{html.escape(c["label"])}</h2><p>{inline(c["text"])}</p></aside>'
        for c in w["callouts"] if not c["label"].lower().startswith("key"))
    chain = "".join(f'<li><a href="#step-{n}"><b>{n}</b><span>{html.escape(chain_label(st["title"]))}</span></a></li>'
                    for n, st in enumerate(w["steps"], 1))
    tools = "".join(f"<li>{html.escape(t)}</li>" for t in w["tools"])
    level = f'<span class="wu-lvl">{html.escape(w["note"])}</span>' if w["note"] else ""
    level_plain = f' · {html.escape(w["note"])}' if w["note"] else ""
    source = (f'\n      <dt>Source</dt><dd><a class="wu-source" href="{html.escape(w["source"])}" target="_blank" rel="noopener">'
              f'writeup.md on GitHub</a></dd>' if w.get("source") else "")
    nav = (f'<a class="prev" href="{prev["slug"]}.html"><small>Previous</small>{html.escape(prev["title"])}</a>' if prev else "<span></span>") + \
          (f'<a class="next" href="{nxt["slug"]}.html"><small>Next</small>{html.escape(nxt["title"])}</a>' if nxt else "<span></span>")
    return PAGE.format(title=html.escape(w["title"]), category=html.escape(w["category"]), desc=html.escape(w["insight"]),
                       event=html.escape(event_title), level=level, level_plain=level_plain, steps_n=len(w["steps"]),
                       minutes=w["minutes"], lede=html.escape(first_sentence(w["insight"])), tldr=tldr, chain=chain,
                       tools=tools, flag=inline(w["flag"]), source=source, steps="\n".join(steps_html), callouts=callouts, nav=nav, v=VERSION)


def build_event(src_dir, event_slug, event_title):
    items = []
    repo, src_url = github_source(src_dir)
    for d in sorted((p for p in Path(src_dir).iterdir() if (p / "writeup.md").is_file()),
                    key=lambda p: re.sub(r"^\(.*?\)\s*", "", p.name)):
        head, steps, callouts = parse((d / "writeup.md").read_text(encoding="utf-8"))
        cat_raw = head.get("category", "Misc")
        cat, note = (re.match(r"([^(]+?)\s*(?:\((.*)\))?$", cat_raw).groups())
        title = re.sub(r"^\(.*?\)\s*", "", d.name)   # "(DONE) Digital Footprint" -> "Digital Footprint"
        slug = slugify(title)
        for st in steps:   # copy screenshots in, as webp
            for b in st["blocks"]:
                if "fig" in b:
                    src = d / b["fig"]
                    b["file"] = Path(b["fig"]).with_suffix(".webp").name
                    b["w"], b["h"] = convert_image(src, OUT / "img" / event_slug / slug / b["file"])
        insight = next((c["text"] for c in callouts if c["label"].lower().startswith("key")), "")
        tools = [re.sub(r"\s*\(.*?\)", "", t).strip() for t in head.get("tools used", "").split(",") if t.strip()]
        words = len((d / "writeup.md").read_text(encoding="utf-8").split())
        source = f"{src_url}/{quote(d.name)}/writeup.md" if src_url else ""
        items.append({"slug": slug, "title": title, "category": cat.strip(), "note": note or "", "flag": head.get("flag", ""),
                      "tools": tools, "insight": insight, "steps": steps, "callouts": callouts,
                      "minutes": max(1, round(words / 200)), "source": source})
    (OUT / event_slug).mkdir(parents=True, exist_ok=True)
    for i, w in enumerate(items):
        page = render_page(event_slug, event_title, w, items[i - 1] if i else None, items[i + 1] if i + 1 < len(items) else None)
        assert "<script>" not in page
        (OUT / event_slug / f'{w["slug"]}.html').write_text(page, encoding="utf-8")
    return repo, [{**{k: w[k] for k in ("slug", "title", "category", "note", "tools", "insight", "minutes", "source")},
                   "steps": len(w["steps"])} for w in items]


def first_sentence(s):
    m = re.match(r"(.+?[.!?])(\s|$)", s)
    return m.group(1) if m else s


def cat_color(cat, seen):
    """Fixed colours for common CTF categories; anything new gets the next fallback colour."""
    key = cat.lower()
    if key in CATEGORY_COLORS:
        return CATEGORY_COLORS[key]
    seen.setdefault(key, FALLBACK_COLORS[len(seen) % len(FALLBACK_COLORS)])
    return seen[key]


def render_index_block(manifest):
    """Solve grid: one square per writeup, coloured by category. Hover/focus fills the info
    panel (main.js reads the data-* attributes); clicking opens the writeup."""
    seen, cats, squares = {}, {}, []
    items = [(ev_slug, ev["title"], it) for ev_slug, ev in manifest.items() for it in ev["items"]]
    for ev_slug, ev_title, it in items:
        c = cat_color(it["category"], seen)
        cats.setdefault(it["category"], [c, 0])[1] += 1
        level = f' · {it["note"]}' if it.get("note") else ""
        squares.append(
            f'      <a class="solve" href="writeups/{ev_slug}/{it["slug"]}.html" style="--c:{c}" data-cat="{slugify(it["category"])}"'
            f' data-title="{html.escape(it["title"])}" data-meta="{html.escape(it["category"] + level)} · {it.get("steps", 1)} steps"'
            f' data-event="{html.escape(ev_title)}" data-trick="{html.escape(first_sentence(it["insight"]))}"'
            f' aria-label="{html.escape(it["title"])}, {html.escape(it["category"])}, {html.escape(ev_title)}"></a>')
    empty = max(36, -(-len(squares) // 12) * 12) - len(squares)   # pad to full rows of 12, at least 3 rows
    squares += ['      <i class="solve empty" aria-hidden="true"></i>'] * empty
    legend = "".join(f'<li><button type="button" data-cat="{slugify(c)}" style="--c:{col}" aria-pressed="false">{html.escape(c)} <span>{n}</span></button></li>'
                     for c, (col, n) in sorted(cats.items()))
    hard = max((it for _, _, it in items), key=lambda it: it.get("steps", 0), default=None)
    info = ""
    if hard:
        ev_slug, ev_title = next((s, t) for s, t, it in items if it is hard)
        info = (f'<p class="solve-kicker">Toughest solve</p><h4>{html.escape(hard["title"])}</h4>'
                f'<p class="solve-meta">{html.escape(hard["category"])} · {hard.get("steps", 1)} steps · {html.escape(ev_title)}</p>'
                f'<p>{html.escape(first_sentence(hard["insight"]))}</p>'
                f'<a class="solve-read" href="writeups/{ev_slug}/{hard["slug"]}.html">Read the writeup <i class="ii ii-go" aria-hidden="true"></i></a>')
    n_events = len(manifest)
    repos = sorted({ev["repo"] for ev in manifest.values() if ev.get("repo")})
    repo_links = "".join(f'<a class="solve-read solve-repo" href="{html.escape(r)}" target="_blank" rel="noopener">'
                         f'All writeups on GitHub <i class="ii ii-go" aria-hidden="true"></i></a>' for r in repos)
    total_steps = sum(it.get("steps", 1) for _, _, it in items)
    # Top five by steps, as a ranked list under the panel; hovering a row previews it like its square.
    ranked = sorted(items, key=lambda x: -x[2].get("steps", 0))[:5]
    rows = "".join(
        f'<li><a href="writeups/{s}/{it["slug"]}.html" style="--c:{cat_color(it["category"], seen)}">'
        f'<span class="solve-rank">{i}</span><span class="solve-row-title">{html.escape(it["title"])}</span>'
        f'<span class="solve-row-cat">{html.escape(it["category"])}</span><span class="solve-row-steps">{it.get("steps", 1)} steps</span></a></li>'
        for i, (s, _, it) in enumerate(ranked, 1))
    return "\n".join([
        "    <!-- writeups:start (generated by tools/build_writeups.py; edit the writeups, then rebuild) -->",
        '    <div class="solves">',
        f'      <div class="solve-head"><p class="solve-count"><b>{len(items)}</b> flags · <b>{n_events}</b> event{"s" if n_events != 1 else ""} · <b>{len(cats)}</b> categor{"ies" if len(cats) != 1 else "y"} · <b>{total_steps}</b> steps</p>'
        f'<ul class="solve-legend" aria-label="Highlight a category">{legend}</ul>{repo_links}</div>',
        '      <div class="solve-body">',
        '      <div class="solve-grid">',
        *squares,
        "      </div>",
        f'      <aside class="solve-info" aria-live="polite">{info}</aside>',
        f'      <div class="solve-ranked"><p class="solve-kicker">Hardest solves</p><ol class="solve-list">{rows}</ol></div>',
        "      </div>",
        "    </div>",
        "    <!-- writeups:end -->"])

def main():
    if sys.argv[1] == "--all":
        events = json.loads((SITE / "tools" / "writeup_events.json").read_text(encoding="utf-8"))
        jobs = [(Path(sys.argv[2]) / ev["path"], ev["slug"], ev["title"]) for ev in events]
    else:
        jobs = [(Path(sys.argv[1]), sys.argv[2], sys.argv[3])]
    mf = OUT / "manifest.json"
    manifest = json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {}
    for src, event_slug, event_title in jobs:
        repo, items = build_event(src, event_slug, event_title)
        manifest[event_slug] = {"title": event_title, "repo": repo, "items": items}
        print(f"built {len(items)} writeups for {event_slug}")
    mf.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    idx = SITE / "index.html"
    t = idx.read_text(encoding="utf-8")
    t, n = re.subn(r"    <!-- writeups:start.*?<!-- writeups:end -->", lambda _: render_index_block(manifest), t, flags=re.S)
    assert n == 1, "index.html needs the writeups:start / writeups:end markers"
    idx.write_text(t, encoding="utf-8")


if __name__ == "__main__":
    main()
