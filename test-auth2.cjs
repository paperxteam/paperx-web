const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Intercept dialogs and console
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('https://paperx-xi.vercel.app');
  await new Promise(r => setTimeout(r, 2000));
  
  // click sign in with google
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Sign in with Google') || b.textContent.includes('Sign up with Google'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 4000));
  
  const html = await page.content();
  if (html.includes('authorized domains list for project')) {
    console.log("Found unauthorized domain error in HTML");
  } else {
    console.log("No unauthorized domain error");
  }
  await browser.close();
})();
