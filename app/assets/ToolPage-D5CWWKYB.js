import{u as w,r as u,b as O,c as M,j as e,L as P,f as N}from"./index-CjP65Z8s.js";import{T as Y,a as v}from"./toolConfig-JRKjLF22.js";import{u as z}from"./useGeminiGeneration-DeavjVS5.js";import{u as R,J as q,t as B,b as F}from"./JsonLd-OLQU_25U.js";import"./purify.es-A66Cw1IH.js";function _(){const{user:a,isPremium:s,supabase:n}=w(),[r,t]=u.useState(!1),d=u.useCallback(async o=>{const i=v[o]||"free";if(i==="free")return{allowed:!0};if(!a)return{allowed:!1,reason:"not_authenticated"};if(s)return{allowed:!0};if(i==="premium")return{allowed:!1,reason:"premium"};if(i==="teaser"){t(!0);try{const{data:c}=await n.from("user_profiles").select("tool_usage").eq("user_id",a.id).maybeSingle();return(((c==null?void 0:c.tool_usage)||{})[o]||0)>=1?{allowed:!1,reason:"teaser_exhausted"}:{allowed:!0}}finally{t(!1)}}return{allowed:!0}},[a,s,n]),p=u.useCallback(async o=>{if(!a)return;const{data:i}=await n.from("user_profiles").select("tool_usage").eq("user_id",a.id).maybeSingle(),c=(i==null?void 0:i.tool_usage)||{};c[o]=(c[o]||0)+1,await n.from("user_profiles").update({tool_usage:c}).eq("user_id",a.id)},[a,n]),m=u.useCallback(o=>Y[o],[]),h=u.useCallback(o=>v[o]||"free",[]);return{checkAccess:d,incrementUsage:p,getPreview:m,getTier:h,checking:r}}function D({onClose:a,toolPreview:s,title:n}){const{invokeEdgeFunction:r,session:t}=w(),{showToast:d}=O(),p=M(),m=n||(s?`You've experienced ${s.name}`:"Free Trial Used");async function h(){if(!t){d("Please sign in first.",!0);return}const{data:o,error:i}=await r("create-checkout",{returnUrl:window.location.origin+"/app/results"});if(i){d(i.message,!0);return}const c=o==null?void 0:o.url;c&&(window.location.href=c)}return e.jsx("div",{className:"modal-overlay",onClick:o=>{o.target===o.currentTarget&&a()},children:e.jsxs("div",{className:"modal-dialog sm",style:{textAlign:"center"},children:[e.jsx("i",{className:"fa-solid fa-crown",style:{fontSize:"2.5rem",color:"#f59e0b",marginBottom:"1rem",display:"block"}}),e.jsx("h2",{style:{margin:"0 0 1rem",fontSize:"1.3rem",color:"var(--text-primary)"},children:m}),s&&e.jsxs("div",{className:"glass-panel",style:{padding:"1rem",marginBottom:"1.25rem",textAlign:"left",background:"rgba(245,158,11,0.06)",borderColor:"rgba(245,158,11,0.15)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"0.5rem"},children:[e.jsx("i",{className:`fa-solid ${s.icon}`,style:{color:"#f59e0b",fontSize:"1.1rem"}}),e.jsx("strong",{style:{color:"var(--text-primary)",fontSize:"0.95rem"},children:s.name})]}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"0.82rem",lineHeight:1.55,margin:0},children:s.desc})]}),e.jsxs("div",{style:{textAlign:"left",marginBottom:"1.25rem"},children:[e.jsx("p",{style:{fontSize:"0.78rem",fontWeight:600,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.5rem"},children:"Go Pro and unlock:"}),["Unlimited resume tailoring","All 26 AI tools, unlimited","Daily news briefings + podcast","Voice interviews & negotiation"].map(o=>e.jsxs("span",{style:{display:"block",fontSize:"0.82rem",color:"var(--text-secondary)",marginBottom:"0.2rem"},children:[e.jsx("i",{className:"fa-solid fa-check",style:{color:"#10b981",marginRight:"0.4rem",fontSize:"0.7rem"}}),o]},o))]}),e.jsxs("button",{onClick:h,className:"btn secondary-btn large-action-btn",style:{marginBottom:"0.75rem",background:"linear-gradient(135deg, #f59e0b, #d97706)"},children:[e.jsx("i",{className:"fa-solid fa-bolt"})," Go Pro — $9.99/mo"]}),e.jsx("button",{onClick:()=>{a(),p("/dashboard")},className:"btn ghost-btn large-action-btn",children:"Back to Dashboard"}),e.jsx(P,{to:"/pricing",style:{display:"block",marginTop:"0.75rem",fontSize:"0.8rem",color:"var(--text-secondary)",textDecoration:"none"},onClick:a,children:"See full feature comparison →"})]})})}const G={"cover-letter":`You are an elite career coach specializing in cover letters.
Write a compelling, personalized cover letter that:
- Opens with a strong hook (not "I am writing to apply...")
- Weaves the candidate's actual experience into the company's specific needs
- Shows genuine knowledge of the company and role
- Ends with a confident, non-generic call to action
- Is 3-4 paragraphs, under 400 words
- Uses a professional but warm tone

Output the cover letter as clean HTML wrapped in a single \`\`\`html code fence.
CRITICAL: Only use facts from the provided resume. Never fabricate experience.`,"pain-letter":`You are a strategic career advisor. Write a "pain letter" that:
- Identifies 2-3 specific challenges the company is likely facing
- Shows the candidate understands these problems deeply
- Connects the candidate's experience to solving these problems
- Avoids generic platitudes — be specific and research-backed
- Is 3 paragraphs, conversational but professional

Output as clean HTML in a \`\`\`html code fence.`,"hook-generator":`You are a copywriting expert specializing in job search outreach.
Generate 5 attention-grabbing opening lines that:
- Are specific to the role and company
- Avoid clichés ("I'm a passionate...")
- Create curiosity or demonstrate value immediately
- Vary in style: data-driven, storytelling, bold claim, mutual connection, insight-led

Output as an HTML list in a \`\`\`html code fence.`,outreach:`You are an expert in professional networking and cold outreach.
Write a personalized outreach/intro email that:
- Is under 150 words (brevity is key)
- Leads with value, not a request
- Shows specific knowledge of the recipient's work
- Has a clear, low-friction call to action
- Feels genuine, not templated

Output as clean HTML in a \`\`\`html code fence.`,"interview-prep":`You are a senior interview coach. Generate a comprehensive interview preparation package:
1. 10 likely interview questions (mix of behavioral, technical, and role-specific)
2. For each question: a suggested answer framework using the STAR method
3. 3 potential curveball questions
4. Key talking points to emphasize

Output as structured HTML in a \`\`\`html code fence.`,"salary-negotiator":`You are an expert salary negotiation coach. Provide:
1. Market salary analysis for this role/company
2. A negotiation script with specific talking points
3. Counter-offer strategies if the initial offer is low
4. Non-salary items to negotiate (equity, PTO, signing bonus, remote)
5. Phrases to use and avoid

Output as structured HTML in a \`\`\`html code fence.`,"toxic-radar":`You are a workplace culture analyst. Analyze this company for potential red flags:
1. Toxicity Score (1-10) with justification
2. Glassdoor/Blind sentiment analysis
3. Turnover rate indicators
4. Management style assessment
5. Work-life balance signals
6. Layoff risk assessment
7. Green flags (if any)

Be honest and data-driven. Output as structured HTML in a \`\`\`html code fence.`,"comp-decoder":`You are a compensation analyst. Break down this offer:
1. True total comp value (annualized)
2. Equity valuation (if applicable, with scenarios)
3. Benefits monetary value estimate
4. Cost-of-living adjustment vs market
5. Comparison to market median/P75
6. Hidden costs or red flags
7. Overall verdict: Fair / Below Market / Above Market

Output as structured HTML with clear sections in a \`\`\`html code fence.`,"shadow-jobs":`You are a job market intelligence analyst. For this company and role:
1. Identify likely upcoming openings based on recent hires, growth patterns, and news
2. Monitor signals: new product launches, funding rounds, team expansions
3. Suggest the best timing and channels to apply
4. Recommend adjacent roles that might lead to the target role

Output as structured HTML in a \`\`\`html code fence.`,"guerrilla-tactics":`You are an unconventional job search strategist. Provide:
1. 5 creative strategies to bypass the ATS and reach hiring managers directly
2. LinkedIn-specific tactics (profile optimization, engagement strategy)
3. Networking moves that create warm introductions
4. Content creation ideas that demonstrate expertise
5. "Trojan horse" approach: getting noticed before applying

Be creative but ethical. Output as structured HTML in a \`\`\`html code fence.`,"referral-mapper":`You are a networking strategist. Create a referral mapping plan:
1. Identify potential referral paths into this company
2. 2nd-degree connection strategies via LinkedIn
3. Ready-to-send outreach templates for each path
4. Alumni network leveraging tactics
5. Industry event and community suggestions

Output as structured HTML in a \`\`\`html code fence.`,"auto-app":`You are an automated job application strategist. Based on the preferences:
1. Identify 10 matching job openings
2. For each: company, role, match score, key requirements
3. Suggest tailoring priorities for each application
4. Provide an optimized application timeline
5. Flag any potential concerns or mismatches

Output as structured HTML in a \`\`\`html code fence.`,"thank-you":`You are a post-interview follow-up expert. Generate 3 variants:
1. FORMAL: Traditional thank-you (for conservative companies)
2. CONVERSATIONAL: Warm, personal follow-up (for startups/creative roles)
3. VALUE-ADD: Includes a relevant insight or resource discussed in the interview

Each should be under 200 words, personalized to the interview specifics.
Output all 3 as labeled HTML sections in a \`\`\`html code fence.`,"ghosting-predictor":`You are a job market analyst. Assess the likelihood of being ghosted:
1. Ghost Score (1-10) with reasoning
2. Warning signs in the listing (vague requirements, unrealistic expectations)
3. Company ghosting reputation (based on available data)
4. Days-posted analysis
5. Recommended follow-up timeline
6. Alternative actions if ghosted

Output as structured HTML in a \`\`\`html code fence.`,"video-intro":`You are a video presentation coach. Create:
1. A 60-second video intro script (with timing markers)
2. Opening hook (first 5 seconds)
3. Value proposition (15 seconds)
4. Key achievements (20 seconds)
5. Cultural fit signal (10 seconds)
6. Call to action (10 seconds)
7. Delivery tips: tone, pace, eye contact, background

Output as structured HTML in a \`\`\`html code fence.`,"skills-tracker":`You are a labor market analyst. For the provided skills:
1. Current market demand score (1-10) for each skill
2. Trend direction: Rising, Stable, or Declining
3. Salary premium associated with each skill
4. Complementary skills to learn next
5. Certification recommendations
6. Industry-specific demand variation

Output as structured HTML with data visualizations described in a \`\`\`html code fence.`,"day-in-life":`You are a career insights analyst. Simulate a typical day:
1. Hour-by-hour schedule (8am-6pm)
2. Typical meetings and their purpose
3. Solo work vs collaboration ratio
4. Tools and systems used daily
5. Common challenges and stressors
6. Best and worst parts of the role
7. Career progression from this role

Be realistic, not aspirational. Output as structured HTML in a \`\`\`html code fence.`,"reverse-interview":`You are an interview strategy expert. Generate:
1. 10 probing questions to ask the interviewer
2. For each: what the answer reveals about the company
3. Red flag answers to watch for
4. Follow-up questions based on common responses
5. Questions about team dynamics, growth, and management style

Categorize by: Culture, Growth, Team, Technical, and Strategy.
Output as structured HTML in a \`\`\`html code fence.`,"rejection-reverser":`You are a professional networking expert. Create:
1. A graceful response to the rejection (under 100 words)
2. A follow-up that turns this into a networking opportunity
3. A "stay in touch" strategy for future openings
4. Questions to ask for constructive feedback
5. Alternative approaches: referrals to other teams/roles

Output as structured HTML in a \`\`\`html code fence.`,"prove-it":`You are a resume metrics coach. For each bullet:
1. Transform vague claims into quantified achievements
2. Add specific numbers, percentages, or dollar amounts
3. Use the X-Y-Z formula: "Accomplished X as measured by Y by doing Z"
4. Suggest metrics the candidate likely has but didn't mention
5. Maintain accuracy — only suggest plausible quantifications

Output before/after comparisons as structured HTML in a \`\`\`html code fence.`,"tech-screen":`You are a technical interview designer. Create a custom coding challenge:
1. Problem statement (clear, concise)
2. Input/output examples
3. Constraints and edge cases
4. Hints (progressive, 3 levels)
5. Optimal solution with explanation
6. Time/space complexity analysis
7. Follow-up questions the interviewer might ask

Tailor difficulty and language to the role and tech stack.
Output as structured HTML in a \`\`\`html code fence.`,"cold-email":`You are a cold outreach specialist. Write a cold email that:
- Subject line: compelling, under 50 chars
- Opening: personalized hook (not "I hope this finds you well")
- Body: specific value proposition in 2-3 sentences
- CTA: clear, low-friction ask
- Total: under 125 words
- Include a follow-up email for 3 days later

Output both emails as labeled HTML sections in a \`\`\`html code fence.`,"career-pivot":`You are a career transition advisor. Create a pivot roadmap:
1. Transferable skills mapping (current → target)
2. Skills gap analysis with learning recommendations
3. Bridge roles: intermediate positions to build toward the target
4. Networking strategy for the new industry
5. Resume repositioning tips
6. Timeline: realistic 3-6-12 month milestones
7. Success stories of similar pivots

Output as structured HTML in a \`\`\`html code fence.`};function E(a){return G[a]||"You are an expert career advisor. Provide detailed, actionable guidance based on the user's input. Output your response as clean HTML in a ```html code fence."}function X(){const{slug:a=""}=N(),{user:s,isLoading:n}=w(),{checkAccess:r,incrementUsage:t,getPreview:d,getTier:p}=_(),{generate:m,isGenerating:h}=z(),{showToast:o}=O(),i=M(),[c,j]=u.useState(!1),[T,C]=u.useState(!1),[b,S]=u.useState({}),[y,L]=u.useState(null),l=d(a),A=p(a);R({title:(l==null?void 0:l.name)||"AI Tool",description:l==null?void 0:l.desc,canonical:`https://tailormeswiftly.com/tools/${a}`}),u.useEffect(()=>{if(n)return;async function k(){const{allowed:f,reason:g}=await r(a);if(!f){if(g==="not_authenticated"){i("/login");return}C(!0)}j(!0)}k()},[a,n,r,i]);const H=u.useCallback(async()=>{const k=E(a),f=Object.entries(b).filter(([,x])=>x.trim()).map(([x,I])=>`${x}: ${I}`).join(`

`);if(!f.trim()){o("Please fill in the required fields.",!0);return}const g=await m({systemPrompt:k,userPrompt:f});g&&(L(g.resumeHtml||g.rawText),await t(a))},[a,b,m,t,o]);return!c||n?e.jsxs("div",{style:{display:"flex",justifyContent:"center",padding:"4rem",color:"var(--text-secondary)"},children:[e.jsx("i",{className:"fa-solid fa-spinner fa-spin",style:{marginRight:"0.5rem"}}),"Loading..."]}):l?e.jsxs("div",{style:{maxWidth:"800px",margin:"0 auto",padding:"2rem 1.5rem"},children:[e.jsx(q,{data:B({name:l.name,desc:l.desc,slug:a,tier:v[a]||"teaser"})}),e.jsx(q,{data:F([{name:"Home",url:"https://tailormeswiftly.com/"},{name:"Tools",url:"https://tailormeswiftly.com/tools"},{name:l.name,url:`https://tailormeswiftly.com/tools/${a}`}])}),T&&e.jsx(D,{onClose:()=>{C(!1),i("/dashboard")},toolPreview:l}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.75rem"},children:[e.jsx("div",{style:{width:"48px",height:"48px",borderRadius:"var(--brutal-radius)",background:"var(--primary-color, #10b981)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.25rem",color:"#fff"},children:e.jsx("i",{className:`fa-solid ${l.icon}`})}),e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:"1.5rem",color:"var(--text-primary)"},children:l.name}),A==="teaser"&&e.jsxs("span",{style:{fontSize:"0.75rem",color:"#f59e0b"},children:[e.jsx("i",{className:"fa-solid fa-sparkles"})," Free trial"]})]})]}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"0.9rem",lineHeight:1.6,margin:0},children:l.desc})]}),!y&&e.jsxs("div",{className:"glass-panel",style:{padding:"1.5rem"},children:[e.jsx(W,{slug:a,inputs:b,setInputs:S}),e.jsx("button",{onClick:H,disabled:h,className:"btn secondary-btn large-action-btn",children:h?e.jsxs(e.Fragment,{children:[e.jsx("i",{className:"fa-solid fa-spinner fa-spin"})," Generating..."]}):e.jsxs(e.Fragment,{children:[e.jsx("i",{className:"fa-solid fa-wand-magic-sparkles"})," Generate"]})})]}),y&&e.jsxs("div",{children:[e.jsx("div",{className:"glass-panel",style:{padding:"1.5rem",marginBottom:"1rem"},dangerouslySetInnerHTML:{__html:y}}),e.jsxs("div",{style:{display:"flex",gap:"0.75rem",flexWrap:"wrap"},children:[e.jsxs("button",{onClick:()=>{navigator.clipboard.writeText(y.replace(/<[^>]*>/g,"")),o("Copied to clipboard!")},className:"btn ghost-btn",children:[e.jsx("i",{className:"fa-solid fa-copy"})," Copy"]}),e.jsxs("button",{onClick:()=>{L(null),S({})},className:"btn ghost-btn",children:[e.jsx("i",{className:"fa-solid fa-rotate"})," Try Again"]})]})]})]}):e.jsxs("div",{style:{textAlign:"center",padding:"4rem"},children:[e.jsx("h2",{style:{color:"var(--text-primary)"},children:"Tool not found"}),e.jsxs("p",{style:{color:"var(--text-secondary)"},children:['The tool "',a,`" doesn't exist.`]})]})}function W({slug:a,inputs:s,setInputs:n}){const r=U(a);return e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"1rem"},children:r.map(t=>e.jsxs("div",{children:[e.jsxs("label",{style:{display:"block",marginBottom:"0.35rem",fontSize:"0.82rem",fontWeight:600,color:"var(--text-secondary)"},children:[t.label,t.required&&e.jsx("span",{style:{color:"#ef4444"},children:" *"})]}),t.type==="textarea"?e.jsx("textarea",{value:s[t.key]||"",onChange:d=>n(p=>({...p,[t.key]:d.target.value})),placeholder:t.placeholder,rows:5}):e.jsx("input",{type:t.type,value:s[t.key]||"",onChange:d=>n(p=>({...p,[t.key]:d.target.value})),placeholder:t.placeholder})]},t.key))})}function U(a){const s={key:"resume",label:"Your Resume",type:"textarea",placeholder:"Paste your resume text here...",required:!0},n={key:"jobDescription",label:"Job Description",type:"textarea",placeholder:"Paste the job description here...",required:!0},r={key:"company",label:"Target Company",type:"text",placeholder:"e.g., Google, Meta...",required:!0},t={key:"role",label:"Target Role",type:"text",placeholder:"e.g., Senior Software Engineer",required:!0};return{"cover-letter":[s,n,r,{key:"tone",label:"Tone",type:"text",placeholder:"e.g., Professional, Conversational",required:!1}],"pain-letter":[r,t,{key:"research",label:"Company Pain Points / Challenges",type:"textarea",placeholder:"What challenges is this company facing?",required:!1}],"hook-generator":[t,r,{key:"context",label:"Context (cold email, cover letter, LinkedIn)",type:"text",placeholder:"Where will you use this hook?",required:!0}],outreach:[s,r,t,{key:"contact",label:"Contact Name/Title",type:"text",placeholder:"e.g., Jane Smith, VP Engineering",required:!1}],"interview-prep":[s,n,r],"salary-negotiator":[t,r,{key:"currentSalary",label:"Current/Expected Salary",type:"text",placeholder:"e.g., $120,000",required:!0},{key:"offerDetails",label:"Offer Details",type:"textarea",placeholder:"Base salary, equity, benefits...",required:!1}],"toxic-radar":[r,t],"comp-decoder":[r,t,{key:"offerDetails",label:"Full Compensation Package",type:"textarea",placeholder:"Base, equity, bonus, benefits, PTO...",required:!0}],"shadow-jobs":[r,t,{key:"skills",label:"Your Key Skills",type:"textarea",placeholder:"List your main skills...",required:!0}],"guerrilla-tactics":[s,n,r],"referral-mapper":[r,t,{key:"network",label:"Your Network/LinkedIn Connections",type:"textarea",placeholder:"Describe your professional network...",required:!1}],"auto-app":[s,{key:"preferences",label:"Job Preferences",type:"textarea",placeholder:"Desired roles, locations, salary range, remote preference...",required:!0}],"thank-you":[r,t,{key:"interviewNotes",label:"Interview Notes",type:"textarea",placeholder:"Key topics discussed, interviewer names...",required:!0}],"ghosting-predictor":[r,t,{key:"listingUrl",label:"Job Listing URL",type:"text",placeholder:"https://...",required:!1},{key:"daysPosted",label:"Days Since Posted",type:"text",placeholder:"e.g., 30",required:!1}],"video-intro":[s,t,r],"skills-tracker":[{key:"skills",label:"Your Skills",type:"textarea",placeholder:"List your skills, one per line...",required:!0},t],"day-in-life":[r,t],"reverse-interview":[r,t,{key:"concerns",label:"Your Concerns/Priorities",type:"textarea",placeholder:"Work-life balance, growth, culture...",required:!1}],"rejection-reverser":[r,t,{key:"rejectionContext",label:"Rejection Context",type:"textarea",placeholder:"How were you rejected? Any feedback given?",required:!0}],"prove-it":[{key:"bullets",label:"Resume Bullets to Quantify",type:"textarea",placeholder:"Paste weak resume bullets, one per line...",required:!0}],"tech-screen":[t,r,{key:"techStack",label:"Tech Stack",type:"textarea",placeholder:"Languages, frameworks, tools...",required:!0}],"cold-email":[r,{key:"contact",label:"Contact Name/Title",type:"text",placeholder:"e.g., Jane Smith, VP Engineering",required:!0},s],"career-pivot":[{key:"currentRole",label:"Current Role/Industry",type:"text",placeholder:"e.g., Marketing Manager at a bank",required:!0},{key:"targetRole",label:"Target Role/Industry",type:"text",placeholder:"e.g., Product Manager in tech",required:!0},s]}[a]||[s,n]}export{X as default};
//# sourceMappingURL=ToolPage-D5CWWKYB.js.map
