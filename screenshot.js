const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
    const server = spawn('npx', ['serve', '.', '-l', '8081']);
    await new Promise(r => setTimeout(r, 3000)); // allow server to start

    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1200, height: 800 },
        colorScheme: 'light'
    });

    // App Screenshot
    await page.goto('http://localhost:8081/app.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'app-mockup.png' });

    // Learning Screenshot
    await page.goto('http://localhost:8081/learn/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'learning-mockup.png' });

    // News Screenshot
    await page.goto('http://localhost:8081/news/briefing.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // let audio load
    await page.screenshot({ path: 'news-mockup.png' });

    await browser.close();
    server.kill();
    console.log("Screenshots captured successfully.");
}
run();
