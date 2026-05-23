# htmltopdf

Node.js utilities to convert HTML and Markdown files to PDF using [Puppeteer](https://pptr.dev/). Headless Chromium renders the source, then exports A4 PDFs with sane print defaults.

## Features

- Batch HTML → PDF (auto-discovers files in `input/`)
- Markdown → PDF with built-in stylesheet (tables, code blocks, blockquotes, images)
- A4 output, 20mm/15mm margins, backgrounds enabled
- Page-break hints for headings, code blocks, tables, and images
- Single shared browser instance per run

## Repository layout

```
htmltopdf/
├── html-to-pdf.js     # Batch HTML → PDF converter
├── md-to-pdf.js       # Single Markdown → PDF converter
├── input/             # Drop source files here
├── output/            # Generated PDFs land here
├── package.json
└── LICENSE
```

## Install

Requires Node.js (18+ recommended).

```bash
npm install
```

This installs:
- `puppeteer` — headless Chromium driver
- `marked` — Markdown → HTML parser

## Usage

### HTML → PDF (batch)

1. Place `.html` (or `.htm`) files in `input/`.
2. Run:

   ```bash
   node html-to-pdf.js
   ```

3. Each file renders to `output/<basename>.pdf`.

No CLI argument is needed — every HTML file in `input/` is processed in one run. The script exits with an error if `input/` is empty or missing.

### Markdown → PDF

```bash
node md-to-pdf.js input/notes.md
```

Output written to `output/notes.pdf`. Relative image paths resolve against the Markdown file's directory via an injected `<base href>`.

## PDF output settings

Both scripts share the same `page.pdf()` config:

| Setting           | Value                          |
|-------------------|--------------------------------|
| Format            | A4                             |
| Margins (top/btm) | 20mm                           |
| Margins (l/r)     | 15mm                           |
| Backgrounds       | printed (`printBackground: true`) |
| Wait condition    | `networkidle0`                 |

To tweak (e.g., Letter format, narrower margins), edit the `page.pdf({...})` block in either script.

## Recent changes

- **`html-to-pdf.js` rewritten**: now zero-arg. Auto-discovers all HTML files in `input/`, reuses one browser instance across files, creates `output/` if missing. Previous version required `node html-to-pdf.js <file>` with the source at repo root.
- **`md-to-pdf.js` added**: converts a single Markdown file to PDF with a built-in print stylesheet.

## License

See [LICENSE](LICENSE).
