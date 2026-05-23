const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
    const inputDir = path.join(__dirname, "input");
    const outputDir = path.join(__dirname, "output");

    if (!fs.existsSync(inputDir)) {
        console.error(`❌ Input directory not found: ${inputDir}`);
        process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const files = fs
        .readdirSync(inputDir)
        .filter((f) => /\.html?$/i.test(f));

    if (files.length === 0) {
        console.error(`❌ No HTML files found in ${inputDir}`);
        process.exit(1);
    }

    const browser = await puppeteer.launch({ headless: "new" });

    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(
            outputDir,
            file.replace(/\.html?$/i, ".pdf")
        );

        const html = fs.readFileSync(inputPath, "utf8");

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
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
        await page.close();

        console.log(`✅ ${file} → ${path.relative(__dirname, outputPath)}`);
    }

    await browser.close();
})();
