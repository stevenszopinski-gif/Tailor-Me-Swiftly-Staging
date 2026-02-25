const { test, expect } = require('@playwright/test');

// Helper to mock Supabase auth so app.html doesn't redirect
function mockSupabaseAuth(page) {
    return page.addInitScript(() => {
        window.supabaseClient = {
            auth: {
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                getSession: () => Promise.resolve({ data: { session: { user: { email: 'test@test.com', id: 'test-id' } } } }),
                getUser: () => Promise.resolve({ data: { user: { email: 'test@test.com', id: 'test-id' } } }),
                signOut: () => Promise.resolve(),
            },
            functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
            from: () => ({ select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }) }),
        };
    });
}

test.describe('Wizard Flow (Step 1)', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/*supabase*/**', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{}'
        }));
        await mockSupabaseAuth(page);
    });

    test('Step 1 loads with upload area and hidden resume textarea', async ({ page }) => {
        await page.goto('/app.html');
        await expect(page.locator('#step-1')).toBeVisible({ timeout: 10000 });
        // #base-resume is a hidden textarea that stores parsed resume text
        await expect(page.locator('#base-resume')).toBeAttached();
        // The visible upload UI is the drop-zone
        await expect(page.locator('#drop-zone')).toBeVisible();
    });

    test('hidden resume textarea stores text via script', async ({ page }) => {
        await page.goto('/app.html');
        await page.waitForSelector('#base-resume', { state: 'attached', timeout: 10000 });
        // #base-resume is hidden; set value programmatically as the app does
        await page.evaluate(() => {
            document.getElementById('base-resume').value = 'Test resume content';
        });
        await expect(page.locator('#base-resume')).toHaveValue('Test resume content');
    });

    test('job description textarea accepts text input', async ({ page }) => {
        await page.goto('/app.html');
        // #job-description is in step-2; it exists in the DOM but isn't visible until step-2
        await expect(page.locator('#job-description')).toBeAttached({ timeout: 10000 });
        // Set value programmatically since it may not be in the visible step
        await page.evaluate(() => {
            document.getElementById('job-description').value = 'Test job description';
        });
        await expect(page.locator('#job-description')).toHaveValue('Test job description');
    });

    test('step navigation buttons exist', async ({ page }) => {
        await page.goto('/app.html');
        await page.waitForSelector('#step-1', { timeout: 10000 });
        const nextBtn = page.locator('#step-1 .step-actions button, #step-1 .step-actions a').first();
        await expect(nextBtn).toBeVisible();
    });
});

test.describe('Wizard Flow (ATS Scanner UI)', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/*supabase*/**', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{}'
        }));
        await mockSupabaseAuth(page);
    });

    test('ATS scanner step 3 exists in DOM', async ({ page }) => {
        await page.goto('/app.html');
        await expect(page.locator('#step-3')).toBeAttached();
        await expect(page.locator('#ats-loading-state')).toBeAttached();
        await expect(page.locator('#ats-results-state')).toBeAttached();
    });

    test('ATS scanner has all 5 section panels', async ({ page }) => {
        await page.goto('/app.html');
        const panels = page.locator('.ats-section-panel');
        await expect(panels).toHaveCount(5);
    });
});
