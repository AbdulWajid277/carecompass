/**
 * Silent CareCompass walkthrough video recorder (no voice).
 * Produces a ~3-5 minute demo covering every major feature.
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'video-raw');
const FINAL_DIR = path.join(__dirname);
const BASE = process.env.APP_URL || 'http://localhost:5173';

async function pause(page, ms = 1800) {
  // Target a 3–5 minute silent demo
  await page.waitForTimeout(Math.round(ms * 3.4));
}

async function highlight(page, selector) {
  await page.evaluate((sel) => {
    document.querySelectorAll('[data-demo-highlight]').forEach((el) => {
      el.removeAttribute('data-demo-highlight');
      el.style.outline = '';
    });
    const el = document.querySelector(sel);
    if (el) {
      el.setAttribute('data-demo-highlight', '1');
      el.style.outline = '3px solid #c45c26';
      el.style.outlineOffset = '3px';
    }
  }, selector);
}

async function clearHighlight(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-demo-highlight]').forEach((el) => {
      el.removeAttribute('data-demo-highlight');
      el.style.outline = '';
    });
  });
}

async function showBanner(page, text) {
  await page.evaluate((msg) => {
    let banner = document.getElementById('demo-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'demo-banner';
      banner.style.cssText =
        'position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;' +
        'background:rgba(15,92,76,0.95);color:#fff;padding:12px 16px;' +
        'border-radius:12px;font:600 16px Nunito,Segoe UI,sans-serif;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.25);text-align:center;';
      document.body.appendChild(banner);
    }
    banner.textContent = msg;
  }, text);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--window-size=1400,900'],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1400, height: 900 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // 1) Home
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await showBanner(page, 'CareCompass walkthrough — silent feature demo');
  await pause(page, 2500);

  await showBanner(page, 'Accessibility: Skip link + keyboard focus');
  await page.focus('a.skip-link');
  await page.keyboard.press('Tab');
  await pause(page, 900);
  await page.keyboard.press('Tab');
  await pause(page, 900);
  await page.keyboard.press('Tab');
  await pause(page, 1200);

  await showBanner(page, 'Home navigation: Find help, AI guide, Sign in, Register');
  await page.click('a[href="/search"]');
  await pause(page, 1400);
  await page.click('a[href="/assistant"]');
  await pause(page, 1400);
  await page.click('a[href="/login"]');
  await pause(page, 1200);
  await page.click('a[href="/register"]');
  await pause(page, 1200);
  await page.click('a.brand');
  await pause(page, 1500);

  await showBanner(page, 'Home: Search resources CTA');
  await highlight(page, 'a.btn.btn-primary[href="/search"]');
  await pause(page, 1200);
  await page.click('a.btn.btn-primary[href="/search"]');
  await pause(page, 1800);

  // 2) Search
  await showBanner(page, 'Search: filters, categories, results');
  await page.fill('#q', 'food pantry');
  await page.fill('#city', 'Austin');
  await page.selectOption('#language', { label: 'Spanish' });
  await pause(page, 1000);
  await page.click('button.chip:has-text("Food")');
  await pause(page, 800);
  await page.click('button.btn.btn-solid:has-text("Search")');
  await pause(page, 2200);

  await showBanner(page, 'Open a resource detail page');
  const firstResult = page.locator('.resource-item').first();
  await firstResult.click();
  await pause(page, 2500);

  // 3) Register invalid
  await showBanner(page, 'Register form: invalid input (error handling)');
  await page.click('a[href="/register"]');
  await pause(page, 1200);
  await page.fill('#fullName', 'A');
  await page.fill('#email', 'not-an-email');
  await page.fill('#password', 'short');
  await page.click('button[type="submit"]');
  await pause(page, 2200);

  // 4) Login invalid then valid
  await showBanner(page, 'Login: invalid credentials');
  await page.click('a[href="/login"]');
  await pause(page, 1000);
  await page.fill('#email', 'maria@example.com');
  await page.fill('#password', 'wrong-password');
  await page.click('button[type="submit"]');
  await pause(page, 2200);

  await showBanner(page, 'Login: valid demo user');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await pause(page, 2200);

  // 5) Favorite + favorites page
  await showBanner(page, 'Save a favorite from resource details');
  await page.goto(`${BASE}/search?category=food&city=Austin`, { waitUntil: 'networkidle' });
  await pause(page, 1200);
  await page.locator('.resource-item').first().click();
  await pause(page, 1500);
  await page.click('button:has-text("Save to favorites")');
  await pause(page, 1800);

  await showBanner(page, 'Favorites page: view saved resources');
  await page.click('a[href="/favorites"]');
  await pause(page, 2500);

  // 6) AI guide
  await showBanner(page, 'AI guide: valid question');
  await page.click('a[href="/assistant"]');
  await pause(page, 1200);
  await page.fill('#question', 'I need food assistance in Austin this week');
  await page.selectOption('#language', 'en');
  await page.click('button[type="submit"]');
  await pause(page, 4000);

  await showBanner(page, 'AI guide: invalid short question (error handling)');
  await page.fill('#question', 'hi');
  await page.click('button[type="submit"]');
  await pause(page, 2200);

  // 7) Admin
  await showBanner(page, 'Sign out, then admin login');
  await page.click('button.linkish:has-text("Sign out")');
  await pause(page, 1200);
  await page.click('a[href="/login"]');
  await page.fill('#email', 'admin@carecompass.org');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await pause(page, 2500);

  await showBanner(page, 'Admin dashboard: stats + resources');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await pause(page, 2800);
  await page.evaluate(() => window.scrollTo(0, 400));
  await pause(page, 1500);
  await page.evaluate(() => window.scrollTo(0, 900));
  await pause(page, 1800);

  // 8) 404 + home wrap-up
  await showBanner(page, 'Error handling: unknown route 404');
  await page.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: 'networkidle' });
  await pause(page, 2500);

  await showBanner(page, 'Walkthrough complete — CareCompass features verified');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await pause(page, 3000);

  await clearHighlight(page);
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  const target = path.join(FINAL_DIR, 'CareCompass-Walkthrough-Silent.webm');
  if (fs.existsSync(target)) fs.unlinkSync(target);
  fs.copyFileSync(videoPath, target);

  // Also copy into Downloads if possible
  const downloads = path.join(process.env.USERPROFILE || '', 'Downloads', 'CareCompass-Walkthrough-Silent.webm');
  try {
    fs.copyFileSync(target, downloads);
  } catch {
    // ignore
  }

  console.log('VIDEO_READY', target);
  if (fs.existsSync(downloads)) console.log('DOWNLOADS', downloads);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
