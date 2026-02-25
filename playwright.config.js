const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 60000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:8080',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'npx serve . -l 8080',
        port: 8080,
        reuseExistingServer: true,
        timeout: 10000,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
