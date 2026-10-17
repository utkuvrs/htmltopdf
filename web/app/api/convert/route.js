import { htmlToPdf, markdownToHtml } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 20 * 1024 * 1024;
const PAGE_FORMATS = new Set([
  "A3",
  "A4",
  "A5",
  "Letter",
  "Legal",
  "Tabloid",
]);

function badRequest(message, status = 400) {
  return Response.json({ error: message }, { status });
}

function parseMargin(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^\d+(\.\d+)?(mm|cm|in|px)$/.test(trimmed) ? trimmed : fallback;
}

export async function POST(request) {
  let form;

  try {
    form = await request.formData();
  } catch {
    return badRequest("Expected a multipart/form-data body.");
  }

  const file = form.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return badRequest("No file was uploaded.");
  }

  if (file.size > MAX_BYTES) {
    return badRequest("File is larger than 20 MB.", 413);
  }

  const name = file.name || "document";
  const isMarkdown = /\.(md|markdown)$/i.test(name);
  const isHtml = /\.html?$/i.test(name);

  if (!isMarkdown && !isHtml) {
    return badRequest("Only .html, .htm, .md and .markdown files are supported.");
  }

  const source = new TextDecoder("utf-8").decode(await file.arrayBuffer());
  const html = isMarkdown ? markdownToHtml(source) : source;

  const format = form.get("format");
  const margin = {
    top: parseMargin(form.get("marginVertical"), "20mm"),
    bottom: parseMargin(form.get("marginVertical"), "20mm"),
    left: parseMargin(form.get("marginHorizontal"), "15mm"),
    right: parseMargin(form.get("marginHorizontal"), "15mm"),
  };

  try {
    const pdf = await htmlToPdf(html, {
      format: PAGE_FORMATS.has(format) ? format : "A4",
      landscape: form.get("landscape") === "true",
      printBackground: form.get("printBackground") !== "false",
      margin,
    });

    const filename = name.replace(/\.(html?|md|markdown)$/i, "") + ".pdf";

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "X-Pdf-Filename": filename,
      },
    });
  } catch (error) {
    console.error("PDF conversion failed:", error);
    return badRequest("Conversion failed: " + error.message, 500);
  }
}
