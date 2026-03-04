import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'store-screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 800;
const SITE = 'https://tailormeswiftly.com';

// Dummy resume HTML for results
const DUMMY_RESUME_HTML = `
<div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 2rem;">
  <h1 style="margin-bottom: 0.2rem;">Alex Johnson</h1>
  <p style="color: #666; margin-top: 0;">Senior Software Engineer | San Francisco, CA | alex.johnson@email.com</p>
  <hr/>
  <h2>Professional Summary</h2>
  <p>Results-driven Senior Software Engineer with 7+ years of experience building scalable web applications. Expert in React, TypeScript, Node.js, and cloud infrastructure. Led cross-functional teams to deliver products serving 2M+ users.</p>
  <h2>Experience</h2>
  <h3>Senior Software Engineer — TechVenture Inc.</h3>
  <p style="color:#666;">Jan 2022 – Present</p>
  <ul>
    <li>Architected and deployed microservices platform handling 50K+ requests/sec, reducing latency by 40%</li>
    <li>Led migration from monolithic architecture to event-driven microservices using AWS Lambda and SQS</li>
    <li>Mentored team of 5 junior engineers, implementing code review practices that reduced bug rate by 35%</li>
  </ul>
  <h3>Software Engineer — DataFlow Systems</h3>
  <p style="color:#666;">Jun 2019 – Dec 2021</p>
  <ul>
    <li>Built real-time analytics dashboard with React and D3.js, used by 500+ enterprise clients</li>
    <li>Designed RESTful APIs serving 10M+ daily requests with 99.9% uptime SLA</li>
    <li>Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes</li>
  </ul>
  <h3>Junior Developer — WebCraft Agency</h3>
  <p style="color:#666;">Aug 2017 – May 2019</p>
  <ul>
    <li>Developed 20+ responsive web applications for clients across e-commerce, healthcare, and fintech</li>
    <li>Optimized page load times by 60% through code splitting and lazy loading strategies</li>
  </ul>
  <h2>Skills</h2>
  <p>React, TypeScript, Node.js, Python, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, GraphQL, REST APIs, CI/CD, Agile/Scrum</p>
  <h2>Education</h2>
  <p><strong>B.S. Computer Science</strong> — University of California, Berkeley (2017)</p>
</div>`;

