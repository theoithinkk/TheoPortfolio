# TheoPortfolio

Personal portfolio of Theodore Garcia, a Computer Science (Network and Information Security) student at De La Salle University focused on GRC, cloud security and AI security. Plain HTML, CSS and JavaScript with no framework and no build step for the site itself, styled after Slay the Spire.

## Security and privacy design

- **Content Security Policy** sent as an HTTP header from [`_headers`](_headers), with the same policy in a `<meta>` tag as a fallback. Scripts, fonts, images and audio load only from this site. There is no inline JavaScript, no plugins and no form submissions. `'unsafe-inline'` is allowed for styles only, because elements carry per-element CSS variables.
- **HSTS, no framing, no device access.** The same file sends `Strict-Transport-Security`, `frame-ancestors 'none'` with `X-Frame-Options: DENY` (a `<meta>` tag can't set either), and a `Permissions-Policy` that turns off camera, microphone and location.
- **No third parties on page load.** Fonts are self-hosted, so opening a page contacts Cloudflare, the site's host, and nobody else. No cookies, analytics or trackers.
- **One local preference key.** Display choices live in `localStorage` under `tg-prefs`, and every field is listed in [privacy.html](privacy.html).
- **security.txt** ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)) at [.well-known/security.txt](.well-known/security.txt).
- External links use `rel="noopener"`, and the referrer policy is `strict-origin-when-cross-origin`.
- The content is all in `index.html`; JavaScript only adds behavior, so the page still works without it.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole portfolio |
| `style.css`, `paper.css` | Base styles, then the paper cut-out layer |
| `prefs.js` | Applies saved theme before first paint (not deferred, so colors never flash) |
| `main.js` | Intro, palettes, card hand, map, sound |
| `_headers` | HTTP security headers, read by Cloudflare Pages at deploy time |
| `404.html` | Served with a real 404 status for any missing path |
| `writeups/` | Generated CTF writeup pages |
| `files/` | CV and résumé (PDF and DOCX) |
| `tools/` | Writeup and CV generators |

## CTF writeups

`tools/build_writeups.py` builds `writeups/` and the solves grid in `index.html` from [theoithinkk/CTFwriteups](https://github.com/theoithinkk/CTFwriteups). Only events listed in `tools/writeup_events.json` are built. The [Sync CTF writeups](.github/workflows/writeups.yml) workflow runs it daily and commits only when something changed.

## CV and résumé

`tools/cv/content.js` is the single source for both documents, and `tools/cv/build.js` renders them to HTML and DOCX. See the comment at the top of `build.js` for the exact commands. The résumé is built at 10pt and the CV at 9.5pt.

## Run locally

```powershell
python -m http.server 8000
```

Then open http://localhost:8000.

## Credits

Fan-made design inspired by Slay the Spire, not affiliated with Mega Crit. Sound effects by Kenney (CC0). Music: "The Old Tower Inn" by RandomMind (CC0). Icons: Simple Icons (CC0), Tabler Icons (MIT), Microsoft Fluent Emoji (MIT). Fonts: Fraunces and Inter (SIL Open Font License). Badges and logos belong to their owners.
