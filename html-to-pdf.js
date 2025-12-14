const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
    const fileName = process.argv[2];

    if (!fileName) {
        console.error("❌ Please provide an HTML file name.");
        console.error("Usage: node html-to-pdf.js invoice.html");
        process.exit(1);
    }

    const inputPath = path.join(__dirname, "input", fileName);

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const outputFileName = fileName.replace(/\.html$/i, ".pdf");
    const outputPath = path.join(outputDir, outputFileName);

    const html = fs.readFileSync(inputPath, "utf8");

    const browser = await puppeteer.launch({
        headless: "new",
    });

    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: "networkidle0",
    });

    await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm",
        },
    });

    await browser.close();

    console.log(`✅ PDF created: ${outputPath}`);
})();
