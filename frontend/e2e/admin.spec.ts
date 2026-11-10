import { test, expect } from '@playwright/test';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('salon_cookie_consent', 'all');
    window.localStorage.setItem('salon_lang', 'sv');
  });
});

test('admin can log in and view the dashboard', async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!email || !password, 'ADMIN_EMAIL / ADMIN_PASSWORD not present in backend/.env');

  await page.goto('/admin/login');
  await expect(page.getByRole('heading', { name: 'Personalinloggning' })).toBeVisible();

  await page.locator('#email').fill(email!);
  await page.locator('#password').fill(password!);
  await page.getByRole('button', { name: /Logga in/i }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Översikt' })).toBeVisible();
  await expect(page.getByText('Bokningar idag', { exact: true })).toBeVisible();
  await expect(page.getByText('Närmast kommande', { exact: true })).toBeVisible();
});

test('unauthenticated visitor is redirected from the dashboard to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Personalinloggning' })).toBeVisible();
});