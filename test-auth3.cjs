const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://paperx-xi.vercel.app');
  await new Promise(r => setTimeout(r, 2000));
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.evaluate(async () => {
    try {
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      
      const app = initializeApp({
        projectId: "paper-x-a541a",
        appId: "1:468428996134:web:b1a86924b6f21bbc05b0e7",
        apiKey: "AIzaSyA3_012L7AqK5B14TJwtrQO4Va2dmbn-G8",
        authDomain: "paper-x-a541a.firebaseapp.com"
      });
      const auth = getAuth(app);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch(e) {
      console.log("AUTH ERROR:", e.code, e.message);
    }
  });
  
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
