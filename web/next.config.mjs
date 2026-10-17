/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Puppeteer out of the server bundle so it can resolve its own Chromium.
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
