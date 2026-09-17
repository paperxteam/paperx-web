const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://ais-dev-5ecu3chhji6xwxfespm5w2-164712602982.asia-southeast1.run.app');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Sign in with Google') || b.textContent.includes('Sign up with Google'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const html = await page.content();
  const errorText = await page.evaluate(() => {
     const el = document.querySelector('.text-red-600, .bg-red-50');
     return el ? el.innerText : 'Not found';
  });
  console.log("Error text on AIS Dev:", errorText);
  await browser.close();
})();
