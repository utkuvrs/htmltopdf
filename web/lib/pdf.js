import puppeteer from "puppeteer";
import { marked } from "marked";

// A single browser instance is shared across requests and kept warm between
// hot reloads in dev by stashing it on globalThis.
const globalForBrowser = globalThis;

export const DEFAULT_OPTIONS = {
  format: "A4",
  landscape: false,
  printBackground: true,
  margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
};

async function getBrowser() {
  if (!globalForBrowser.__pdfBrowser) {
    globalForBrowser.__pdfBrowser = puppeteer.launch({ headless: "new" });
  }

  const browser = await globalForBrowser.__pdfBrowser;

  if (browser.connected === false) {
    globalForBrowser.__pdfBrowser = puppeteer.launch({ headless: "new" });
    return globalForBrowser.__pdfBrowser;
  }

  return browser;
}

const MARKDOWN_STYLES = `
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
`;

export function markdownToHtml(markdown) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${MARKDOWN_STYLES}</style>
</head>
<body>${marked(markdown)}</body>
</html>`;
}

/**
 * Render an HTML string to a PDF buffer.
 *
 * @param {string} html raw HTML document or fragment
 * @param {object} [options] subset of Puppeteer's page.pdf options
 * @returns {Promise<Uint8Array>}
 */
export async function htmlToPdf(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    return await page.pdf({ ...DEFAULT_OPTIONS, ...options });
  } finally {
    await page.close();
  }
}
