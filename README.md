# htmltopdf

Node.js utilities to convert HTML and Markdown files to PDF using [Puppeteer](https://pptr.dev/). Headless Chromium renders the source, then exports A4 PDFs with sane print defaults.

## Features

- Drag-and-drop web GUI (Next.js) for HTML and Markdown → PDF
- Batch HTML → PDF (auto-discovers files in `input/`)
- Markdown → PDF with built-in stylesheet (tables, code blocks, blockquotes, images)
- A4 output, 20mm/15mm margins, backgrounds enabled
- Page-break hints for headings, code blocks, tables, and images
- Single shared browser instance per run

## Repository layout

```
htmltopdf/
├── html-to-pdf.js     # Batch HTML → PDF converter (CLI)
├── md-to-pdf.js       # Single Markdown → PDF converter (CLI)
├── web/               # Next.js drag-and-drop GUI
│   ├── app/page.js        # Drop zone, output settings, conversion queue
│   ├── app/api/convert/   # POST endpoint: file in, PDF out
│   └── lib/pdf.js         # Shared Puppeteer render helper
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


### Web GUI (drag and drop)

```bash
npm run web:install   # first time only
npm run web           # http://localhost:3000
```

Drag `.html`, `.htm`, `.md` or `.markdown` files onto the sheet (or click to browse), pick the page size, orientation and margins, then select **Convert to PDF**. Each finished file gets a download link in the queue. Files are posted to the local Next.js server, rendered in a headless Chromium, and streamed straight back to the browser — nothing is written to `output/` and nothing leaves the machine.

Production build:

```bash
npm run web:build
npm run web:start
```

Limits and behavior:

- 20 MB per file; other extensions are skipped with a notice.
- Files convert one at a time, sharing a single warm browser instance.
- Markdown uses the same built-in print stylesheet as `md-to-pdf.js`. Relative images in Markdown do not resolve, because the upload has no directory on the server — use the CLI for those.
- Rendering gives the dropped file the same network and script access the browser has. Only convert files you trust.

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

The GUI exposes these as controls (A3/A4/A5/Letter/Legal/Tabloid, portrait or landscape, margins in mm/cm/in/px, backgrounds on or off) and starts from the same defaults.

To tweak (e.g., Letter format, narrower margins), edit the `page.pdf({...})` block in either script.

## Recent changes

- **`web/` added**: Next.js GUI with a drag-and-drop sheet, per-file queue, and output settings; conversion happens in `app/api/convert`.

- **`html-to-pdf.js` rewritten**: now zero-arg. Auto-discovers all HTML files in `input/`, reuses one browser instance across files, creates `output/` if missing. Previous version required `node html-to-pdf.js <file>` with the source at repo root.
- **`md-to-pdf.js` added**: converts a single Markdown file to PDF with a built-in print stylesheet.

## License

See [LICENSE](LICENSE).