const DUMMY_JOB_DESCRIPTION = `About the Role

We're looking for a Senior Frontend Engineer to join our Product Engineering team. You'll work closely with designers and backend engineers to build elegant, performant user interfaces that delight our customers.

What You'll Do
• Lead the development of new features for our core web application using React and TypeScript
• Collaborate with UX designers to implement pixel-perfect, accessible interfaces
• Architect scalable frontend solutions and establish best practices for the team
• Optimize application performance, achieving sub-second load times
• Mentor junior engineers and conduct thorough code reviews
• Contribute to technical planning and architectural decisions

What We're Looking For
• 5+ years of professional experience in frontend development
• Expert-level knowledge of React, TypeScript, and modern CSS
• Experience with state management (Redux, Zustand, or similar)
• Strong understanding of web performance optimization techniques
• Experience with testing frameworks (Jest, Cypress, Playwright)
• Excellent communication and collaboration skills
• Experience with CI/CD pipelines and cloud platforms (AWS/GCP)

Nice to Have
• Experience with design systems and component libraries
• Knowledge of GraphQL and real-time data (WebSockets)
• Contributions to open-source projects
• Experience with Node.js backend development

Compensation: $160,000 – $200,000 + equity + benefits
Location: San Francisco, CA (Hybrid - 3 days in office)`;

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ── Screenshot 1: Extension popup on a job board ──
  // We'll simulate this by creating a composite: job listing bg + popup overlay
  console.log('Taking screenshot 1: Extension popup overlay...');
  {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const page = await ctx.newPage();

    // Create a fake job listing page with popup overlay
    await page.setContent(`
      <html>
      <head><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f2ef; }
        .navbar { background: #fff; padding: 0.5rem 2rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ddd; height: 52px; }
        .nav-logo { font-weight: 700; font-size: 1.3rem; color: #0a66c2; }
        .nav-links { display: flex; gap: 1.5rem; margin-left: 2rem; }
        .nav-links span { color: #666; font-size: 0.85rem; }
        .main { display: flex; max-width: 1100px; margin: 1rem auto; gap: 1rem; padding: 0 1rem; }
        .sidebar { width: 300px; background: #fff; border-radius: 8px; padding: 1rem; border: 1px solid #ddd; height: fit-content; }
        .sidebar h3 { font-size: 0.95rem; margin-bottom: 0.5rem; }
        .sidebar .job-item { padding: 0.75rem 0; border-bottom: 1px solid #eee; cursor: pointer; }
        .sidebar .job-item.active { background: #e8f0fe; margin: 0 -1rem; padding: 0.75rem 1rem; }
        .sidebar .job-title { font-weight: 600; font-size: 0.9rem; color: #1a1a1a; }
        .sidebar .job-company { font-size: 0.8rem; color: #666; }
        .sidebar .job-meta { font-size: 0.75rem; color: #999; margin-top: 0.2rem; }
        .content { flex: 1; background: #fff; border-radius: 8px; padding: 1.5rem 2rem; border: 1px solid #ddd; }
        .content h1 { font-size: 1.4rem; margin-bottom: 0.3rem; }
        .content .company { color: #0a66c2; font-size: 1rem; margin-bottom: 0.3rem; }
        .content .location { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
        .content .badge { display: inline-block; background: #e8f0fe; color: #0a66c2; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; margin-right: 0.5rem; margin-bottom: 1rem; }
        .content h2 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
        .content p, .content li { font-size: 0.9rem; color: #333; line-height: 1.6; }
        .content ul { padding-left: 1.2rem; }
        .apply-btn { background: #0a66c2; color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 20px; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-bottom: 1rem; }

        /* Popup overlay */
        .popup-overlay { position: fixed; top: 52px; right: 20px; width: 360px; background: #1a1f2e; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 1000; padding: 1.25rem; color: #fff; }
        .popup-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
        .popup-header .logo { width: 28px; height: 28px; background: #151821; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.7rem; border: 1px dashed rgba(255,255,255,0.3); }
        .popup-header .title { font-weight: 600; font-size: 0.95rem; }
        .popup-capture-btn { width: 100%; padding: 0.7rem; background: linear-gradient(135deg, #7B8FA8, #9B8EA6); color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-bottom: 0.75rem; }
        .popup-status { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem; font-size: 0.82rem; color: rgba(255,255,255,0.85); margin-bottom: 0.75rem; line-height: 1.5; }
        .popup-status .job-name { font-weight: 600; color: #fff; margin-bottom: 0.3rem; }
        .popup-actions { display: flex; gap: 0.5rem; }
        .popup-actions button { flex: 1; padding: 0.55rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; border: none; cursor: pointer; }
        .popup-save { background: linear-gradient(135deg, #7B8FA8, #9B8EA6); color: white; }
        .popup-tailor { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2) !important; }
        .ext-icon { position: fixed; top: 10px; right: 20px; width: 32px; height: 32px; background: #151821; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.55rem; color: rgba(255,255,255,0.9); border: 1px dashed rgba(255,255,255,0.3); z-index: 999; }
      </style></head>
      <body>
        <div class="navbar">
          <span class="nav-logo">in</span>
          <div class="nav-links">
            <span>Home</span><span>My Network</span><span><b>Jobs</b></span><span>Messaging</span><span>Notifications</span>
          </div>
        </div>
        <div class="main">
          <div class="sidebar">
            <h3>Job search results</h3>
            <div class="job-item active">
              <div class="job-title">Senior Frontend Engineer</div>
              <div class="job-company">Meridian Technologies</div>
              <div class="job-meta">San Francisco, CA · 2 days ago</div>
            </div>
            <div class="job-item">
              <div class="job-title">React Developer</div>
              <div class="job-company">CloudScale Inc.</div>
              <div class="job-meta">Remote · 3 days ago</div>
            </div>
            <div class="job-item">
              <div class="job-title">Full Stack Engineer</div>
              <div class="job-company">NovaBridge Systems</div>
              <div class="job-meta">New York, NY · 1 week ago</div>
            </div>
            <div class="job-item">
              <div class="job-title">UI Engineer</div>
              <div class="job-company">PixelForge Labs</div>
              <div class="job-meta">Austin, TX · 1 week ago</div>
            </div>
          </div>
          <div class="content">
            <h1>Senior Frontend Engineer</h1>
            <div class="company">Meridian Technologies</div>
            <div class="location">San Francisco, CA (Hybrid) · $160K–$200K</div>
            <button class="apply-btn">Apply</button>
            <span class="badge">React</span><span class="badge">TypeScript</span><span class="badge">5+ years</span>
            <h2>About the Role</h2>
            <p>We're looking for a Senior Frontend Engineer to join our Product Engineering team. You'll work closely with designers and backend engineers to build elegant, performant user interfaces.</p>
            <h2>What You'll Do</h2>
            <ul>
              <li>Lead the development of new features using React and TypeScript</li>
              <li>Collaborate with UX designers to implement pixel-perfect, accessible interfaces</li>
              <li>Architect scalable frontend solutions and establish best practices</li>
              <li>Optimize application performance, achieving sub-second load times</li>
            </ul>
          </div>
        </div>

        <div class="popup-overlay">
          <div class="popup-header">
            <div class="logo">TMS</div>
            <div class="title">TailorMeSwiftly</div>
          </div>
          <div class="popup-status">
            <div class="job-name">Senior Frontend Engineer at Meridian Technologies</div>
            We're looking for a Senior Frontend Engineer to join our Product Engineering team. You'll work closely with designers and backend engineers to build elegant, performant user interfaces that delight our customers...
          </div>
          <div class="popup-actions">
            <button class="popup-save">Save to Tracker</button>
            <button class="popup-tailor">Tailor Now</button>
          </div>
        </div>
      </body></html>
    `);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '1-capture-popup.png'), type: 'png' });
    await ctx.close();
  }

  // ── Screenshot 2: App.html with JD loaded (extension mode) ──
  console.log('Taking screenshot 2: App with JD loaded...');
  {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const page = await ctx.newPage();
    await page.goto(SITE + '/app.html');
    await page.waitForLoadState('networkidle');

    // Inject demo JD into the form
    await page.evaluate((jd) => {
      // Set theme
      document.documentElement.setAttribute('data-theme', 'light');

      // Hide auth elements
      const authWrap = document.getElementById('auth-section');
      if (authWrap) authWrap.style.display = 'none';

      // Fill job description
      const jdField = document.getElementById('job-desc-raw') || document.querySelector('textarea[name="jobDescription"]');
      if (jdField) {
        jdField.value = jd;
        jdField.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Show step 2 elements
      const step2 = document.getElementById('step-2');
      if (step2) step2.style.display = 'block';
    }, DUMMY_JOB_DESCRIPTION);

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '2-app-jd-loaded.png'), type: 'png' });
    await ctx.close();
  }

  // ── Screenshot 3: Results page with tailored resume ──
  console.log('Taking screenshot 3: Results page...');
  {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const page = await ctx.newPage();

    // Set up sessionStorage before navigating
    await page.goto(SITE + '/results.html');
    await page.waitForLoadState('networkidle');

    await page.evaluate((resumeHtml) => {
      // Inject demo data into sessionStorage
      const outputs = {
        generationId: '550e8400-e29b-41d4-a716-446655440000',
        resumeHtml: resumeHtml,
        resumeText: 'Alex Johnson\nSenior Software Engineer...',
        coverHtml: '<p>Dear Hiring Manager,</p><p>I am writing to express my strong interest in the Senior Frontend Engineer position at Meridian Technologies...</p>',
        jobText: 'Senior Frontend Engineer at Meridian Technologies',
        matchScore: 92,
        applicantName: 'Alex Johnson',
        targetCompany: 'Meridian Technologies',
        companyPrimaryColor: '#2563eb',
        missingKeywords: ['Zustand', 'Cypress'],
        roastLines: [],
        redFlags: [],
        burnoutCheck: { flightRiskScore: 25 }
      };
      sessionStorage.setItem('tms_outputs', JSON.stringify(outputs));
      document.documentElement.setAttribute('data-theme', 'light');
    }, DUMMY_RESUME_HTML);

    // Reload to pick up sessionStorage
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '3-results-resume.png'), type: 'png' });
    await ctx.close();
  }

  // ── Screenshot 4: Homepage / Landing ──
  console.log('Taking screenshot 4: Homepage...');
  {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const page = await ctx.newPage();
    await page.goto(SITE + '/index.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '4-homepage.png'), type: 'png' });
    await ctx.close();
  }

  // ── Screenshot 5: History / Kanban board (mocked) ──
  console.log('Taking screenshot 5: Kanban board...');
  {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const page = await ctx.newPage();

    // Create a realistic kanban board mock
    await page.setContent(`
      <html>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f7f4; color: #1a1a1a; }

          .topbar { background: #fff; padding: 0.75rem 2rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0ddd8; }
          .topbar .logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: inherit; }
          .topbar .mark { border: 2px dashed #999; border-radius: 4px; padding: 0.15rem 0.4rem; font-weight: 700; font-size: 0.8rem; font-family: Georgia, serif; }
          .topbar .brand { font-family: Georgia, serif; font-size: 1.1rem; font-weight: 600; }
          .topbar nav { display: flex; gap: 1.5rem; }
          .topbar nav a { text-decoration: none; color: #666; font-size: 0.9rem; }
          .topbar nav a.active { color: #1a1a1a; font-weight: 600; }

          .page { max-width: 1200px; margin: 1.5rem auto; padding: 0 1.5rem; }
          .page h1 { font-size: 1.5rem; margin-bottom: 0.3rem; font-family: Georgia, serif; }
          .page .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }

          .kanban { display: flex; gap: 1rem; overflow-x: auto; }
          .column { flex: 1; min-width: 200px; background: #fff; border-radius: 12px; border: 1px solid #e0ddd8; padding: 1rem; }
          .column-header { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem; color: #555; }
          .column-header .count { background: #eee; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.75rem; }

          .card { background: #fafaf8; border: 1px solid #e8e5e0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: box-shadow 0.2s; }
          .card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .card .company { font-weight: 600; font-size: 0.85rem; margin-bottom: 0.2rem; }
          .card .role { font-size: 0.78rem; color: #666; margin-bottom: 0.4rem; }
          .card .score { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
          .card .score.high { background: #dcfce7; color: #166534; }
          .card .score.mid { background: #fef3c7; color: #92400e; }
          .card .date { font-size: 0.7rem; color: #999; margin-top: 0.3rem; }
          .card .color-bar { width: 100%; height: 3px; border-radius: 2px; margin-bottom: 0.5rem; }
        </style>
      </head>
      <body>
        <div class="topbar">
          <a class="logo" href="#">
            <span class="mark">TMS</span>
            <span class="brand">TailorMeSwiftly</span>
          </a>
          <nav>
            <a href="#">Dashboard</a>
            <a href="#">Tailor</a>
            <a href="#" class="active">Job Tracker</a>
            <a href="#">Tools</a>
          </nav>
        </div>

        <div class="page">
          <h1>Job Tracker</h1>
          <p class="subtitle">Track your applications from tailored to offer</p>

          <div class="kanban">
            <div class="column">
              <div class="column-header">Tailored <span class="count">3</span></div>
              <div class="card">
                <div class="color-bar" style="background:#2563eb;"></div>
                <div class="company">Meridian Technologies</div>
                <div class="role">Senior Frontend Engineer</div>
                <span class="score high">92% match</span>
                <div class="date">Mar 3, 2026</div>
              </div>
              <div class="card">
                <div class="color-bar" style="background:#7c3aed;"></div>
                <div class="company">NovaBridge Systems</div>
                <div class="role">Full Stack Engineer</div>
                <span class="score high">88% match</span>
                <div class="date">Mar 2, 2026</div>
              </div>
              <div class="card">
                <div class="color-bar" style="background:#0891b2;"></div>
                <div class="company">CloudScale Inc.</div>
                <div class="role">React Developer</div>
                <span class="score mid">79% match</span>
                <div class="date">Mar 1, 2026</div>
              </div>
            </div>

            <div class="column">
              <div class="column-header">Applied <span class="count">2</span></div>
              <div class="card">
                <div class="color-bar" style="background:#dc2626;"></div>
                <div class="company">Apex Digital</div>
                <div class="role">Lead UI Engineer</div>
                <span class="score high">91% match</span>
                <div class="date">Feb 28, 2026</div>
              </div>
              <div class="card">
                <div class="color-bar" style="background:#ea580c;"></div>
                <div class="company">Streamline Labs</div>
                <div class="role">Senior React Developer</div>
                <span class="score high">85% match</span>
                <div class="date">Feb 26, 2026</div>
              </div>
            </div>

            <div class="column">
              <div class="column-header">Interviewing <span class="count">2</span></div>
              <div class="card">
                <div class="color-bar" style="background:#16a34a;"></div>
                <div class="company">GreenField AI</div>
                <div class="role">Frontend Architect</div>
                <span class="score high">94% match</span>
                <div class="date">Feb 22, 2026</div>
              </div>
              <div class="card">
                <div class="color-bar" style="background:#ca8a04;"></div>
                <div class="company">BrightPath Analytics</div>
                <div class="role">Senior Engineer</div>
                <span class="score high">87% match</span>
                <div class="date">Feb 20, 2026</div>
              </div>
            </div>

            <div class="column">
              <div class="column-header">Offer <span class="count">1</span></div>
              <div class="card">
                <div class="color-bar" style="background:#9333ea;"></div>
                <div class="company">Zenith Software</div>
                <div class="role">Staff Frontend Engineer</div>
                <span class="score high">96% match</span>
                <div class="date">Feb 15, 2026</div>
              </div>
            </div>

            <div class="column">
              <div class="column-header">Rejected <span class="count">1</span></div>
              <div class="card">
                <div class="color-bar" style="background:#6b7280;"></div>
                <div class="company">LegacyCorp</div>
                <div class="role">Web Developer</div>
                <span class="score mid">72% match</span>
                <div class="date">Feb 10, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </body></html>
    `);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '5-kanban-tracker.png'), type: 'png' });
    await ctx.close();
  }

  await browser.close();
  console.log('\nAll 5 screenshots saved to:', SCREENSHOTS_DIR);
}

main().catch(console.error);
