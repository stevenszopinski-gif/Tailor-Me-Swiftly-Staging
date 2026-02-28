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

    // ── App Screenshot (resume.html — the tailored resume editor) ──
    // Pre-seed sessionStorage with mock resume data so the page doesn't show "Session Expired"
    await page.goto('http://localhost:8081/resume.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        const mockResume = `
            <h1 style="font-size:1.6rem;margin:0 0 0.2rem;color:var(--r-accent,#10b981);">Alex Chen</h1>
            <p style="font-size:0.82rem;color:#666;margin:0 0 0.75rem;">San Francisco, CA &bull; alex.chen@email.com &bull; (555) 123-4567 &bull; linkedin.com/in/alexchen</p>
            <p style="font-size:0.85rem;line-height:1.6;margin:0 0 1rem;color:#444;">Full-stack engineer with 7+ years building scalable web apps and cloud infrastructure. Shipped AI-powered products from concept to production, reduced deployment times by 40%, and mentored teams of 5+ engineers.</p>
            <h2 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--r-accent,#10b981);border-bottom:2px solid var(--r-accent,#10b981);padding-bottom:0.3rem;margin:1.25rem 0 0.75rem;">Experience</h2>
            <div style="margin-bottom:1rem;"><div style="display:flex;justify-content:space-between;"><strong>Senior Software Engineer</strong><span style="font-size:0.78rem;color:#888;">2022 — Present</span></div><div style="font-size:0.82rem;color:#666;margin-bottom:0.4rem;">Nexora Technologies — San Francisco, CA</div><ul style="margin:0;padding-left:1.2rem;font-size:0.84rem;line-height:1.65;color:#444;"><li>Architected real-time fraud detection pipeline processing 2M+ transactions daily, reducing false positives by 35%</li><li>Led migration of 12 microservices to Kubernetes, cutting infrastructure costs by $180K/year</li><li>Built internal developer portal using Backstage, reducing onboarding from 2 weeks to 3 days</li></ul></div>
            <div style="margin-bottom:1rem;"><div style="display:flex;justify-content:space-between;"><strong>Software Engineer II</strong><span style="font-size:0.78rem;color:#888;">2019 — 2022</span></div><div style="font-size:0.82rem;color:#666;margin-bottom:0.4rem;">Cloudbridge Inc. — Remote</div><ul style="margin:0;padding-left:1.2rem;font-size:0.84rem;line-height:1.65;color:#444;"><li>Built CI/CD features for Next.js deployments handling 500K+ builds/month with 99.97% uptime</li><li>Implemented edge caching reducing median page loads by 62%</li><li>Shipped AI-powered build error explanations adopted by 40% of active teams</li></ul></div>
            <h2 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--r-accent,#10b981);border-bottom:2px solid var(--r-accent,#10b981);padding-bottom:0.3rem;margin:1.25rem 0 0.75rem;">Education</h2>
            <div style="display:flex;justify-content:space-between;"><strong>B.S. Computer Science</strong><span style="font-size:0.78rem;color:#888;">2019</span></div><div style="font-size:0.82rem;color:#666;margin-bottom:0.75rem;">University of California, Berkeley</div>
            <h2 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--r-accent,#10b981);border-bottom:2px solid var(--r-accent,#10b981);padding-bottom:0.3rem;margin:1.25rem 0 0.75rem;">Skills</h2>
            <p style="font-size:0.84rem;line-height:1.65;color:#444;margin:0;">TypeScript, Python, Go, React, Next.js, Node.js, PostgreSQL, Redis, Kubernetes, Docker, AWS, GCP, Terraform, CI/CD, GraphQL</p>`;
        sessionStorage.setItem('tms_outputs', JSON.stringify({ resumeHtml: mockResume, applicantName: 'Alex Chen' }));
    });
    // Reload so the page picks up the sessionStorage data
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
        // Close the templates panel for a cleaner view
        const panel = document.getElementById('editor-panel');
        if (panel) panel.style.display = 'none';
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'app-mockup.png' });

    // ── Learning Screenshot ──
    await page.goto('http://localhost:8081/learn/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'learning-mockup.png' });

    // ── News Screenshot (briefing.html with mock generated briefing) ──
    await page.goto('http://localhost:8081/news/briefing.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
        // Hide input section and "New Briefing" header
        const inputSection = document.getElementById('input-section');
        if (inputSection) inputSection.style.display = 'none';
        const stepHeader = document.querySelector('.step-header');
        if (stepHeader) stepHeader.style.display = 'none';

        // Show result section
        const resultSection = document.getElementById('result-section');
        if (resultSection) resultSection.style.display = 'block';

        // Set read time
        const readTime = document.getElementById('briefing-read-time');
        if (readTime) readTime.innerHTML = '<i class="fa-regular fa-clock" style="margin-right:0.3rem;"></i>4 min read';

        // Set interest tags
        const tags = document.getElementById('briefing-interests');
        if (tags) tags.innerHTML = ['Cloud Infrastructure', 'DevOps', 'AI/ML', 'Startups', 'Open Source'].map(t =>
            '<span class="interest-tag">' + t + '</span>'
        ).join('');

        // Set briefing content
        const content = document.getElementById('briefing-content');
        if (content) content.innerHTML = `
            <p class="briefing-thesis"><strong>THE HEADLINE:</strong> The cloud infrastructure war is quietly being reshaped by AI-native tooling, and the companies investing in developer experience today are positioning themselves to dominate tomorrow.</p>

            <p>A wave of new funding and product launches this week underscores a critical shift in how engineering teams are building and deploying software. <a href="#" class="briefing-cite">[TechCrunch]</a> reports that Vercel has closed a $250M Series E at a $3.5B valuation, with CEO Guillermo Rauch explicitly positioning the platform as "the operating system for AI-first applications." Meanwhile, <a href="#" class="briefing-cite">[The Pragmatic Engineer]</a> notes that internal surveys at major tech companies show developer satisfaction with cloud tooling at an all-time low, creating a vacuum that startups are rushing to fill.</p>

            <p>The open source community is responding in kind. Kubernetes adoption continues to climb, but the real story is the ecosystem growing around it. <a href="#" class="briefing-cite">[InfoQ]</a> highlights that Backstage, Spotify's open-source developer portal, has crossed 25,000 GitHub stars and is being adopted by enterprises including BMW and Netflix as their default internal platform. This trend toward "platform engineering" is not just a buzzword — it represents a fundamental rethinking of how DevOps teams deliver value.</p>

            <p>On the AI front, <a href="#" class="briefing-cite">[Ars Technica]</a> covered the launch of Amazon CodeWhisperer's new "agent mode," which can now autonomously scaffold entire microservices from natural language descriptions. Early benchmarks suggest it reduces boilerplate setup time by 60%. Combined with GitHub Copilot's recent workspace-aware features <a href="#" class="briefing-cite">[GitHub Blog]</a>, the implication is clear: AI coding assistants are evolving from autocomplete tools into genuine development partners.</p>

            <h3>What This Means For You</h3>
            <ul>
                <li>If you're evaluating cloud platforms, prioritize those with native AI integration and strong developer experience — the productivity gap between modern and legacy toolchains is widening fast.</li>
                <li>Start exploring platform engineering practices now. Even if your team is small, tools like Backstage can dramatically reduce onboarding friction and cognitive load.</li>
                <li>Dedicate time this week to testing AI coding agents in your actual workflow, not just toy examples. The teams that build muscle memory with these tools earliest will have a compounding advantage.</li>
            </ul>
        `;

        // Set sources
        const srcEl = document.getElementById('sources-list');
        if (srcEl) {
            const sources = [
                { source: 'TechCrunch', title: 'Vercel raises $250M to build the OS for AI apps' },
                { source: 'The Pragmatic Engineer', title: 'Developer experience is broken at big tech' },
                { source: 'InfoQ', title: 'Backstage crosses 25K stars as platform engineering grows' },
                { source: 'Ars Technica', title: 'Amazon CodeWhisperer launches autonomous agent mode' },
                { source: 'GitHub Blog', title: 'Copilot now understands your entire workspace' }
            ];
            srcEl.innerHTML = sources.map(a =>
                '<a href="#" class="briefing-source-card"><i class="fa-solid fa-arrow-up-right-from-square"></i><div><div class="source-name">' + a.source + '</div><div class="source-title">' + a.title + '</div></div></a>'
            ).join('');
        }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'news-mockup.png' });

    await browser.close();
    server.kill();
    console.log("Screenshots captured successfully.");
}
run();
