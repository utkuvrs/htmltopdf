const puppeteer = require("puppeteer");
const { marked } = require("marked");
const fs = require("fs");
const path = require("path");

(async () => {
    const inputArg = process.argv[2];

    if (!inputArg) {
        console.error("❌ Please provide a Markdown file path.");
        console.error("Usage: node md-to-pdf.js input/file.md");
        process.exit(1);
    }

    const inputPath = path.resolve(inputArg);

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const baseName = path.basename(inputPath).replace(/\.md$/i, ".pdf");
    const outputPath = path.join(outputDir, baseName);

    const md = fs.readFileSync(inputPath, "utf8");
    const body = marked(md);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<base href="file://${path.dirname(inputPath).replace(/\\/g, "/")}/">

<style>
  body { font-family: sans-serif; font-size: 14px; line-height: 1.6; padding: 20px; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
  code { font-family: monospace; }
  blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #555; }
  img { max-width: 100%; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; }
  th { background: #f0f0f0; }
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
  pre, blockquote, table, figure, img { page-break-inside: avoid; }
  p { orphans: 3; widows: 3; }
</style>
</head>
<body>${body}</body>
</html>`;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    console.log(`✅ PDF created: ${outputPath}`);
})();
