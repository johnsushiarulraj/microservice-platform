import { chromium } from 'playwright';

const BASE = 'http://localhost:18090';
const SCREENSHOTS_DIR = './screenshots';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Catch console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  console.log('=== UI TEST ===\n');

  // 1. Landing → should redirect to login
  console.log('1. Landing page');
  await page.goto(`${BASE}/devconsole/`);
  await page.waitForTimeout(3000);
  console.log(`   URL: ${page.url()}`);
  console.log(`   Redirected to login: ${page.url().includes('login') ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-login-redirect.png`, fullPage: true });

  // 2. Create Service (public, via link on login page)
  console.log('\n2. Create Service (public)');
  await page.click('text=Create a Microservice');
  await page.waitForTimeout(2000);
  const createVisible = await page.locator('text=Service Name').isVisible().catch(() => false);
  console.log(`   Service Name form visible: ${createVisible ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-create-service.png`, fullPage: true });

  // 3. Learn (public, via sidebar)
  console.log('\n3. Learn (public)');
  await page.click('aside >> text=Learn');
  await page.waitForTimeout(2000);
  const learnVisible = await page.locator('text=Getting Started').first().isVisible().catch(() => false);
  console.log(`   Getting Started visible: ${learnVisible ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-learn.png`, fullPage: true });

  // 4. Login
  console.log('\n4. Login');
  await page.click('aside >> text=Sign In');
  await page.waitForTimeout(1000);
  await page.fill('input[placeholder="testuser"]', 'testuser');
  await page.fill('input[placeholder="password"]', 'password');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(4000);
  console.log(`   URL after login: ${page.url()}`);
  const loginSuccess = !page.url().includes('login');
  console.log(`   Login success: ${loginSuccess ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-after-login.png`, fullPage: true });

  // 5. Dashboard (should show health + services now)
  console.log('\n5. Dashboard');
  await page.waitForTimeout(2000);
  const healthUps = await page.locator('text=UP').count();
  const releases = await page.locator('text=releases').textContent().catch(() => '?');
  console.log(`   Health UPs: ${healthUps}`);
  console.log(`   Releases text: ${releases}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-dashboard.png`, fullPage: true });

  // 6. Services (via sidebar click)
  console.log('\n6. Services');
  await page.click('aside >> text=Services');
  await page.waitForTimeout(3000);
  const servicesVisible = await page.locator('text=Helm Releases').isVisible().catch(() => false);
  const serviceCount = await page.locator('table tbody tr').count().catch(() => 0);
  console.log(`   Helm Releases visible: ${servicesVisible ? 'PASS' : 'FAIL'}`);
  console.log(`   Service rows: ${serviceCount}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-services.png`, fullPage: true });

  // 7. SQS (via sidebar)
  console.log('\n7. SQS Manager');
  await page.click('aside >> text=SQS Queues');
  await page.waitForTimeout(3000);
  const sqsVisible = await page.locator('text=SQS Queues').isVisible().catch(() => false);
  console.log(`   SQS page visible: ${sqsVisible ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-sqs.png`, fullPage: true });

  // 8. S3 (via sidebar)
  console.log('\n8. S3 Manager');
  await page.click('aside >> text=S3 Storage');
  await page.waitForTimeout(3000);
  const s3Visible = await page.locator('text=S3 Storage').isVisible().catch(() => false);
  console.log(`   S3 page visible: ${s3Visible ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-s3.png`, fullPage: true });

  // 9. Change Password
  console.log('\n9. Change Password');
  await page.click('aside >> text=Change Password');
  await page.waitForTimeout(2000);
  const pwVisible = await page.locator('text=Change Password').first().isVisible().catch(() => false);
  console.log(`   Change Password visible: ${pwVisible ? 'PASS' : 'FAIL'}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-change-password.png`, fullPage: true });

  // 10. Sidebar check
  console.log('\n10. Sidebar');
  const sidebar = await page.locator('aside').textContent();
  console.log(`   Has Dashboard: ${sidebar.includes('Dashboard') ? 'PASS' : 'FAIL'}`);
  console.log(`   Has Services: ${sidebar.includes('Services') ? 'PASS' : 'FAIL'}`);
  console.log(`   Has Grafana: ${sidebar.includes('Grafana') ? 'PASS' : 'FAIL'}`);
  console.log(`   Has Sign Out: ${sidebar.includes('Sign Out') ? 'PASS' : 'FAIL'}`);
  console.log(`   Has testuser: ${sidebar.includes('testuser') ? 'PASS' : 'FAIL'}`);

  // 11. Console errors
  console.log(`\n11. Console errors: ${errors.length}`);
  errors.slice(0, 5).forEach(e => console.log(`    ${e.substring(0, 100)}`));

  await browser.close();
  console.log('\n=== DONE — screenshots in ./screenshots/ ===');
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
