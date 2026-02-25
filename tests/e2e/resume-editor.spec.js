const { test, expect } = require('@playwright/test');

const MOCK_OUTPUT = {
    resumeHtml: '<h1>John Doe</h1><p>john@example.com | 555-1234</p><h2>Professional Experience</h2><h3>Software Engineer | Acme Corp | 2020 - Present</h3><ul><li>Built scalable web applications</li><li>Led team of 5 engineers</li></ul><h2>Education</h2><h3>B.S. Computer Science | MIT | 2020</h3><h2>Skills</h2><p>JavaScript, Python, React, Node.js</p>',
    applicantName: 'John Doe',
    targetCompany: 'Acme Corp',
    matchScore: 85,
    missingKeywords: ['AWS', 'Docker'],
    companyPrimaryColor: '#1a1a2e',
    resumeText: 'John Doe resume text',
    jobText: 'Software Engineer job description'
};

test.describe('Resume Editor Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/*supabase*/**', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{}'
        }));
        await page.route('**/*googlesyndication*/**', route => route.abort());
        await page.addInitScript((data) => {
            sessionStorage.setItem('tms_outputs', JSON.stringify(data));
        }, MOCK_OUTPUT);
    });

    test('resume output area renders HTML content', async ({ page }) => {
        await page.goto('/resume.html');
        const output = page.locator('#resume-output');
        await expect(output).toBeVisible({ timeout: 10000 });
        await expect(output.locator('h1')).toContainText('John Doe');
    });

    test('resume output is contenteditable', async ({ page }) => {
        await page.goto('/resume.html');
        const output = page.locator('#resume-output');
        await expect(output).toHaveAttribute('contenteditable', 'true');
    });

    test('template grid renders template options', async ({ page }) => {
        await page.goto('/resume.html');
        const grid = page.locator('#template-grid');
        await expect(grid).toBeVisible({ timeout: 10000 });
        const cards = grid.locator('.template-card');
        const count = await cards.count();
        expect(count).toBeGreaterThan(5);
    });

    test('clicking a template card switches the theme class', async ({ page }) => {
        await page.goto('/resume.html');
        await page.waitForSelector('.template-card', { timeout: 10000 });
        const output = page.locator('#resume-output');
        const cards = page.locator('.template-card');

        if (await cards.count() > 2) {
            await cards.nth(2).click();
            await page.waitForTimeout(300);
            const classes = await output.getAttribute('class');
            expect(classes).toMatch(/theme-/);
        }
    });

    test('copy and download buttons exist in download panel', async ({ page }) => {
        await page.goto('/resume.html');
        // Buttons are inside a panel that opens on demand; verify they exist in the DOM
        await expect(page.locator('#copy-btn')).toBeAttached({ timeout: 10000 });
        await expect(page.locator('#download-btn')).toBeAttached();
    });

    test('resume contains expected sections', async ({ page }) => {
        await page.goto('/resume.html');
        const output = page.locator('#resume-output');
        await expect(output).toBeVisible({ timeout: 10000 });
        await expect(output.locator('h2').first()).toContainText('Professional Experience');
        await expect(output.locator('h3').first()).toContainText('Software Engineer');
    });
});

test.describe('Resume Editor - Template Switching', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/*supabase*/**', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{}'
        }));
        await page.route('**/*googlesyndication*/**', route => route.abort());
        await page.addInitScript((data) => {
            sessionStorage.setItem('tms_outputs', JSON.stringify(data));
        }, MOCK_OUTPUT);
    });

    test('each template produces a distinct theme class', async ({ page }) => {
        await page.goto('/resume.html');
        await page.waitForSelector('.template-card', { timeout: 10000 });
        const output = page.locator('#resume-output');
        const cards = page.locator('.template-card');
        const count = await cards.count();

        const themes = new Set();
        for (let i = 0; i < Math.min(count, 5); i++) {
            await cards.nth(i).click();
            await page.waitForTimeout(200);
            const cls = await output.getAttribute('class');
            const match = cls.match(/theme-[\w-]+/);
            if (match) themes.add(match[0]);
        }
        expect(themes.size).toBeGreaterThanOrEqual(3);
    });
});
