const { test, expect } = require('@playwright/test');

test.describe('Authentication Pages', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/*supabase*/**', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{}'
        }));
        await page.route('**/*googlesyndication*/**', route => route.abort());
    });

    test('login page loads with email and password fields', async ({ page }) => {
        await page.goto('/login.html');
        await expect(page.locator('#email-input')).toBeVisible();
        await expect(page.locator('#password-input')).toBeVisible();
    });

    test('signup page loads with form fields', async ({ page }) => {
        await page.goto('/signup.html');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('login page has link to signup', async ({ page }) => {
        await page.goto('/login.html');
        const signupLink = page.locator('a[href*="signup"]');
        await expect(signupLink).toBeVisible();
    });

    test('signup page has link to login', async ({ page }) => {
        await page.goto('/signup.html');
        const loginLink = page.locator('a[href*="login"]');
        await expect(loginLink).toBeVisible();
    });

    test('login form has submit button', async ({ page }) => {
        await page.goto('/login.html');
        await expect(page.locator('#email-login-btn')).toBeVisible();
    });
});

test.describe('Static Pages', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/*googlesyndication*/**', route => route.abort());
    });

    test('privacy policy page loads', async ({ page }) => {
        await page.goto('/privacy.html');
        await expect(page).toHaveTitle(/Privacy|TailorMeSwiftly/);
    });

    test('terms page loads', async ({ page }) => {
        await page.goto('/terms.html');
        await expect(page).toHaveTitle(/Terms|TailorMeSwiftly/);
    });
});
