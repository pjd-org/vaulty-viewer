import { expect, test } from 'playwright/test';

const VIEWER_URL = process.env.VIEWER_URL || 'http://localhost:8080';

const SEED_USER = {
  email: 'dev1@example.com',
  password: 'Password123!',
} as const;

test('renders the authenticated viewer shell', async ({ page }) => {
  await page.goto(`${VIEWER_URL}/login`);

  await expect(page.locator('h2')).toContainText('Enter');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.fill('input[name="email"]', SEED_USER.email);
  await page.fill('input[name="password"]', SEED_USER.password);
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => url.pathname !== '/login');

  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.getByText('Viewer V3')).toBeVisible();
  await expect(page.getByText('COD command center')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vault home' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search viewer' })).toHaveCount(1);
  await expect(page.getByRole('searchbox', { name: 'Search viewer' })).toHaveAttribute('type', 'search');
  await expect(page.getByRole('link', { name: 'Review Inbox' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Create' })).toBeVisible();
  await expect(page).toHaveTitle('Vaulty Viewer');
});
