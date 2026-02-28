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

    // ==========================================
    // Application Mockup (Results Page w/ Mock Data)
    // ==========================================
    await page.goto('http://localhost:8081/results.html', { waitUntil: 'domcontentloaded' });

    // Inject mock state into sessionStorage so it renders a completed application
    await page.evaluate(() => {
        const mockData = {
            targetCompany: "Google",
            matchScore: 92,
            resumeHtml: "<h2>Senior Software Engineer</h2><p>Led development of distributed systems...</p>",
            coverHtml: "<p>Dear Hiring Manager,</p>",
            interviewQa: "Q: Tell me about yourself.\nA: I am an engineer...",
            emailText: "Hi, I just applied...",
            missingKeywords: ["Kubernetes", "gRPC"],
            roastLines: ["Your summary is a bit generic.", "Good use of metrics in the middle sections."],
            redFlags: [],
            skillsData: { present: ["React", "Node"], missing: ["AWS"] }
        };
        sessionStorage.setItem('tms_outputs', JSON.stringify(mockData));
        sessionStorage.setItem('tms_user', JSON.stringify({ email: "demo@user.com" })); // bypass auth redirect if any
    });

    // Reload to pick up session storage
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'app-mockup.png' });

    // ==========================================
    // Learning Mockup
    // ==========================================
    await page.goto('http://localhost:8081/learn/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'learning-mockup.png' });

    // ==========================================
    // News Mockup (Clicking audio player)
    // ==========================================
    await page.goto('http://localhost:8081/news/briefing.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Try to interact with the audio player if it exists so it shows in the screenshot
    try {
        await page.evaluate(() => {
            // Expand player layout if it isn't already visible
            const playerArea = document.querySelector('.bottom-player-area');
            if (playerArea) {
                playerArea.style.display = 'block';
                playerArea.style.transform = 'translateY(0)';
                playerArea.classList.add('visible');
            }
        });
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log("Could not force audio player visible:", e);
    }

    await page.screenshot({ path: 'news-mockup.png' });

    await browser.close();
    server.kill();
    console.log("Screenshots captured successfully.");
}
run();
