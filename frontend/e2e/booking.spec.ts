import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('salon_cookie_consent', 'all');
    window.localStorage.setItem('salon_lang', 'sv');
  });
});

test('public booking flow completes and shows a confirmation reference', async ({ page }) => {
  await page.goto('/booking');
  await expect(page.getByRole('heading', { name: 'Boka din tid' })).toBeVisible();

  // Step 1 — service
  await page.getByRole('button', { name: /Herrklippning/ }).click();
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 2 — staff (keep "Första tillgängliga")
  await expect(page.getByRole('button', { name: /Första tillgängliga/ })).toBeVisible();
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 3 — date: first available (enabled) day in the calendar grid
  const calendar = page.locator('.grid.grid-cols-7');
  await expect(calendar).toBeVisible();
  const firstAvailableDay = calendar.locator('button:not([disabled])').first();
  await expect(firstAvailableDay).toBeVisible();
  await firstAvailableDay.click();
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 4 — time: first offered slot
  const firstSlot = page.locator('.grid-cols-3 > button').first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 5 — customer details + consent
  await page.locator('#fullName').fill('E2E Testkund');
  await page.locator('#email').fill('e2e.testkund@example.com');
  await page.locator('#phone').fill('+46701234567');
  await page.locator('#notes').fill('Automated end-to-end test booking.');
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /Nästa/i }).click();

  // Step 6 — review and submit
  await expect(page.getByRole('heading', { name: 'Granska din bokning' })).toBeVisible();
  await page.getByRole('button', { name: /Bekräfta bokning/i }).click();

  // Confirmation
  await expect(page).toHaveURL(/\/booking\/confirmation\?ref=SLN-/);
  await expect(page.getByRole('heading', { name: 'Din tid är bokad' })).toBeVisible();
  await expect(page.getByText(/SLN-[A-Z0-9]{8}/)).toBeVisible();
});