const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('https://paperx-xi.vercel.app');
  
  // Clear all storage to ensure fresh state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  
  await page.reload({ waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking sign in...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Sign in with Google') || b.textContent.includes('Sign up with Google'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const html = await page.content();
  if (html.includes('authorized domains list for project')) {
    console.log("Found unauthorized domain error in HTML");
    
    // Extract the exact error text
    const errorText = await page.evaluate(() => {
       const el = document.querySelector('.text-red-600, .bg-red-50');
       return el ? el.innerText : 'Not found';
    });
    console.log("Error text:", errorText);
  } else {
    console.log("No unauthorized domain error");
  }
  
  await browser.close();
})();
