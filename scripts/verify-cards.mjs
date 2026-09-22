// Automated test to create client, project, payment, and screenshot project card
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // 1. Login demo
  const demoBtn = page.locator('button:has-text("Continue to Workspace")');
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(1200);
  }

  // 2. Add client
  console.log('Adding client...');
  await page.click('button:has-text("Clients Hub")');
  await page.waitForTimeout(800);
  await page.click('button:has-text("+ Add Client")');
  await page.waitForTimeout(600);
  await page.fill('#modalClientName', 'SARL Algiers Tech');
  await page.click('#modalClientSubmit');
  await page.waitForTimeout(1000);

  // 3. Add Project
  console.log('Adding project...');
  await page.click('button:has-text("All Projects")');
  await page.waitForTimeout(800);
  await page.click('button:has-text("New Project")');
  await page.waitForTimeout(600);

  // Fill project form
  const nameInputs = page.locator('input[placeholder*="DecaByte"], input[required]');
  await nameInputs.first().fill('Fintech Mobile App');
  
  // Select client
  const clientSelect = page.locator('.slide-over-container select').first();
  await clientSelect.selectOption({ index: 1 });

  // Budget
  const budgetInput = page.locator('input[placeholder="150000"]');
  await budgetInput.fill('84000');

  // Submit project
  await page.click('.slide-over-container button[type="submit"]');
  await page.waitForTimeout(1000);

  // 4. Record Payment
  console.log('Recording payment...');
  await page.click('#sidebarPaymentsBtn');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Record Payment")');
  await page.waitForTimeout(800);

  // Select project & fill amount
  const paySelects = page.locator('.slide-over-container select');
  await paySelects.nth(0).selectOption({ index: 1 });
  await page.waitForTimeout(400);
  await paySelects.nth(1).selectOption({ index: 0 });
  await page.waitForTimeout(400);

  const amountInput = page.locator('.slide-over-container input[type="number"]');
  await amountInput.fill('24000');

  await page.click('.slide-over-container button[type="submit"]');
  await page.waitForTimeout(1200);

  // 5. Navigate back to All Projects to capture the card with Budget, Collected, Rest!
  console.log('Navigating to All Projects...');
  await page.click('button:has-text("All Projects")');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'projects_cards_with_rest.png', fullPage: false });
  console.log('Screenshot saved to projects_cards_with_rest.png');

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
