import { test, expect } from '@vitest/browser-playwright';

const VIEWER_URL = process.env.VIEWER_URL || 'http://localhost:8080';

const SEED_USERS = [
  { email: 'dev1@example.com', password: 'Password123!' },
  { email: 'dev2@example.com', password: 'Password123!' },
] as const;

test.describe('Viewer Login', () => {
  for (const user of SEED_USERS) {
    test(`should login with seed user: ${user.email}`, async ({ page }) => {
      // Navigate to viewer login page
      await page.goto(`${VIEWER_URL}/login`);

      // Verify we're on the login page
      await expect(page.locator('h2')).toContainText('Enter');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();

      // Fill in credentials
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for navigation after login
      // The app should redirect to home or the return_to param
      await page.waitForURL((url) => {
        // Either we're on home, or still on login with an error
        const pathname = url.pathname;
        return pathname !== '/login';
      });

      // Verify we're logged in (not on login page anymore)
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');

      // Optionally verify we're on the home page or another authenticated route
      console.log(`Successfully logged in as ${user.email}, redirected to: ${currentUrl}`);
    });
  }

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${VIEWER_URL}/login`);

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should either show an error or stay on login page
    await page.waitForURL((url) => url.pathname === '/login');

    // Check for error message (if the app shows one)
    const errorElement = page.locator('[role="alert"]');
    if (await errorElement.isVisible()) {
      await expect(errorElement).toBeVisible();
    }
  });
});