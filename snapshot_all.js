const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
    const server = spawn('npx', ['serve', '.', '-l', '8082']);
    await new Promise(r => setTimeout(r, 4000));

    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1000, height: 750 },
        colorScheme: 'light'
    });

    const mockOutputs = {
        targetCompany: "Google",
        jobText: "Senior Developer",
        resumeHtml: "", coverHtml: "",
        roastLines: ["Your summary is too general.", "Great use of metrics in the middle sections."],
        redFlags: [{ severity: 'critical', flag: 'Missing 4 skills', fix: 'Add Kubernetes to your skills' }],
        burnoutCheck: { flightRiskScore: 85, toxicityScore: 7.2 },
    };

    async function snap(urlPath, filename, evaluateFn) {
        console.log('Snapping', urlPath, '->', filename);
        await page.goto(`http://localhost:8082/${urlPath}`, { waitUntil: 'domcontentloaded' });

        await page.evaluate((data) => {
            sessionStorage.setItem('tms_outputs', JSON.stringify(data));
            sessionStorage.setItem('tms_user', JSON.stringify({ email: "test@example.com" }));
        }, mockOutputs);

        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000); // let animations settle

        if (evaluateFn) {
            try {
                await page.evaluate(evaluateFn);
                await page.waitForTimeout(500); // Wait for scrolls/renders
            } catch (e) { console.error("Eval failed for", filename, e); }
        }

        await page.screenshot({ path: filename });
    }

    await snap('outreach.html', 'tool-intro-email.png');
    await snap('results.html', 'tool-roast.png', () => {
        const el = document.getElementById('roast-lines');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await snap('results.html', 'tool-redflag.png', () => {
        const el = document.getElementById('redflag-lines');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await snap('results.html', 'tool-burnout.png', () => {
        const el = document.getElementById('burnout-content');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await snap('prove-it.html', 'tool-prove-it.png');
    await snap('video-intro.html', 'tool-video-intro.png');
    await snap('ghosting-predictor.html', 'tool-ghosting.png');
    await snap('day-in-life.html', 'tool-day.png');
    await snap('skills-tracker.html', 'tool-skills.png');
    await snap('interview-prep.html', 'tool-mock.png', () => {
        const btn = document.querySelector('button');
        if (btn && btn.textContent.includes('Start')) btn.click();
    });
    await snap('tech-screen.html', 'tool-trial.png');
    await snap('reverse-interview.html', 'tool-reverse.png');
    await snap('thank-you.html', 'tool-thank.png');
    await snap('auto-app.html', 'tool-auto.png');
    await snap('shadow-jobs.html', 'tool-shadow.png');
    await snap('referral-mapper.html', 'tool-referral.png');
    await snap('guerrilla-tactics.html', 'tool-guerrilla.png');
    await snap('rejection-reverser.html', 'tool-rejection.png');

    await snap('results.html', 'tool-heatmap.png', () => {
        window.scrollTo(0, 0);
    });

    await browser.close();
    server.kill();
    console.log("All tool screenshots captured.");
}
run();
