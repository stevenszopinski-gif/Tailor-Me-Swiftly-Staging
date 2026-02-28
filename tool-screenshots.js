const { chromium } = require('playwright');
const { spawn } = require('child_process');

const TOOLS = {
    'tool-cover-letter.png': {
        title: 'Cover Letter',
        html: `
            <div style="font-family:'Georgia',serif;line-height:1.7;font-size:14px;color:#333;padding:8px;">
                <p>Dear Hiring Manager,</p>
                <p>I'm writing to express my strong interest in the <strong>Senior Software Engineer</strong> position at <strong>Acme Corp</strong>. With over seven years of experience architecting distributed systems and leading cross-functional engineering teams, I'm excited about the opportunity to contribute to your mission of reimagining developer productivity.</p>
                <p>In my current role at Nexora Technologies, I designed a real-time data pipeline processing 2M+ events daily — reducing system latency by 40% and directly contributing to a $2.3M increase in annual revenue. I also led a team of five engineers through a Kubernetes migration that cut infrastructure costs by $180K annually.</p>
                <p>What draws me to Acme Corp is your commitment to open-source tooling and developer experience. I've followed your recent launch of the Edge SDK and believe my background in edge computing and API design would allow me to make an immediate impact on your platform team.</p>
                <p>I'd welcome the chance to discuss how my experience aligns with your goals.</p>
                <p>Best regards,<br>Alex Chen</p>
            </div>`
    },
    'tool-intro-email.png': {
        title: 'Intro Email',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;color:#333;padding:8px;">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
                    <div style="font-size:11px;color:#888;margin-bottom:4px;">TO: sarah.kim@acmecorp.com</div>
                    <div style="font-size:11px;color:#888;margin-bottom:8px;">SUBJECT: Quick question about your Edge SDK launch</div>
                </div>
                <p>Hi Sarah,</p>
                <p>Congrats on the Edge SDK launch last week — the developer response on HN was impressive. I noticed your team is hiring a Senior Engineer for the platform group.</p>
                <p>I've spent the last 3 years building similar edge infrastructure at Nexora (2M+ req/day, 40% latency reduction), and I have some ideas about the cold-start optimization challenge you mentioned in your blog post.</p>
                <p>Would you be open to a quick 15-min chat this week? I'd love to learn more about what you're building.</p>
                <p style="margin-bottom:4px;">Best,</p>
                <p style="margin-top:0;">Alex</p>
                <div style="margin-top:16px;padding:12px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.15);border-radius:8px;font-size:12px;color:#6366f1;">
                    <strong>✨ Personalization signals used:</strong> Recent company news, HN discussion, hiring manager's blog post, mutual connection via Berkeley alumni network
                </div>
            </div>`
    },
    'tool-heatmap.png': {
        title: 'Recruiter Heatmap',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="display:flex;gap:12px;margin-bottom:12px;">
                    <div style="flex:1;text-align:center;padding:8px;background:#fef2f2;border-radius:8px;"><div style="font-size:20px;font-weight:700;color:#ef4444;">2.1s</div><div style="font-size:10px;color:#888;">Avg. time on name</div></div>
                    <div style="flex:1;text-align:center;padding:8px;background:#f0fdf4;border-radius:8px;"><div style="font-size:20px;font-weight:700;color:#10b981;">8.4s</div><div style="font-size:10px;color:#888;">Avg. on experience</div></div>
                    <div style="flex:1;text-align:center;padding:8px;background:#fefce8;border-radius:8px;"><div style="font-size:20px;font-weight:700;color:#f59e0b;">3.2s</div><div style="font-size:10px;color:#888;">Avg. on skills</div></div>
                </div>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:12px;">
                    <div style="background:rgba(239,68,68,0.15);padding:6px 10px;border-radius:4px;margin-bottom:6px;border-left:3px solid #ef4444;">🔥 <strong>Hot zone:</strong> First bullet of each job — recruiters read this 4x more</div>
                    <div style="background:rgba(59,130,246,0.1);padding:6px 10px;border-radius:4px;margin-bottom:6px;border-left:3px solid #3b82f6;">👀 <strong>Scanned:</strong> Job titles and company names get quick eye fixation</div>
                    <div style="background:rgba(156,163,175,0.15);padding:6px 10px;border-radius:4px;border-left:3px solid #9ca3af;">❄️ <strong>Cold zone:</strong> Objective statement skipped by 87% of recruiters</div>
                </div>
            </div>`
    },
    'tool-roast.png': {
        title: 'Brutal Roast',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;background:#1a1a2e;color:#e2e8f0;border-radius:8px;">
                <div style="text-align:center;margin-bottom:12px;">
                    <span style="font-size:28px;">🔥</span>
                    <div style="font-size:18px;font-weight:700;color:#f87171;">Roast Score: 6.2/10</div>
                    <div style="font-size:11px;color:#94a3b8;">"Not bad, but not memorable either."</div>
                </div>
                <div style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:12px;font-weight:600;color:#f87171;margin-bottom:4px;">💀 "Results-driven professional"</div>
                    <div style="font-size:11px;color:#94a3b8;">This phrase appears on 2.3 million resumes. You are not a snowflake with this opener.</div>
                </div>
                <div style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:12px;font-weight:600;color:#f87171;">💀 Bullet #3 says "helped improve efficiency"</div>
                    <div style="font-size:11px;color:#94a3b8;">Helped? By how much? Were you the intern or the architect? Numbers or it didn't happen.</div>
                </div>
                <div style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);border-radius:8px;padding:10px;">
                    <div style="font-size:12px;font-weight:600;color:#4ade80;">✅ Strong: "Reduced false positives by 35%"</div>
                    <div style="font-size:11px;color:#94a3b8;">This is what every bullet should look like. Specific, measurable, impressive.</div>
                </div>
            </div>`
    },
    'tool-redflag.png': {
        title: 'Red Flag Detector',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:48px;height:48px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:20px;">🚩</div>
                    <div><div style="font-weight:700;font-size:15px;">3 Red Flags Found</div><div style="font-size:11px;color:#888;">2 critical, 1 warning</div></div>
                </div>
                <div style="border-left:3px solid #ef4444;padding:8px 12px;background:#fef2f2;border-radius:0 8px 8px 0;margin-bottom:8px;">
                    <div style="font-weight:600;color:#dc2626;font-size:12px;">CRITICAL: Employment gap (8 months)</div>
                    <div style="font-size:11px;color:#666;margin-top:2px;">Gap between Cloudbridge and Nexora. Add freelance work, education, or explain in cover letter.</div>
                </div>
                <div style="border-left:3px solid #ef4444;padding:8px 12px;background:#fef2f2;border-radius:0 8px 8px 0;margin-bottom:8px;">
                    <div style="font-weight:600;color:#dc2626;font-size:12px;">CRITICAL: Missing 4 of 6 required keywords</div>
                    <div style="font-size:11px;color:#666;margin-top:2px;">Job requires: microservices ✅, Kafka ❌, Terraform ❌, gRPC ❌, monitoring ❌, K8s ✅</div>
                </div>
                <div style="border-left:3px solid #f59e0b;padding:8px 12px;background:#fefce8;border-radius:0 8px 8px 0;">
                    <div style="font-weight:600;color:#d97706;font-size:12px;">WARNING: Resume exceeds 1 page</div>
                    <div style="font-size:11px;color:#666;margin-top:2px;">At 1.3 pages, the second page may not be read. Consider trimming older experience.</div>
                </div>
            </div>`
    },
    'tool-prove-it.png': {
        title: 'Prove It',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6366f1;margin-bottom:8px;">Before → After</div>
                <div style="background:#fef2f2;border-radius:8px;padding:10px;margin-bottom:6px;position:relative;">
                    <div style="position:absolute;top:8px;right:8px;font-size:10px;background:#fca5a5;color:#7f1d1d;padding:1px 6px;border-radius:4px;">Weak</div>
                    <div style="font-size:12px;color:#666;">❌ "Helped improve system performance and worked on various optimization projects"</div>
                </div>
                <div style="text-align:center;font-size:16px;margin:4px 0;">⬇️</div>
                <div style="background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:12px;position:relative;">
                    <div style="position:absolute;top:8px;right:8px;font-size:10px;background:#86efac;color:#14532d;padding:1px 6px;border-radius:4px;">Strong</div>
                    <div style="font-size:12px;color:#333;">✅ "Reduced API response times by 62% (from 340ms to 130ms) by implementing Redis caching and query optimization, supporting 500K+ daily active users"</div>
                </div>
                <div style="background:#fef2f2;border-radius:8px;padding:10px;margin-bottom:6px;position:relative;">
                    <div style="position:absolute;top:8px;right:8px;font-size:10px;background:#fca5a5;color:#7f1d1d;padding:1px 6px;border-radius:4px;">Weak</div>
                    <div style="font-size:12px;color:#666;">❌ "Managed a team and delivered projects on time"</div>
                </div>
                <div style="text-align:center;font-size:16px;margin:4px 0;">⬇️</div>
                <div style="background:#f0fdf4;border-radius:8px;padding:10px;position:relative;">
                    <div style="position:absolute;top:8px;right:8px;font-size:10px;background:#86efac;color:#14532d;padding:1px 6px;border-radius:4px;">Strong</div>
                    <div style="font-size:12px;color:#333;">✅ "Led a cross-functional team of 8 engineers across 3 time zones, delivering 12 sprints consecutively on-time with 94% sprint velocity"</div>
                </div>
            </div>`
    },
    'tool-video-intro.png': {
        title: 'Video Intro',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="background:#1a1a2e;border-radius:12px;padding:16px;color:#e2e8f0;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                        <div style="width:10px;height:10px;background:#ef4444;border-radius:50%;"></div>
                        <span style="font-size:11px;color:#94a3b8;">TELEPROMPTER MODE — 0:42 / 1:00</span>
                    </div>
                    <div style="font-size:15px;line-height:1.6;">
                        <span style="color:#94a3b8;">"...What excites me about Acme Corp is your approach to </span><span style="color:#fff;font-weight:600;background:rgba(99,102,241,0.3);padding:0 4px;border-radius:3px;">developer experience</span><span style="color:#94a3b8;">. I noticed your recent Edge SDK launch received incredible traction on Hacker News, and I believe my experience building </span><span style="color:#fff;font-weight:600;background:rgba(99,102,241,0.3);padding:0 4px;border-radius:3px;">similar infrastructure at scale</span><span style="color:#94a3b8;"> could help accelerate your roadmap..."</span>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <div style="flex:1;text-align:center;padding:6px;background:#f5f3ff;border-radius:6px;font-size:11px;color:#6366f1;font-weight:600;">⏱ 58 seconds</div>
                    <div style="flex:1;text-align:center;padding:6px;background:#f0fdf4;border-radius:6px;font-size:11px;color:#10b981;font-weight:600;">🎯 3 key points</div>
                </div>
            </div>`
    },
    'tool-toxic.png': {
        title: 'Toxic Culture Radar',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="text-align:center;margin-bottom:12px;">
                    <div style="font-size:36px;font-weight:800;color:#f59e0b;">6.4<span style="font-size:16px;color:#888;">/10</span></div>
                    <div style="font-size:11px;color:#888;">Toxicity Risk Score</div>
                    <div style="height:8px;background:#e5e7eb;border-radius:4px;margin-top:6px;overflow:hidden;"><div style="width:64%;height:100%;background:linear-gradient(90deg,#10b981,#f59e0b,#ef4444);border-radius:4px;"></div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                    <div style="padding:8px;background:#fef2f2;border-radius:6px;"><div style="font-size:11px;font-weight:600;color:#dc2626;">Glassdoor: 2.8★</div><div style="font-size:10px;color:#888;">Below industry avg</div></div>
                    <div style="padding:8px;background:#fefce8;border-radius:6px;"><div style="font-size:11px;font-weight:600;color:#d97706;">Layoff Risk: Medium</div><div style="font-size:10px;color:#888;">2 rounds in 18mo</div></div>
                    <div style="padding:8px;background:#fef2f2;border-radius:6px;"><div style="font-size:11px;font-weight:600;color:#dc2626;">WLB Rating: 2.1★</div><div style="font-size:10px;color:#888;">"Always on" culture</div></div>
                    <div style="padding:8px;background:#f0fdf4;border-radius:6px;"><div style="font-size:11px;font-weight:600;color:#10b981;">Comp: Above Avg</div><div style="font-size:10px;color:#888;">Top 20% for role</div></div>
                </div>
                <div style="font-size:11px;color:#666;background:#f9fafb;padding:8px;border-radius:6px;">⚠️ <strong>Watch out:</strong> Job posting uses "fast-paced" 4 times and "wear many hats" — common signals of understaffing.</div>
            </div>`
    },
    'tool-ghosting.png': {
        title: 'Ghosting Predictor',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                    <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:24px;">👻</div>
                    <div><div style="font-size:18px;font-weight:700;color:#ef4444;">78% Ghost Probability</div><div style="font-size:11px;color:#888;">High risk — this may not be an active search</div></div>
                </div>
                <div style="font-size:12px;margin-bottom:6px;padding:6px 10px;background:#fef2f2;border-radius:6px;">🔴 Posted 47 days ago — still "actively hiring"</div>
                <div style="font-size:12px;margin-bottom:6px;padding:6px 10px;background:#fef2f2;border-radius:6px;">🔴 Reposted 3 times in 90 days (same description)</div>
                <div style="font-size:12px;margin-bottom:6px;padding:6px 10px;background:#fefce8;border-radius:6px;">🟡 Hiring manager changed LinkedIn title 2 weeks ago</div>
                <div style="font-size:12px;padding:6px 10px;background:#f0fdf4;border-radius:6px;">🟢 Company still has budget allocated (recent SEC filing)</div>
            </div>`
    },
    'tool-burnout.png': {
        title: 'Burnout Check',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="text-align:center;margin-bottom:12px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#f59e0b;letter-spacing:0.05em;">Burnout Risk Assessment</div>
                    <div style="font-size:32px;font-weight:800;color:#f59e0b;margin:4px 0;">MODERATE</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                    <div style="padding:8px;background:#fef2f2;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#ef4444;">High</div><div style="font-size:10px;color:#888;">Scope Creep Risk</div></div>
                    <div style="padding:8px;background:#f0fdf4;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#10b981;">Low</div><div style="font-size:10px;color:#888;">On-Call Burden</div></div>
                    <div style="padding:8px;background:#fefce8;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#f59e0b;">Med</div><div style="font-size:10px;color:#888;">Meeting Load</div></div>
                    <div style="padding:8px;background:#fef2f2;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#ef4444;">High</div><div style="font-size:10px;color:#888;">Travel Required</div></div>
                </div>
                <div style="font-size:11px;color:#666;background:#fefce8;padding:8px;border-radius:6px;">⚡ JD mentions "self-starter" + "ambiguous environments" + "fast-paced" — classic burnout cocktail. Overemployment compatibility: <strong>Low</strong>.</div>
            </div>`
    },
    'tool-comp.png': {
        title: 'Comp Decoder',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="text-align:center;margin-bottom:12px;">
                    <div style="font-size:11px;color:#888;">TRUE TOTAL COMPENSATION</div>
                    <div style="font-size:28px;font-weight:800;color:#10b981;">$287,400<span style="font-size:14px;color:#888;">/yr</span></div>
                </div>
                <div style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>Base Salary</span><strong>$185,000</strong></div>
                    <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-bottom:6px;"><div style="width:64%;height:100%;background:#6366f1;border-radius:3px;"></div></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>Equity (RSUs/yr)</span><strong>$72,000</strong></div>
                    <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-bottom:6px;"><div style="width:25%;height:100%;background:#8b5cf6;border-radius:3px;"></div></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>Bonus (target)</span><strong>$18,500</strong></div>
                    <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-bottom:6px;"><div style="width:6%;height:100%;background:#10b981;border-radius:3px;"></div></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>Benefits value</span><strong>$11,900</strong></div>
                    <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:4%;height:100%;background:#f59e0b;border-radius:3px;"></div></div>
                </div>
                <div style="font-size:11px;background:#f0fdf4;padding:8px;border-radius:6px;color:#666;">📍 SF cost-of-living adjusted: equivalent to <strong>$214K</strong> in Austin, TX</div>
            </div>`
    },
    'tool-day.png': {
        title: 'Day in the Life',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">Simulated Day: Senior SWE at Acme Corp</div>
                <div style="border-left:2px solid #e5e7eb;padding-left:12px;">
                    <div style="margin-bottom:8px;position:relative;"><div style="position:absolute;left:-17px;top:2px;width:8px;height:8px;background:#10b981;border-radius:50%;"></div><span style="color:#888;">9:00 AM</span> — Stand-up with platform team (15 min)<br><span style="font-size:11px;color:#888;">Discuss blockers on edge caching migration</span></div>
                    <div style="margin-bottom:8px;position:relative;"><div style="position:absolute;left:-17px;top:2px;width:8px;height:8px;background:#6366f1;border-radius:50%;"></div><span style="color:#888;">9:30 AM</span> — Deep work: API redesign (2.5 hrs)<br><span style="font-size:11px;color:#888;">Primary focus block — headphones on, Slack off</span></div>
                    <div style="margin-bottom:8px;position:relative;"><div style="position:absolute;left:-17px;top:2px;width:8px;height:8px;background:#f59e0b;border-radius:50%;"></div><span style="color:#888;">12:00 PM</span> — Lunch + team social</div>
                    <div style="margin-bottom:8px;position:relative;"><div style="position:absolute;left:-17px;top:2px;width:8px;height:8px;background:#6366f1;border-radius:50%;"></div><span style="color:#888;">1:00 PM</span> — Code review for 2 PRs (45 min)</div>
                    <div style="margin-bottom:8px;position:relative;"><div style="position:absolute;left:-17px;top:2px;width:8px;height:8px;background:#8b5cf6;border-radius:50%;"></div><span style="color:#888;">2:00 PM</span> — Architecture review meeting</div>
                    <div style="position:relative;"><div style="position:absolute;left:-17px;top:2px;width:8px;height:8px;background:#10b981;border-radius:50%;"></div><span style="color:#888;">3:30 PM</span> — Mentoring session with junior dev</div>
                </div>
            </div>`
    },
    'tool-skills.png': {
        title: 'Skills Tracker',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">Your Skills vs. Market Demand</div>
                <div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Kubernetes</span><span style="color:#10b981;font-weight:600;font-size:11px;">↑ 34% demand</span></div><div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:92%;height:100%;background:#10b981;border-radius:3px;"></div></div></div>
                <div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>TypeScript</span><span style="color:#10b981;font-weight:600;font-size:11px;">↑ 28% demand</span></div><div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:88%;height:100%;background:#10b981;border-radius:3px;"></div></div></div>
                <div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>React</span><span style="color:#f59e0b;font-weight:600;font-size:11px;">→ Stable</span></div><div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:75%;height:100%;background:#f59e0b;border-radius:3px;"></div></div></div>
                <div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>GraphQL</span><span style="color:#ef4444;font-weight:600;font-size:11px;">↓ 12% demand</span></div><div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:45%;height:100%;background:#ef4444;border-radius:3px;"></div></div></div>
                <div style="margin-top:10px;padding:8px;background:#f5f3ff;border-radius:6px;font-size:11px;color:#6366f1;">💡 <strong>Gap to close:</strong> Rust and AI/ML engineering are the top trending skills in your field that you're missing.</div>
            </div>`
    },
    'tool-mock.png': {
        title: 'Mock Interview',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px;background:#f5f3ff;border-radius:8px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">🎙</div>
                    <div><div style="font-weight:600;font-size:12px;">Question 3 of 10</div><div style="font-size:10px;color:#888;">Behavioral — Leadership</div></div>
                </div>
                <div style="background:#f9fafb;border-radius:8px;padding:12px;margin-bottom:10px;border-left:3px solid #6366f1;">
                    <div style="font-size:13px;font-weight:500;">"Tell me about a time you had to make a technical decision with incomplete information. How did you approach it?"</div>
                </div>
                <div style="background:#f0fdf4;border-radius:8px;padding:10px;font-size:12px;">
                    <div style="font-weight:600;color:#10b981;margin-bottom:4px;">📝 AI Feedback on your answer:</div>
                    <div style="color:#444;">Strong STAR structure. Add specific metrics on the outcome — you mentioned the migration succeeded but didn't quantify the impact. Try: "reduced downtime from 4hrs/month to 12min."</div>
                </div>
            </div>`
    },
    'tool-salary.png': {
        title: 'Salary Negotiator',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">Negotiation Practice — Round 2</div>
                <div style="background:#f9fafb;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:11px;color:#888;margin-bottom:4px;">HR REPRESENTATIVE:</div>
                    <div style="font-size:12px;">"We're really excited about you joining. Our best offer is $180K base with standard equity. This is at the top of our band for this level."</div>
                </div>
                <div style="background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:11px;color:#10b981;margin-bottom:4px;">YOUR RESPONSE:</div>
                    <div style="font-size:12px;">"I appreciate that. Based on my research and competing offers, I was targeting $195K. Given the scope of the role includes managing the platform team..."</div>
                </div>
                <div style="background:#f5f3ff;border-radius:8px;padding:10px;font-size:11px;">
                    <div style="font-weight:600;color:#6366f1;margin-bottom:4px;">🎯 Coach Tip:</div>
                    <div style="color:#444;">Good anchor. Now mention your competing offer — it creates urgency without being aggressive. Never accept in the same conversation.</div>
                </div>
            </div>`
    },
    'tool-trial.png': {
        title: 'Trial By Fire',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:12px;padding:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div style="font-weight:700;font-size:13px;">System Design: Rate Limiter</div>
                    <div style="font-size:11px;color:#ef4444;font-weight:600;">⏱ 23:41 remaining</div>
                </div>
                <div style="background:#1e1e2e;border-radius:8px;padding:12px;font-family:'Courier New',monospace;font-size:11px;color:#a6e3a1;line-height:1.6;margin-bottom:8px;">
                    <div style="color:#89b4fa;">// Design a distributed rate limiter</div>
                    <div style="color:#89b4fa;">// Requirements: 1000 req/min per user</div>
                    <div style="color:#cdd6f4;margin-top:6px;"><span style="color:#cba6f7;">class</span> <span style="color:#f9e2af;">RateLimiter</span> {</div>
                    <div style="color:#cdd6f4;">&nbsp;&nbsp;<span style="color:#cba6f7;">constructor</span>(windowMs, maxReqs) {</div>
                    <div style="color:#cdd6f4;">&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#cba6f7;">this</span>.redis = <span style="color:#cba6f7;">new</span> Redis();</div>
                    <div style="color:#cdd6f4;">&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#cba6f7;">this</span>.window = windowMs;</div>
                    <div style="color:#a6adc8;">&nbsp;&nbsp;}</div>
                    <div style="color:#cdd6f4;">&nbsp;&nbsp;<span style="color:#89b4fa;">async</span> <span style="color:#f9e2af;">isAllowed</span>(userId) {</div>
                    <div style="color:#cdd6f4;">&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#cba6f7;">const</span> key = <span style="color:#a6e3a1;">\`rate:\${userId}\`</span>;</div>
                    <div style="color:#a6adc8;">&nbsp;&nbsp;&nbsp;&nbsp;█</div>
                    <div style="color:#a6adc8;">}</div>
                </div>
                <div style="display:flex;gap:6px;font-size:11px;">
                    <span style="padding:3px 8px;background:#f0fdf4;border-radius:4px;color:#10b981;">✓ Tests: 3/5 passing</span>
                    <span style="padding:3px 8px;background:#f5f3ff;border-radius:4px;color:#6366f1;">Format: Acme Corp style</span>
                </div>
            </div>`
    },
    'tool-reverse.png': {
        title: 'Reverse Interview',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">Questions to Ask Your Interviewer</div>
                <div style="padding:8px 10px;background:#f5f3ff;border-radius:6px;margin-bottom:6px;border-left:3px solid #6366f1;">
                    <div style="font-weight:600;font-size:12px;">"I saw Acme open-sourced the Edge SDK last month. How does the team balance open-source contributions with product roadmap?"</div>
                    <div style="font-size:10px;color:#888;margin-top:3px;">Shows you've done research + care about engineering culture</div>
                </div>
                <div style="padding:8px 10px;background:#f5f3ff;border-radius:6px;margin-bottom:6px;border-left:3px solid #6366f1;">
                    <div style="font-weight:600;font-size:12px;">"What does the on-call rotation look like for this team, and how has it evolved?"</div>
                    <div style="font-size:10px;color:#888;margin-top:3px;">Evaluates work-life balance without asking directly</div>
                </div>
                <div style="padding:8px 10px;background:#f5f3ff;border-radius:6px;margin-bottom:6px;border-left:3px solid #6366f1;">
                    <div style="font-weight:600;font-size:12px;">"If I were to start Monday, what would my first 30-day project look like?"</div>
                    <div style="font-size:10px;color:#888;margin-top:3px;">Shows initiative + reveals how organized the team is</div>
                </div>
                <div style="padding:8px 10px;background:#fefce8;border-radius:6px;border-left:3px solid #f59e0b;">
                    <div style="font-weight:600;font-size:12px;">"What's the biggest technical challenge the team is facing right now?"</div>
                    <div style="font-size:10px;color:#888;margin-top:3px;">Positions you as a problem-solver + reveals pain points</div>
                </div>
            </div>`
    },
    'tool-thank.png': {
        title: 'Thank-You Engine',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="display:flex;gap:6px;margin-bottom:10px;">
                    <button style="padding:5px 12px;background:#6366f1;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Professional</button>
                    <button style="padding:5px 12px;background:#f5f3ff;color:#6366f1;border:1px solid #c7d2fe;border-radius:6px;font-size:11px;cursor:pointer;">Warm</button>
                    <button style="padding:5px 12px;background:#f5f3ff;color:#6366f1;border:1px solid #c7d2fe;border-radius:6px;font-size:11px;cursor:pointer;">Strategic</button>
                </div>
                <div style="background:#f9fafb;border-radius:8px;padding:12px;font-size:12px;line-height:1.6;">
                    <p style="margin:0 0 8px;">Dear Sarah,</p>
                    <p style="margin:0 0 8px;">Thank you for taking the time to discuss the Senior Engineer role today. I was particularly energized by our conversation about the <strong>edge caching challenges</strong> your team is tackling — it aligns closely with the work I did reducing latency by 40% at Nexora.</p>
                    <p style="margin:0 0 8px;">Your point about <strong>balancing open-source contributions with product velocity</strong> resonated with me, and I'd love to bring my experience shipping Backstage internally to help solve that.</p>
                    <p style="margin:0;">Looking forward to next steps.</p>
                </div>
                <div style="margin-top:8px;font-size:10px;color:#888;background:#f0fdf4;padding:6px 8px;border-radius:4px;">✨ Personalized with 3 conversation topics from your interview</div>
            </div>`
    },
    'tool-auto.png': {
        title: 'Auto-App Agent',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div style="font-weight:700;font-size:14px;">Auto-App Agent</div>
                    <div style="padding:3px 10px;background:#f0fdf4;border-radius:12px;font-size:11px;color:#10b981;font-weight:600;">● Monitoring</div>
                </div>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-weight:600;font-size:12px;">Senior Platform Engineer — Datadog</div><div style="font-size:11px;color:#888;">NYC · $190-240K · Posted 2h ago</div></div>
                    <div style="padding:3px 8px;background:#10b981;color:white;border-radius:4px;font-size:10px;font-weight:600;">94% Match</div>
                </div>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-weight:600;font-size:12px;">Staff Engineer, Infra — Linear</div><div style="font-size:11px;color:#888;">Remote · $200-260K · Posted 5h ago</div></div>
                    <div style="padding:3px 8px;background:#10b981;color:white;border-radius:4px;font-size:10px;font-weight:600;">91% Match</div>
                </div>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-weight:600;font-size:12px;">SWE III, Developer Tools — Figma</div><div style="font-size:11px;color:#888;">SF · $180-220K · Posted 1d ago</div></div>
                    <div style="padding:3px 8px;background:#6366f1;color:white;border-radius:4px;font-size:10px;font-weight:600;">87% Match</div>
                </div>
            </div>`
    },
    'tool-shadow.png': {
        title: 'Shadow Jobs',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">🔍 Pre-Listing Alerts</div>
                <div style="border:1px solid #c7d2fe;background:#f5f3ff;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;"><div style="font-weight:600;font-size:12px;">Notion — Platform Team</div><span style="font-size:10px;background:#6366f1;color:white;padding:1px 6px;border-radius:4px;">NEW</span></div>
                    <div style="font-size:11px;color:#888;margin-top:3px;">Career page updated 4h ago. New "Infrastructure" section appeared. No public listing yet.</div>
                </div>
                <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;"><div style="font-weight:600;font-size:12px;">Vercel — Edge Runtime</div><span style="font-size:10px;background:#10b981;color:white;padding:1px 6px;border-radius:4px;">INSIDER</span></div>
                    <div style="font-size:11px;color:#888;margin-top:3px;">Engineering manager posted about "growing the team" on LinkedIn. Role likely opening in 2-3 weeks.</div>
                </div>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;">
                    <div style="font-weight:600;font-size:12px;">Anthropic — Developer Relations</div>
                    <div style="font-size:11px;color:#888;margin-top:3px;">Internal referral from your Berkeley alumni network flagged this. Hiring committee forming now.</div>
                </div>
            </div>`
    },
    'tool-referral.png': {
        title: 'Referral Mapper',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">Referral Paths to Acme Corp</div>
                <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;"><div style="font-size:14px;">🎯</div><div><div style="font-weight:600;font-size:12px;">Direct: Sarah Kim (Eng Manager)</div><div style="font-size:11px;color:#888;">Berkeley alumni network — Class of 2018</div></div></div>
                </div>
                <div style="border:1px solid #c7d2fe;background:#f5f3ff;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;"><div style="font-size:14px;">🔗</div><div><div style="font-weight:600;font-size:12px;">2nd degree: via Mike Torres (ex-Cloudbridge)</div><div style="font-size:11px;color:#888;">Mike worked at Acme for 3 years, now at Datadog</div></div></div>
                </div>
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;">
                    <div style="display:flex;align-items:center;gap:8px;"><div style="font-size:14px;">🌐</div><div><div style="font-weight:600;font-size:12px;">Community: Acme DevRel team</div><div style="font-size:11px;color:#888;">You contributed to their open-source Edge SDK. Mention in intro.</div></div></div>
                </div>
            </div>`
    },
    'tool-guerrilla.png': {
        title: 'Guerrilla Tactics',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:10px;">Creative Outreach Strategies</div>
                <div style="border-left:3px solid #10b981;padding:8px 12px;background:#f0fdf4;border-radius:0 8px 8px 0;margin-bottom:8px;">
                    <div style="font-weight:600;font-size:12px;color:#10b981;">Strategy 1: The Open Source Trojan Horse</div>
                    <div style="font-size:11px;color:#666;margin-top:3px;">Submit a meaningful PR to Acme's Edge SDK repo. Include a note: "Loved building on this. I'd be excited to work on it full-time."</div>
                    <div style="font-size:10px;color:#888;margin-top:4px;">Success rate: 3x higher than cold applications</div>
                </div>
                <div style="border-left:3px solid #6366f1;padding:8px 12px;background:#f5f3ff;border-radius:0 8px 8px 0;margin-bottom:8px;">
                    <div style="font-weight:600;font-size:12px;color:#6366f1;">Strategy 2: The Conference DM</div>
                    <div style="font-size:11px;color:#666;margin-top:3px;">Sarah Kim is speaking at KubeCon next month. Attend her talk, ask an insightful question, then follow up on LinkedIn referencing the conversation.</div>
                </div>
                <div style="border-left:3px solid #f59e0b;padding:8px 12px;background:#fefce8;border-radius:0 8px 8px 0;">
                    <div style="font-weight:600;font-size:12px;color:#d97706;">Strategy 3: The Technical Blog Post</div>
                    <div style="font-size:11px;color:#666;margin-top:3px;">Write a deep-dive on edge caching (your expertise) and tag Acme's team. Position yourself as a thought leader they want to hire.</div>
                </div>
            </div>`
    },
    'tool-rejection.png': {
        title: 'Rejection Reverser',
        html: `
            <div style="font-family:'Outfit',sans-serif;font-size:13px;padding:8px;">
                <div style="background:#fef2f2;border-radius:8px;padding:10px;margin-bottom:10px;">
                    <div style="font-size:11px;color:#888;margin-bottom:4px;">ORIGINAL REJECTION:</div>
                    <div style="font-size:12px;color:#666;font-style:italic;">"After careful consideration, we've decided to move forward with other candidates whose experience more closely aligns with our current needs."</div>
                </div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;letter-spacing:0.05em;margin-bottom:8px;">Recommended Response:</div>
                <div style="background:#f9fafb;border-radius:8px;padding:12px;font-size:12px;line-height:1.6;">
                    <p style="margin:0 0 8px;">Hi Sarah,</p>
                    <p style="margin:0 0 8px;">Thank you for letting me know. I genuinely enjoyed learning about the platform team's work on edge caching and would love to stay connected.</p>
                    <p style="margin:0 0 8px;">If it would be helpful, I'd be happy to share some <strong>thoughts on the cold-start optimization challenge</strong> we discussed — no strings attached. And if a role opens up that's a closer fit in the future, I'd love to be considered.</p>
                    <p style="margin:0;">Wishing the team the best.</p>
                </div>
                <div style="margin-top:8px;font-size:10px;background:#f0fdf4;padding:6px 8px;border-radius:4px;color:#10b981;">🔄 Keeps the door open for future roles + shows genuine interest</div>
            </div>`
    }
};

async function run() {
    const server = spawn('npx', ['serve', '.', '-l', '8082']);
    await new Promise(r => setTimeout(r, 3000));

    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 600, height: 460 },
        colorScheme: 'light'
    });

    // Load fonts
    await page.goto('http://localhost:8082/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    for (const [filename, tool] of Object.entries(TOOLS)) {
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { box-sizing: border-box; margin: 0; }
                    body { font-family: 'Outfit', sans-serif; background: #fff; padding: 20px; }
                </style>
            </head>
            <body>${tool.html}</body>
            </html>
        `, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        await page.screenshot({ path: filename });
        console.log(`  ✓ ${filename}`);
    }

    await browser.close();
    server.kill();
    console.log('\nAll tool screenshots generated.');
}
run();
