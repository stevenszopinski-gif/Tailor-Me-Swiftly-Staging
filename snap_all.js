const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function run() {
    const server = spawn('npx', ['serve', '.', '-l', '8083']);
    await new Promise(r => setTimeout(r, 4000));

    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1000, height: 750 },
        colorScheme: 'light'
    });

    // Automatically dismiss any unexpected alerts/dialogs (like "Invalid JWT")
    page.on('dialog', async dialog => {
        console.log('Dismissing dialog:', dialog.message());
        await dialog.dismiss();
    });

    // Intercept results.js to append our auth bypass mocks at the end.
    // This prevents the page's hoisted function declarations from overwriting them!
    await page.route('**/results.js*', async route => {
        const response = await route.fetch();
        let body = await response.text();
        body += `\n
          window.guardToolAccess = async () => true;
          window.checkToolAccess = async () => ({ allowed: true });
          window.waitForSupabaseAuth = async () => ({ id: "mock-user-id", email: "mock@example.com" });
          window.alert = () => {};
      `;
        route.fulfill({
            response,
            body,
            headers: {
                ...response.headers(),
                'content-type': 'application/javascript'
            }
        });
    });

    await page.route('**/auth.js*', async route => {
        const response = await route.fetch();
        let body = await response.text();
        body += `\n
          window.checkPremiumStatus = async () => true;
          window.isPremiumUser = true;
          window.initAuthUI = () => {};
      `;
        route.fulfill({
            response,
            body,
            headers: {
                ...response.headers(),
                'content-type': 'application/javascript'
            }
        });
    });

    const mockOutputs = {
        targetCompany: "Google",
        jobText: "Senior Developer",
        resumeHtml: "<h2>Senior Developer</h2><p>Specialized in React and Node.js</p>",
        coverHtml: "<p>Dear Hiring Manager,</p><p>I am thrilled to apply for the Senior Developer role at Google...</p>",
        roastLines: ["Your summary is too general.", "Great use of metrics in the middle sections."],
        redFlags: [{ severity: 'critical', flag: 'Missing 4 skills', fix: 'Add Kubernetes to your skills' }],
        burnoutCheck: { flightRiskScore: 85, toxicityScore: 7.2 },
        matchScore: 92,
        interviewQa: "Q: Tell me about yourself.\nA: I am an engineer...",
        emailText: "Hi, I just applied...",
        missingKeywords: ["Kubernetes", "gRPC"],
        skillsData: { present: ["React", "Node"], missing: ["AWS"] }
    };

    async function snap(urlPath, filename, evaluateFn, scrollY = 0) {
        console.log('Snapping', urlPath, '->', filename);
        await page.goto(`http://localhost:8083/${urlPath}`, { waitUntil: 'domcontentloaded' });

        await page.evaluate((data) => {
            sessionStorage.setItem('tms_outputs', JSON.stringify(data));
        }, mockOutputs);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000); // let animations settle

        if (evaluateFn) {
            try {
                await page.evaluate(evaluateFn);
                await page.waitForTimeout(500); // Wait for scrolls/renders
            } catch (e) { console.error("Eval failed for", filename, e); }
        }
        if (scrollY) {
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
        }

        await page.screenshot({ path: filename });
    }

    // Main UI screens & Tools
    await snap('results.html', 'app-mockup.png');
    await snap('cover-letter.html', 'tool-cover-letter.png');
    await snap('outreach.html', 'tool-intro-email.png');

    await snap('results.html', 'tool-heatmap.png', () => { window.scrollTo(0, 0); });
    await snap('results.html', 'tool-roast.png', () => { const el = document.getElementById('roast-lines'); if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' }); });
    await snap('results.html', 'tool-redflag.png', () => { const el = document.getElementById('redflag-lines'); if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' }); });
    await snap('prove-it.html', 'tool-prove-it.png');
    await snap('video-intro.html', 'tool-video-intro.png');

    await snap('toxic-radar.html', 'tool-toxic.png', async () => {
        const input = document.querySelector('#company-input');
        if (input) input.value = 'WeWork';
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Analyze Culture'));
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 1500));
    });

    await snap('ghosting-predictor.html', 'tool-ghosting.png');
    await snap('results.html', 'tool-burnout.png', () => { const el = document.getElementById('burnout-content'); if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' }); });

    await snap('comp-decoder.html', 'tool-comp.png', async () => {
        const in1 = document.querySelector('#tc-input');
        if (in1) in1.value = '150000';
        const in2 = document.querySelector('#equity-input');
        if (in2) in2.value = '50000';
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Decode Offer'));
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 1500));
    });

    await snap('day-in-life.html', 'tool-day.png');
    await snap('skills-tracker.html', 'tool-skills.png');

    await snap('interview-prep.html', 'tool-mock.png', async () => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start'));
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 500));
    });

    await snap('salary-negotiator.html', 'tool-salary.png', async () => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start'));
        if (btn) btn.click();
        await new Promise(r => setTimeout(r, 1500)); // wait for AI response
    });

    await snap('tech-screen.html', 'tool-trial.png');
    await snap('reverse-interview.html', 'tool-reverse.png');
    await snap('thank-you.html', 'tool-thank.png');
    await snap('auto-app.html', 'tool-auto.png');
    await snap('shadow-jobs.html', 'tool-shadow.png');
    await snap('referral-mapper.html', 'tool-referral.png');
    await snap('guerrilla-tactics.html', 'tool-guerrilla.png');
    await snap('rejection-reverser.html', 'tool-rejection.png');

    // PILLARS 2 & 3
    await snap('learn/index.html', 'learning-mockup.png');
    await snap('news/briefing.html', 'news-mockup.png', () => {
        const playerArea = document.querySelector('.bottom-player-area');
        if (playerArea) {
            playerArea.style.display = 'block';
            playerArea.style.transform = 'translateY(0)';
            playerArea.classList.add('visible');
        }
    });

    await browser.close();
    server.kill();
    console.log("All tool screenshots captured with Auth bypassed.");
}
run();
