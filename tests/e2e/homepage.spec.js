const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        // Block external resources that slow down tests
        await page.route('**/*googlesyndication*/**', route => route.abort());
        await page.route('**/*supabase*/**', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{}'
        }));
    });

    test('loads and shows hero section', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/TailorMeSwiftly/);
        await expect(page.locator('.hp-hero h2')).toBeVisible();
    });

    test('header renders with navigation', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('header.app-header')).toBeVisible();
    });

    test('hero CTA button links to login', async ({ page }) => {
        await page.goto('/');
        const cta = page.locator('#hero-get-started-btn');
        await expect(cta).toBeVisible();
        await expect(cta).toHaveAttribute('href', 'login.html');
    });

    test('how it works section renders steps', async ({ page }) => {
        await page.goto('/');
        const steps = page.locator('.hp-step');
        const count = await steps.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    test('hero note badges are visible', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.hp-hero-note')).toBeVisible();
    });
});
