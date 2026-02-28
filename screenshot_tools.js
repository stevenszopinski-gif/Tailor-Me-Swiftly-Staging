const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
    const server = spawn('npx', ['serve', '.', '-l', '8081']);
    await new Promise(r => setTimeout(r, 3000));

    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1000, height: 700 }, // smaller viewport for modal images
        colorScheme: 'light'
    });

    async function takeScreenshot(url, filename, setupFn) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Inject dummy session data to bypass auth/empty states
        await page.evaluate(() => {
            sessionStorage.setItem('tms_outputs', JSON.stringify({
                targetCompany: "Acme Corp",
                jobText: "Senior Developer requiring 5 years of React and Node.",
                coverHtml: "<p>Dear Hiring Manager,</p><p>I am thrilled to apply for the Senior Developer position at Acme Corp. With over 6 years of experience building scalable applications using React and Node.js...</p>",
                matchScore: 85
            }));
            sessionStorage.setItem('tms_user', JSON.stringify({ email: "test@example.com" }));
        });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        if (setupFn) await setupFn(page);

        await page.screenshot({ path: filename });
        console.log("Captured", filename);
    }

    // 1. Cover Letter
    await takeScreenshot('http://localhost:8081/cover-letter.html', 'tool-cover-letter.png');

    // 2. Salary Negotiator
    await takeScreenshot('http://localhost:8081/salary-negotiator.html', 'tool-salary.png', async (p) => {
        // Click start negotiation to show the chat interface
        try {
            await p.click('button:has-text("Start Voice Negotiation")');
            await p.waitForTimeout(1500); // let the AI message load
        } catch (e) { }
    });

    // 3. Toxic Radar
    await takeScreenshot('http://localhost:8081/toxic-radar.html', 'tool-toxic.png', async (p) => {
        try {
            await p.fill('#company-input', 'WeWork');
            await p.click('button:has-text("Analyze Culture")');
            await p.waitForTimeout(2000);
        } catch (e) { }
    });

    // 4. Comp Decoder
    await takeScreenshot('http://localhost:8081/comp-decoder.html', 'tool-comp.png', async (p) => {
        try {
            await p.fill('#tc-input', '150000');
            await p.fill('#equity-input', '50000');
            await p.click('button:has-text("Decode Offer")');
            await p.waitForTimeout(1500);
        } catch (e) { }
    });

    await browser.close();
    server.kill();
    console.log("Tool screenshots captured.");
}
run();
