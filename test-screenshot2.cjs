const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://paperx-xi.vercel.app');
  await new Promise(r => setTimeout(r, 2000));
  
  // click sign in
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Sign in with Google') || b.textContent.includes('Sign up with Google'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const pages = await browser.pages();
  const popup = pages[pages.length - 1];
  
  if (popup && popup !== page) {
    console.log("Popup URL:", popup.url());
    console.log("Popup Text:", await popup.evaluate(() => document.body.innerText));
  } else {
    console.log("No popup found in pages list");
    const html = await page.content();
    const errorText = await page.evaluate(() => {
       const el = document.querySelector('.text-red-600, .bg-red-50');
       return el ? el.innerText : 'Not found';
    });
    console.log("Error on main page:", errorText);
  }
  await browser.close();
})();
