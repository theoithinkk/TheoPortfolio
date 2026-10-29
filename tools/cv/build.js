// Builds the résumé and CV as HTML (printed to PDF by Chrome) and DOCX, from content.js.
// Harvard layout, ATS-safe: one column, real text, no tables/images/text boxes, contact info in the
// body (not a header), standard section names.
//
// Edit content.js, then from tools/cv:
//   npm install docx@9.5.1          (once; node_modules is gitignored)
//   node build.js out 10            (out/*.html and out/*.docx, 10pt)
//   chrome --headless=new --no-pdf-header-footer --print-to-pdf=out/<name>.pdf out/<name>.html
// and copy the PDFs and DOCX files into files/. Keep the résumé to one page (check with pdfinfo).
const fs = require("fs");
const path = require("path");
const docx = require("docx");
const { Document, Packer, Paragraph, TextRun, Tab, TabStopType, AlignmentType, LevelFormat, BorderStyle } = docx;
const data = require("./content");

const out = process.argv[2];
const PT = Number(process.argv[3] || 10.5);
fs.mkdirSync(out, { recursive: true });
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- HTML ---------- */
function html(d, title) {
  const row = (l, r, cls) => `<div class="row"><span class="${cls}">${esc(l)}</span>${r ? `<span>${esc(r)}</span>` : ""}</div>`;
  const ul = b => (b && b.length ? `<ul>${b.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const entry = e => `<div class="entry">${row(e.org, e.where, "org")}${row(e.role, e.when, "role")}${ul(e.bullets)}` +
    (e.sub ? `${row(e.sub.role, e.sub.when, "role")}${ul(e.sub.bullets)}` : "") + "</div>";
  const sec = s => `<section><h2>${esc(s.title)}</h2>` +
    (s.entries || []).map(entry).join("") +
    (s.lines || []).map(([k, v]) => `<p class="line"><b>${esc(k)}:</b> ${esc(v)}</p>`).join("") + "</section>";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(d.name)}, ${title}</title>
<style>
@page { size: Letter; margin: 0.5in 0.6in; }
* { box-sizing: border-box; }
body { margin: 0; color: #000; font: ${PT}pt/1.16 "Times New Roman", Times, serif; }
h1 { margin: 0 0 2pt; text-align: center; font-size: ${PT + 7}pt; letter-spacing: .5pt; }
.contact { margin: 0 0 2pt; text-align: center; font-size: ${PT - 1}pt; }
h2 { margin: 6pt 0 2pt; padding-bottom: 1pt; border-bottom: .75pt solid #000; font-size: ${PT}pt; text-transform: uppercase; letter-spacing: .6pt; }
.row { display: flex; justify-content: space-between; gap: 14pt; }
.row span:last-child { flex: none; }
.org { font-weight: bold; }
.role { font-style: italic; }
ul { margin: 1pt 0 0 15pt; padding: 0; }
li { margin: 0 0 1pt; }
.entry { margin: 0 0 4pt; break-inside: avoid; }
.line { margin: 0 0 2pt; }
</style></head><body>
<h1>${esc(d.name)}</h1>
<p class="contact">${d.contact.map(esc).join(" | ")}</p>
${d.sections.map(sec).join("\n")}
</body></html>`;
}

/* ---------- DOCX ---------- */
const MARGIN_X = 864, MARGIN_Y = 720, WIDTH = 12240 - 2 * MARGIN_X;   // Letter, 0.6in sides / 0.5in top-bottom, DXA
const HP = Math.round(PT * 2);                                          // half-points
function docxDoc(d) {
  const tabRow = (l, r, style) => new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: WIDTH }],
    spacing: { after: 0 },
    children: [new TextRun({ text: l, ...style }), ...(r ? [new TextRun({ children: [new Tab(), r] })] : [])],   // a real <w:tab/>, not "\t"
  });
  const bullets = b => (b || []).map(t => new Paragraph({ numbering: { reference: "dot", level: 0 }, spacing: { after: 20 }, children: [new TextRun(t)] }));
  const kids = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: d.name, bold: true, size: HP + 14 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: d.contact.join(" | "), size: HP - 2 })] }),
  ];
  for (const s of d.sections) {
    kids.push(new Paragraph({
      spacing: { before: 140, after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
      children: [new TextRun({ text: s.title.toUpperCase(), bold: true })],
    }));
    for (const e of s.entries || []) {
      kids.push(tabRow(e.org, e.where, { bold: true }), tabRow(e.role, e.when, { italics: true }), ...bullets(e.bullets));
      if (e.sub) kids.push(tabRow(e.sub.role, e.sub.when, { italics: true }), ...bullets(e.sub.bullets));
      kids.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
    }
    for (const [k, v] of s.lines || []) {
      kids.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun(v)] }));
    }
  }
  return new Document({
    creator: d.name, title: `${d.name}`,
    styles: { default: { document: { run: { font: "Times New Roman", size: HP } } } },
    numbering: { config: [{ reference: "dot", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 300, hanging: 200 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: MARGIN_Y, bottom: MARGIN_Y, left: MARGIN_X, right: MARGIN_X } } }, children: kids }],
  });
}

(async () => {
  for (const [key, title] of [["resume", "Résumé"], ["cv", "CV"]]) {
    const d = data[key];
    fs.writeFileSync(path.join(out, `${d.file}.html`), html(d, title), "utf8");
    fs.writeFileSync(path.join(out, `${d.file}.docx`), await Packer.toBuffer(docxDoc(d)));
    console.log("wrote", d.file);
  }
})();
