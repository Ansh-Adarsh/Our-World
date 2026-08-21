const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'laptop_1280', width: 1280, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 }
  ];

  const routes = [
    { path: '/login', name: 'login', auth: false },
    { path: '/home', name: 'home', auth: true, onboardingStatus: 'completed' },
    { path: '/onboarding', name: 'onboarding_welcome', auth: true, onboardingStatus: 'not_started' },
    { path: '/onboarding', name: 'onboarding_details', auth: true, onboardingStatus: 'completed' },
    { path: '/memories', name: 'memories', auth: true, onboardingStatus: 'completed' },
    { path: '/more', name: 'more', auth: true, onboardingStatus: 'completed' },
    { path: '/diary', name: 'diary', auth: true, onboardingStatus: 'completed' },
    { path: '/messages', name: 'messages', auth: true, onboardingStatus: 'completed' },
    { path: '/events', name: 'events', auth: true, onboardingStatus: 'completed' },
    { path: '/playlist', name: 'playlist', auth: true, onboardingStatus: 'completed' },
    { path: '/gifts', name: 'gifts', auth: true, onboardingStatus: 'completed' },
    { path: '/quizzes', name: 'quizzes', auth: true, onboardingStatus: 'completed' },
    { path: '/understanding', name: 'understanding', auth: true, onboardingStatus: 'completed' },
    { path: '/settings', name: 'settings', auth: true, onboardingStatus: 'completed' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    
    // Initial page load
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    
    for (const r of routes) {
      if (r.auth) {
        await page.evaluate((targetStatus, targetPath) => {
          if (window.__setDevAuth) {
            window.__setDevAuth(targetStatus);
          }
          window.history.pushState(null, '', targetPath);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, r.onboardingStatus, r.path);
      } else {
        await page.evaluate(() => {
          if (window.__useAuthStore) {
            window.__useAuthStore.setState({ isAuthenticated: false, user: null, couple: null });
          }
          window.history.pushState(null, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
      }

      await new Promise(res => setTimeout(res, 1500)); // wait for React async fetch & Framer Motion transitions

      if (r.name === 'onboarding_details') {
        try {
          const btns = await page.$$('button');
          for (const btn of btns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('READY')) {
              await btn.click();
              // Wait for animations and data fetching to settle
              await new Promise(r => setTimeout(r, 1200));
              break;
            }
          }
        } catch (e) {}
      }

      const imgPath = path.join(outDir, `${r.name}_${vp.name}.png`);
      await page.screenshot({ path: imgPath, fullPage: false });
      console.log(`Captured: ${r.name}_${vp.name}.png`);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
