import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const dir = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + dir + 'onepager.html', { waitUntil: 'networkidle' });
await page.pdf({ path: dir + 'HUB-Contractor-OnePager.pdf', width: '8.5in', height: '11in', printBackground: true, pageRanges: '1' });
await browser.close();
console.log('PDF written OK');
