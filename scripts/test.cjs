const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto('https://www.baidu.com');
  console.log(await page.title());
  await browser.close();
})();