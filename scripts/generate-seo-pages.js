#!/usr/bin/env node
/**
 * Programmatic SEO (pSEO) page generator for TailorMeSwiftly.
 *
 * Generates static HTML landing pages targeting long-tail keywords.
 * Each page follows the site's design system and links back to the tools.
 *
 * Usage:  node scripts/generate-seo-pages.js
 * Output: seo/*.html  +  seo/index.html (directory listing)
 *
 * Idempotent: safe to run repeatedly; overwrites existing files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEO_DIR = path.join(ROOT, 'seo');
const DOMAIN = 'https://tailormeswiftly.com';
const YEAR = new Date().getFullYear();

// ──────────────────────────────────────────────────────────────
// Data: job titles, industries, tools, and how-to topics
// ──────────────────────────────────────────────────────────────

const JOB_TITLES = [
  { slug: 'software-engineer', name: 'Software Engineer', plural: 'Software Engineers' },
  { slug: 'product-manager', name: 'Product Manager', plural: 'Product Managers' },
  { slug: 'data-scientist', name: 'Data Scientist', plural: 'Data Scientists' },
  { slug: 'ux-designer', name: 'UX Designer', plural: 'UX Designers' },
  { slug: 'marketing-manager', name: 'Marketing Manager', plural: 'Marketing Managers' },
  { slug: 'project-manager', name: 'Project Manager', plural: 'Project Managers' },
  { slug: 'financial-analyst', name: 'Financial Analyst', plural: 'Financial Analysts' },
  { slug: 'nurse', name: 'Nurse', plural: 'Nurses' },
  { slug: 'teacher', name: 'Teacher', plural: 'Teachers' },
  { slug: 'sales-representative', name: 'Sales Representative', plural: 'Sales Representatives' },
];

const INDUSTRIES = [
  { slug: 'tech', name: 'Tech', adj: 'technology' },
  { slug: 'healthcare', name: 'Healthcare', adj: 'healthcare' },
  { slug: 'finance', name: 'Finance', adj: 'financial services' },
  { slug: 'education', name: 'Education', adj: 'education' },
  { slug: 'marketing', name: 'Marketing', adj: 'marketing and advertising' },
  { slug: 'government', name: 'Government', adj: 'government and public sector' },
  { slug: 'consulting', name: 'Consulting', adj: 'consulting' },
  { slug: 'startup', name: 'Startup', adj: 'startup' },
  { slug: 'remote-work', name: 'Remote Work', adj: 'remote-first' },
];

const TOOLS = [
  {
    slug: 'resume-tailoring',
    name: 'Resume Tailoring',
    shortName: 'Resume Tailoring',
    category: 'resume',
    ctaPage: '/app.html',
    ctaLabel: 'Tailor Your Resume Now',
    icon: 'fa-file-lines',
  },
  {
    slug: 'cover-letter-generator',
    name: 'Cover Letter Generator',
    shortName: 'Cover Letter',
    category: 'cover-letter',
    ctaPage: '/app.html',
    ctaLabel: 'Generate Your Cover Letter',
    icon: 'fa-envelope-open-text',
  },
  {
    slug: 'interview-prep',
    name: 'Interview Prep',
    shortName: 'Interview Prep',
    category: 'interview-prep',
    ctaPage: '/interview-prep.html',
    ctaLabel: 'Start Interview Prep',
    icon: 'fa-microphone',
  },
  {
    slug: 'salary-negotiation',
    name: 'Salary Negotiation',
    shortName: 'Salary Negotiation',
    category: 'salary-negotiation',
    ctaPage: '/salary-negotiator.html',
    ctaLabel: 'Practice Salary Negotiation',
    icon: 'fa-coins',
  },
];

// Unique content paragraphs per job-title x tool combination
const JOB_CONTENT = {
  'software-engineer': {
    resume: `Software engineering resumes must balance technical depth with readability. ATS systems at major tech companies parse for specific programming languages, frameworks, and system-design keywords. TailorMeSwiftly analyzes the job description and restructures your bullet points to highlight relevant tech stacks, quantified impact metrics (latency reductions, throughput gains, users served), and architecture decisions that match what the hiring team is scanning for.`,
    'cover-letter': `A great cover-letter for a software engineering role goes beyond listing languages you know. It tells the story of a hard technical problem you solved, why the company's mission resonates with you, and how your engineering philosophy aligns with their team culture. TailorMeSwiftly pulls in company-specific context and recent product launches so your letter feels genuinely personalized, not templated.`,
    interview: `Software engineering interviews often include a mix of coding challenges, system design rounds, and behavioral questions. TailorMeSwiftly generates role-specific practice questions drawn from actual interview patterns at your target company, covering data structures, API design, concurrency, and the STAR-format behavioral scenarios hiring managers expect.`,
    salary: `Software engineering compensation packages are notoriously complex, blending base salary, RSUs, signing bonuses, and refresher grants. TailorMeSwiftly helps you decode total comp, benchmark against market data from Levels.fyi and Glassdoor, and practice the negotiation conversation so you can confidently ask for what you deserve.`,
  },
  'product-manager': {
    resume: `Product management resumes need to demonstrate business impact, not just feature shipping. ATS filters at top companies look for metrics like revenue growth, user adoption rates, and cross-functional leadership. TailorMeSwiftly rewrites your experience to foreground the outcomes that matter: market sizing, A/B test results, stakeholder alignment, and roadmap strategy.`,
    'cover-letter': `Product manager cover letters should read like a mini product brief. The best ones identify a real problem the company is facing, propose a thoughtful hypothesis, and tie your past experience to that opportunity. TailorMeSwiftly researches the company's recent launches and competitive landscape to help you write a letter that shows product thinking, not just career ambition.`,
    interview: `PM interviews blend case studies, metrics reasoning, prioritization frameworks, and cross-functional leadership scenarios. TailorMeSwiftly generates questions tailored to the company's product area, covering everything from RICE and ICE frameworks to estimation problems and go-to-market strategy discussions.`,
    salary: `Product management compensation varies dramatically by company stage, from startup equity-heavy packages to FAANG total comp. TailorMeSwiftly helps you compare offers across dimensions like equity vesting schedules, bonus multipliers, and level-appropriate base bands so you negotiate from a position of knowledge.`,
  },
  'data-scientist': {
    resume: `Data science resumes must walk the line between statistical rigor and business storytelling. ATS parsers scan for tools (Python, R, SQL, TensorFlow), methodologies (A/B testing, causal inference, NLP), and impact metrics. TailorMeSwiftly restructures your bullets to lead with the business outcome, follow with the methodology, and close with the tooling, matching the pattern that data-hiring managers prefer.`,
    'cover-letter': `A data scientist's cover letter should demonstrate curiosity and analytical thinking. Instead of listing models you have built, describe a question you pursued, the data you wrangled, and the insight that changed a decision. TailorMeSwiftly pulls the company's data challenges from public sources to help you draft a letter that sounds like a collaborator, not an applicant.`,
    interview: `Data science interviews span SQL proficiency, probability puzzles, ML system design, and business case analysis. TailorMeSwiftly generates practice rounds that mirror the company's interview loop, including take-home dataset exercises, whiteboard modeling sessions, and stakeholder communication scenarios.`,
    salary: `Data science compensation packages often include research-specific perks such as conference budgets, compute credits, and publication bonuses. TailorMeSwiftly decodes the full package, benchmarks by geography and seniority, and coaches you through negotiating a comp structure that values your specialized skills.`,
  },
  'ux-designer': {
    resume: `UX design resumes should blend portfolio highlights with measurable outcomes. ATS systems look for keywords around user research, wireframing, prototyping, and design systems. TailorMeSwiftly rewrites your experience to showcase how your design decisions moved business metrics, such as task completion rates, NPS improvements, and conversion lifts, not just deliverables.`,
    'cover-letter': `The best UX designer cover letters tell the story of a design decision. Describe the user pain point, the research that informed your approach, and the measured result. TailorMeSwiftly researches the company's product and recent design changes to help you speak directly to challenges the team is facing right now.`,
    interview: `UX design interviews typically involve portfolio reviews, whiteboard exercises, and design critiques. TailorMeSwiftly prepares you with role-specific questions about your design process, accessibility considerations, cross-functional collaboration, and how you handle stakeholder feedback and design trade-offs.`,
    salary: `UX designer compensation varies widely between agencies, startups, and enterprise companies. TailorMeSwiftly helps you benchmark your total package including base, equity, and perks, while coaching you on articulating the revenue impact of design work during negotiation.`,
  },
  'marketing-manager': {
    resume: `Marketing manager resumes must prove ROI. ATS filters scan for campaign metrics, channel expertise, and MarTech stack proficiency. TailorMeSwiftly restructures your experience to lead with revenue attribution, CAC reduction, and pipeline contribution, the language that marketing leadership and recruiters actively search for.`,
    'cover-letter': `A marketing manager's cover letter should read like a campaign brief: identify the audience (the hiring team), the challenge (their growth goals), and your proposed strategy (your experience). TailorMeSwiftly pulls the company's recent marketing initiatives and competitive positioning to help you craft a letter that demonstrates strategic thinking.`,
    interview: `Marketing interviews test strategic thinking, analytical skills, and creative execution. TailorMeSwiftly generates practice questions covering brand positioning, demand generation, content strategy, marketing analytics, and cross-functional collaboration with sales and product teams.`,
    salary: `Marketing manager compensation often includes performance bonuses tied to pipeline and revenue targets. TailorMeSwiftly helps you understand the full comp picture, benchmark against industry data, and negotiate a package that reflects the revenue impact your work drives.`,
  },
  'project-manager': {
    resume: `Project manager resumes need to quantify delivery excellence. ATS systems look for PMP/Agile certifications, budget management, and on-time delivery metrics. TailorMeSwiftly reshapes your bullets around stakeholder management, risk mitigation, and scope-delivery ratios, the signals that hiring managers parse for first.`,
    'cover-letter': `A project manager's cover letter should tell the story of a complex initiative you steered to completion. Highlight the scope, the obstacles, and the outcome. TailorMeSwiftly contextualizes your narrative with the company's project methodology and team structure to show you can hit the ground running.`,
    interview: `Project management interviews test situational judgment, stakeholder communication, and risk management. TailorMeSwiftly generates scenarios tailored to the company's domain, covering Agile ceremonies, resource allocation conflicts, scope creep, and executive-level status reporting.`,
    salary: `Project manager compensation often includes certification premiums and performance bonuses. TailorMeSwiftly benchmarks your package against PMP salary surveys and industry data, then coaches you on negotiating scope-appropriate comp for the complexity of projects you will manage.`,
  },
  'financial-analyst': {
    resume: `Financial analyst resumes must show analytical precision and business acumen. ATS filters prioritize Excel/SQL proficiency, financial modeling experience, and forecasting accuracy. TailorMeSwiftly reformats your experience to emphasize variance analysis, model accuracy, and the dollar-value decisions your analysis influenced.`,
    'cover-letter': `A financial analyst's cover letter should demonstrate your ability to turn data into decisions. Describe a forecast you built, an anomaly you caught, or a recommendation that saved money. TailorMeSwiftly layers in company-specific financial context so your letter speaks directly to the team's priorities.`,
    interview: `Financial analyst interviews combine technical modeling tests, case studies, and behavioral questions. TailorMeSwiftly generates practice rounds covering DCF modeling, sensitivity analysis, financial statement interpretation, and the presentation skills needed to communicate findings to non-financial stakeholders.`,
    salary: `Financial analyst compensation varies by sector, from investment banking to corporate FP&A. TailorMeSwiftly decodes bonus structures, sign-on incentives, and carried interest provisions, then coaches you on negotiation tactics specific to the financial services hiring process.`,
  },
  'nurse': {
    resume: `Nursing resumes must balance clinical competencies with patient outcomes. ATS systems at hospital networks scan for licensure, certifications (BLS, ACLS), specialty experience, and patient ratios. TailorMeSwiftly restructures your resume to highlight clinical skills, patient satisfaction scores, and quality improvement initiatives that healthcare recruiters prioritize.`,
    'cover-letter': `A nurse's cover letter should convey compassion, clinical expertise, and adaptability. Describe a patient care scenario that demonstrates critical thinking under pressure. TailorMeSwiftly tailors your letter to the specific unit, hospital system, and patient population so it resonates with nurse managers reviewing applications.`,
    interview: `Nursing interviews test clinical judgment, teamwork, and stress management. TailorMeSwiftly generates scenario-based questions covering patient prioritization, medication safety, interdisciplinary communication, and how you handle ethical dilemmas and emotional resilience in high-stakes environments.`,
    salary: `Nursing compensation includes shift differentials, overtime, housing stipends (for travel nurses), and specialty premiums. TailorMeSwiftly benchmarks your total package by specialty, geography, and facility type, then helps you negotiate for the schedule and benefits that matter most.`,
  },
  'teacher': {
    resume: `Teacher resumes should quantify educational impact, not just list courses taught. ATS systems at school districts scan for certifications, grade-level experience, and curriculum development. TailorMeSwiftly reshapes your bullets around student outcome improvements, standardized test gains, and innovative instructional methods that stand out.`,
    'cover-letter': `A teacher's cover letter should tell the story of a student or class you transformed. Describe your teaching philosophy in action, from lesson design to measurable results. TailorMeSwiftly aligns your narrative with the school's mission, demographics, and pedagogical approach so your application feels purposeful.`,
    interview: `Teaching interviews often include demo lessons, classroom management scenarios, and questions about differentiated instruction. TailorMeSwiftly prepares you with questions tailored to the school's curriculum framework, student population, and the educational philosophies they value most.`,
    salary: `Teacher compensation includes salary schedules, stipends for coaching or committee work, and benefits packages. TailorMeSwiftly helps you understand where you fall on the pay scale, what additional certifications boost your lane placement, and how to negotiate supplemental compensation.`,
  },
  'sales-representative': {
    resume: `Sales resumes live and die by the numbers. ATS filters prioritize quota attainment, deal sizes, and pipeline metrics. TailorMeSwiftly rewrites your experience to lead with revenue generated, win rates, and account expansion, the language that sales leaders scan for when reviewing a stack of candidates.`,
    'cover-letter': `A sales representative's cover letter should close like a pitch. Open with a hook about the company's market opportunity, tie your track record to their revenue goals, and end with a clear call to action. TailorMeSwiftly researches the company's competitive positioning to help you write a letter that demonstrates you have already done your homework.`,
    interview: `Sales interviews test closing ability, objection handling, and pipeline management. TailorMeSwiftly generates role-play scenarios and behavioral questions covering discovery calls, territory planning, CRM hygiene, and the consultative selling methodologies the company uses.`,
    salary: `Sales compensation is heavily variable, with OTE structures, accelerators, and SPIFFs. TailorMeSwiftly decodes the full comp plan, benchmarks base-to-variable ratios, and coaches you on negotiating ramp periods, draw provisions, and territory quality.`,
  },
};

const INDUSTRY_CONTENT = {
  tech: {
    resume: `The technology sector moves fast, and so does its hiring process. ATS systems at tech companies are among the most sophisticated, scanning for modern tech stacks, agile methodologies, and quantified engineering impact. TailorMeSwiftly understands the language that tech recruiters use and restructures your resume to match it, ensuring you clear both the automated and human filters.`,
    'cover-letter': `Tech companies receive thousands of applications per role. A standout cover letter connects your technical skills to the company's product vision and engineering culture. TailorMeSwiftly pulls recent product announcements, funding rounds, and blog posts to help you write a letter that shows you understand the company's trajectory, not just their tech stack.`,
    interview: `Tech industry interviews range from coding challenges to system design to culture-fit conversations. TailorMeSwiftly generates a practice loop tailored to the company's known interview format, whether it is a Google-style five-round process or a startup's take-home-plus-onsite approach.`,
    salary: `Tech compensation is multi-layered, combining base salary, RSUs, sign-on bonuses, and annual refreshers. TailorMeSwiftly decodes public comp data and internal levels to help you negotiate a package that reflects your market value, not just the initial offer.`,
  },
  healthcare: {
    resume: `Healthcare organizations use ATS systems configured for clinical compliance, scanning for active licensure, certification numbers, and specialty-specific terminology. TailorMeSwiftly formats your resume to satisfy both the compliance filters and the hiring manager, highlighting patient outcomes, quality metrics, and regulatory expertise in the right order.`,
    'cover-letter': `Healthcare hiring managers value empathy, clinical precision, and cultural fit. Your cover letter should convey patient-centered values alongside technical competence. TailorMeSwiftly researches the facility's patient population, Magnet status, and recent clinical initiatives to help you write a letter that resonates with the interview committee.`,
    interview: `Healthcare interviews evaluate clinical knowledge, ethical reasoning, and team collaboration. TailorMeSwiftly generates scenario-based questions specific to your specialty and the organization's care model, covering patient safety, interdisciplinary rounds, and evidence-based practice discussions.`,
    salary: `Healthcare compensation packages include shift differentials, call pay, CME allowances, and loan-repayment programs. TailorMeSwiftly benchmarks your package by specialty and geography, then coaches you on negotiating the non-salary elements that significantly impact total compensation.`,
  },
  finance: {
    resume: `Financial services firms use ATS systems that prioritize regulatory credentials (CFA, Series 7/63), modeling proficiency, and deal experience. TailorMeSwiftly restructures your resume to lead with the quantified outcomes, such as portfolio returns, risk-adjusted metrics, and transaction sizes, that finance recruiters value most.`,
    'cover-letter': `A finance cover letter must demonstrate analytical rigor and market awareness. The best ones reference a recent deal, market trend, or regulatory change and connect it to your experience. TailorMeSwiftly incorporates the firm's recent transactions and strategy to help you write a letter that reads like a research note, not a form letter.`,
    interview: `Finance interviews combine technical modeling tests, brain teasers, and fit questions. TailorMeSwiftly generates practice rounds covering DCF analysis, LBO modeling, market commentary, and the behavioral questions that assess your ability to work under pressure and tight deadlines.`,
    salary: `Finance compensation is heavily bonus-driven, with structures varying from guaranteed first-year bonuses to discretionary pools. TailorMeSwiftly benchmarks your total comp by role type, firm tier, and geography, then coaches you on the negotiation dynamics specific to financial services offers.`,
  },
  education: {
    resume: `Education sector ATS systems scan for teaching certifications, endorsements, and grade-level experience. District HR departments also look for evidence of differentiated instruction and data-driven teaching. TailorMeSwiftly formats your resume to satisfy both the automated filters and the principal reviewing applications, highlighting student growth metrics and curriculum innovation.`,
    'cover-letter': `Education cover letters should demonstrate your teaching philosophy in action. Describe a lesson that engaged struggling learners or a program you built from scratch. TailorMeSwiftly aligns your narrative with the school district's strategic plan, demographics, and pedagogical priorities so your application feels like a natural fit.`,
    interview: `Education interviews often include demo lessons, committee panels, and scenario-based questions. TailorMeSwiftly prepares you with questions tailored to the district's curriculum framework, student population, and the instructional strategies they value, from project-based learning to restorative practices.`,
    salary: `Education compensation follows structured salary schedules but includes negotiable elements like coaching stipends, department chair supplements, and tuition reimbursement. TailorMeSwiftly helps you understand lane and step placement, then identifies the supplemental pay opportunities that can significantly boost your earnings.`,
  },
  marketing: {
    resume: `Marketing industry ATS systems parse for campaign metrics, channel expertise (SEO, paid, email, social), and MarTech stack proficiency. TailorMeSwiftly reformats your resume to lead with revenue attribution and pipeline contribution, the metrics that CMOs and VPs of marketing actually care about when scanning resumes.`,
    'cover-letter': `A marketing cover letter should itself be a piece of compelling marketing. Open with an insight about the company's brand positioning, demonstrate your strategic thinking, and close with a clear value proposition. TailorMeSwiftly researches the company's recent campaigns and competitive landscape to make your letter genuinely relevant.`,
    interview: `Marketing interviews test both creative and analytical abilities. TailorMeSwiftly generates practice questions covering brand strategy, growth experiments, attribution modeling, and campaign post-mortems tailored to the company's market position and growth stage.`,
    salary: `Marketing compensation often includes performance bonuses tied to pipeline and revenue targets. TailorMeSwiftly benchmarks your package against industry data by specialization (growth, brand, product marketing) and company stage, then coaches you on articulating the revenue impact of your work.`,
  },
  government: {
    resume: `Government hiring uses structured ATS systems with strict keyword matching against position descriptions. Federal resumes require more detail than private-sector ones, including grade levels, hours per week, and supervisor contact information. TailorMeSwiftly reformats your resume for both USAJOBS and state/local government applications, ensuring you hit every mandatory keyword and formatting requirement.`,
    'cover-letter': `Government cover letters (often called "cover statements") must directly address the position's Knowledge, Skills, and Abilities (KSAs). TailorMeSwiftly maps your experience to each KSA in the posting, creating a structured response that demonstrates qualification while remaining readable and engaging.`,
    interview: `Government interviews follow structured panel formats with predetermined questions. TailorMeSwiftly generates practice questions based on the position's competency requirements, covering leadership, problem-solving, and the scenario-based behavioral questions that federal and state hiring panels use.`,
    salary: `Government compensation follows published pay scales (GS, SES, state equivalents) but offers negotiable elements like step increases, locality pay, and recruitment incentives. TailorMeSwiftly maps your experience to the appropriate grade and step, then identifies the negotiation levers available within the structured pay framework.`,
  },
  consulting: {
    resume: `Consulting firm ATS systems prioritize academic credentials, client-facing experience, and structured problem-solving evidence. TailorMeSwiftly reshapes your resume to highlight engagement outcomes, client impact, and the analytical frameworks you have applied, matching the format that MBB and Big Four recruiters expect to see.`,
    'cover-letter': `Consulting cover letters must demonstrate structured thinking in their very format. The best ones frame a business problem, walk through a hypothesis, and connect your experience to the firm's practice areas. TailorMeSwiftly researches the firm's recent thought leadership and client work to help you write a letter that mirrors the consulting mindset.`,
    interview: `Consulting interviews combine case studies, behavioral questions, and fit assessments. TailorMeSwiftly generates market-sizing problems, profitability cases, and organizational strategy scenarios tailored to the firm's industry focus, along with the structured behavioral questions that test your teamwork and leadership.`,
    salary: `Consulting compensation includes base salary, performance bonuses, and signing bonuses, with significant variation by firm tier and practice area. TailorMeSwiftly benchmarks your offer against published consulting salary data and coaches you on negotiating within the structured but flexible comp frameworks these firms use.`,
  },
  startup: {
    resume: `Startup hiring is fast and founder-driven, but most still use ATS tools like Lever, Greenhouse, or Ashby. They scan for versatility, pace, and impact-per-person metrics. TailorMeSwiftly optimizes your resume for startup ATS systems while emphasizing the scrappy, zero-to-one accomplishments and ownership mentality that startup founders look for.`,
    'cover-letter': `Startup cover letters should feel like a founder pitch. Show you understand the market, the product, and why this stage of the company excites you. TailorMeSwiftly pulls Crunchbase data, recent press, and product updates to help you write a letter that proves you have done your homework and are ready to move fast.`,
    interview: `Startup interviews are less standardized and more conversational, but no less rigorous. TailorMeSwiftly generates questions tailored to the company's stage and domain, covering everything from first-principles thinking to how you would prioritize when everything is on fire and resources are limited.`,
    salary: `Startup compensation trades lower base salary for equity upside. TailorMeSwiftly helps you evaluate option grants by analyzing strike price, vesting schedule, dilution risk, and comparable exit data, then coaches you on negotiating the base-to-equity mix that matches your risk tolerance.`,
  },
  'remote-work': {
    resume: `Remote-first companies use ATS systems tuned for async communication skills, self-direction, and distributed-team experience. TailorMeSwiftly restructures your resume to highlight remote-work competencies: written communication, cross-timezone collaboration, documentation practices, and the self-management skills that remote hiring managers prioritize.`,
    'cover-letter': `Remote work cover letters should prove you thrive without an office. Describe how you have managed projects asynchronously, built rapport across time zones, and maintained visibility in a distributed team. TailorMeSwiftly tailors your letter to the company's remote culture, referencing their handbook, async practices, and collaboration tools.`,
    interview: `Remote work interviews assess communication clarity, async collaboration skills, and self-direction. TailorMeSwiftly generates practice questions about managing work-from-home challenges, maintaining team cohesion across time zones, and demonstrating productivity without in-person oversight.`,
    salary: `Remote work compensation varies by geo-pricing strategy: some companies pay location-adjusted rates while others offer location-independent pay. TailorMeSwiftly helps you understand the company's compensation philosophy, benchmark your offer appropriately, and negotiate for the stipends (home office, internet, coworking) that add real value.`,
  },
};

// How-to pages (standalone educational content)
const HOW_TO_PAGES = [
  {
    slug: 'how-to-tailor-resume-for-ats',
    title: 'How to Tailor Your Resume for ATS Systems',
    metaDesc: 'Step-by-step guide to tailoring your resume so it passes Applicant Tracking Systems. Learn keyword optimization, formatting rules, and ATS-friendly templates.',
    heroSubtitle: 'A step-by-step guide to getting past the bots and in front of real humans.',
    sections: [
      { heading: 'What Is an ATS and Why Does It Matter?', body: 'An Applicant Tracking System (ATS) is software that employers use to collect, filter, and rank job applications. Over 98% of Fortune 500 companies and 75% of mid-size employers use an ATS. If your resume is not optimized for these systems, it may never reach a human reviewer, regardless of how qualified you are.' },
      { heading: 'Step 1: Mirror the Job Description Keywords', body: 'ATS systems match your resume against the job posting. Copy the exact phrases used in the description: if they say "project management," do not paraphrase it as "managing projects." TailorMeSwiftly automates this matching by analyzing the job description and inserting the right keywords into your resume naturally.' },
      { heading: 'Step 2: Use a Clean, Parseable Format', body: 'Avoid tables, text boxes, headers/footers, and multi-column layouts. Stick to standard section headings like "Experience," "Education," and "Skills." Use a common font (Arial, Calibri, Times New Roman) and save as .docx or .pdf depending on the employer\'s preference.' },
      { heading: 'Step 3: Quantify Your Achievements', body: 'Replace vague statements like "improved sales" with specific metrics: "Increased quarterly revenue by 34% ($2.1M) through targeted account-based marketing campaign." Numbers catch both ATS filters and human attention.' },
      { heading: 'Step 4: Tailor for Every Application', body: 'A single generic resume will not work. Each job posting uses different keywords and priorities. TailorMeSwiftly generates a uniquely tailored version for every application in seconds, so you never send the same resume twice.' },
    ],
    ctaPage: '/app.html',
    ctaLabel: 'Tailor Your Resume Now',
  },
  {
    slug: 'how-to-write-cover-letter-with-ai',
    title: 'How to Write a Cover Letter with AI',
    metaDesc: 'Learn how to use AI tools to write compelling, personalized cover letters that get responses. Includes prompts, best practices, and pitfalls to avoid.',
    heroSubtitle: 'Use AI to draft cover letters that sound human and land interviews.',
    sections: [
      { heading: 'Why AI Cover Letters Work', body: 'AI cover letter tools analyze the job description, your resume, and the company context to generate letters that are specifically tailored to each application. Unlike generic templates, AI-generated letters address the exact requirements of the role and weave in relevant details about the company.' },
      { heading: 'The Right Way to Use AI for Cover Letters', body: 'The best approach is collaborative: let AI generate the first draft based on your resume and the job posting, then edit for tone, add personal anecdotes, and ensure factual accuracy. TailorMeSwiftly produces a strong starting point that you can refine in minutes, not hours.' },
      { heading: 'What to Include in Every Cover Letter', body: 'Open with a specific hook (not "I am writing to apply"). Connect your top 2-3 achievements to the role requirements. Show you have researched the company. Close with a confident call to action. Keep it under 400 words.' },
      { heading: 'Common AI Cover Letter Mistakes', body: 'Avoid sending the AI output without editing. Watch for overly formal language, factual hallucinations, and generic phrases like "I am passionate about." Always add one personal detail that only you would know, such as a specific project or moment that shaped your career direction.' },
      { heading: 'How TailorMeSwiftly Makes It Easy', body: 'Upload your resume, paste the job description, and TailorMeSwiftly generates a personalized cover letter in seconds. It pulls company context, matches your experience to the role requirements, and produces a professional letter you can edit, export as PDF, or copy directly into an application portal.' },
    ],
    ctaPage: '/app.html',
    ctaLabel: 'Generate Your Cover Letter',
  },
  {
    slug: 'how-to-prepare-for-job-interview',
    title: 'How to Prepare for a Job Interview',
    metaDesc: 'Comprehensive interview preparation guide with AI-powered mock interviews, role-specific questions, and strategies to land the offer.',
    heroSubtitle: 'From research to follow-up: everything you need to ace your next interview.',
    sections: [
      { heading: 'Research the Company Thoroughly', body: 'Go beyond the "About" page. Read recent press releases, earnings calls, product launches, and employee reviews. Understand the company\'s competitive position and current challenges. TailorMeSwiftly\'s company research tools surface insights you can weave into your answers naturally.' },
      { heading: 'Practice With Role-Specific Questions', body: 'Generic interview prep is not enough. Each role type, whether engineering, product, sales, or design, has distinct question patterns. TailorMeSwiftly generates questions tailored to both the role and the specific company, so you practice the scenarios you will actually face.' },
      { heading: 'Master the STAR Method', body: 'Structure behavioral answers using Situation, Task, Action, Result. Prepare 8-10 STAR stories covering leadership, conflict resolution, failure, and achievement. Quantify your results wherever possible. Practice until each story takes 60-90 seconds to deliver.' },
      { heading: 'Prepare Your Questions', body: 'Always have 3-5 thoughtful questions ready. Ask about team dynamics, success metrics, and recent challenges, not salary or vacation policy. TailorMeSwiftly\'s Reverse Interview tool generates insightful questions based on company research and the specific role.' },
      { heading: 'Follow Up Strategically', body: 'Send a thank-you email within 24 hours that references a specific conversation topic. If you discussed a challenge, include a brief thought on how you would approach it. TailorMeSwiftly\'s Thank-You Engine generates personalized follow-ups that keep you top of mind.' },
    ],
    ctaPage: '/interview-prep.html',
    ctaLabel: 'Start Mock Interview Practice',
  },
  {
    slug: 'how-to-negotiate-salary',
    title: 'How to Negotiate Your Salary',
    metaDesc: 'Data-driven salary negotiation strategies for job offers and promotions. Learn scripts, counter-offer tactics, and how to decode total compensation.',
    heroSubtitle: 'Stop leaving money on the table. Learn to negotiate with confidence.',
    sections: [
      { heading: 'Know Your Market Value First', body: 'Before any negotiation, arm yourself with data. Research salary ranges on Glassdoor, Levels.fyi, Payscale, and industry-specific surveys. Factor in geography, company stage, and your experience level. TailorMeSwiftly\'s Comp Decoder analyzes the full package, not just base salary.' },
      { heading: 'Never Accept the First Offer', body: 'Initial offers are almost always negotiable, and employers expect you to negotiate. A simple "I am excited about this role. Based on my research and experience, I was expecting something closer to [target]" opens the conversation without being confrontational.' },
      { heading: 'Negotiate Total Compensation, Not Just Salary', body: 'Base salary is only part of the picture. Equity grants, signing bonuses, performance bonuses, PTO, remote-work flexibility, and professional development budgets are all negotiable. Sometimes the best gains come from non-salary elements.' },
      { heading: 'Practice the Conversation', body: 'Negotiation is a skill that improves with practice. TailorMeSwiftly\'s Salary Negotiator lets you practice the conversation voice-to-voice with an AI trained on real HR negotiation tactics. Get feedback on your tone, phrasing, and strategy before the real call.' },
      { heading: 'Handle Counter-Offers Gracefully', body: 'If the employer counters below your target, ask what it would take to reach your number within 6-12 months. Tie your request to performance milestones. This shows you are reasonable and forward-thinking, not just asking for more money.' },
    ],
    ctaPage: '/salary-negotiator.html',
    ctaLabel: 'Practice Salary Negotiation',
  },
];

// Best-of category pages
const BEST_OF_PAGES = [
  {
    slug: `best-resume-tools-${YEAR}`,
    title: `Best Resume Tools ${YEAR}`,
    metaDesc: `Compare the top resume tailoring and optimization tools of ${YEAR}. AI-powered ATS checkers, formatting tools, and resume builders reviewed.`,
    heroSubtitle: `The definitive guide to resume tools that actually help you land interviews in ${YEAR}.`,
    category: 'Resume Tools',
    tools: [
      { name: 'TailorMeSwiftly Resume Tailoring', desc: 'AI-powered resume tailoring that analyzes job descriptions and restructures your resume for maximum ATS compatibility. Includes 15+ professional templates, keyword optimization, and real-time scoring.', highlight: true },
      { name: 'ATS Resume Scanners', desc: 'Tools that scan your resume against a job description and provide a match percentage. Useful for quick checks, but they only diagnose problems without fixing them.' },
      { name: 'Resume Builders', desc: 'Template-based resume creators that help you build a resume from scratch. Good for first-time job seekers but limited in customization and ATS optimization.' },
      { name: 'Keyword Optimizers', desc: 'Tools that extract keywords from job descriptions and suggest additions. Helpful as a supplement but do not restructure content for narrative flow.' },
    ],
  },
  {
    slug: `best-cover-letter-tools-${YEAR}`,
    title: `Best Cover Letter Tools ${YEAR}`,
    metaDesc: `Review the best AI cover letter generators and writing tools for ${YEAR}. Personalized, job-specific cover letters that actually get read.`,
    heroSubtitle: `Stop sending generic cover letters. Here are the tools that make every application personal.`,
    category: 'Cover Letter Tools',
    tools: [
      { name: 'TailorMeSwiftly Cover Letter Generator', desc: 'Generates role-specific cover letters by analyzing your resume, the job description, and company context. Produces personalized letters with natural tone that you can edit and export as PDF.', highlight: true },
      { name: 'AI Writing Assistants', desc: 'General-purpose AI writing tools (ChatGPT, Claude, etc.) can draft cover letters but require careful prompting and lack job-specific context without manual input.' },
      { name: 'Cover Letter Templates', desc: 'Pre-formatted templates with fill-in-the-blank sections. Fast to use but produce generic letters that recruiters can spot immediately.' },
    ],
  },
  {
    slug: `best-interview-prep-tools-${YEAR}`,
    title: `Best Interview Prep Tools ${YEAR}`,
    metaDesc: `Top interview preparation tools and AI mock interview platforms for ${YEAR}. Practice with role-specific questions and get real-time feedback.`,
    heroSubtitle: `Prepare for interviews with AI-powered practice that adapts to your target role and company.`,
    category: 'Interview Prep Tools',
    tools: [
      { name: 'TailorMeSwiftly Mock Interview', desc: 'AI-powered mock interviews with 10 role-specific questions, voice interaction, and detailed feedback on content, delivery, and confidence. Tailored to your target company and role.', highlight: true },
      { name: 'Video Practice Platforms', desc: 'Tools that record your video responses and provide basic feedback on pacing and filler words. Useful for self-awareness but lack role-specific question generation.' },
      { name: 'Question Banks', desc: 'Collections of common interview questions organized by role type. Helpful for brainstorming but static and not tailored to specific companies or positions.' },
    ],
  },
  {
    slug: `best-salary-negotiation-tools-${YEAR}`,
    title: `Best Salary Negotiation Tools ${YEAR}`,
    metaDesc: `Compare salary negotiation tools and compensation analyzers for ${YEAR}. Practice negotiations, decode offers, and benchmark your pay.`,
    heroSubtitle: `Negotiate with data and confidence. The best tools to maximize your compensation.`,
    category: 'Salary Negotiation Tools',
    tools: [
      { name: 'TailorMeSwiftly Salary Negotiator', desc: 'Practice salary negotiations voice-to-voice with an AI HR representative trained on real negotiation tactics. Get coached on strategy, counter-offers, and total comp optimization.', highlight: true },
      { name: 'Salary Databases', desc: 'Platforms like Levels.fyi, Glassdoor, and Payscale that aggregate compensation data. Essential for research but do not help with the negotiation conversation itself.' },
      { name: 'Offer Comparison Calculators', desc: 'Spreadsheet-style tools that compare multiple offers side by side, factoring in base, equity, bonuses, and cost of living. Useful for analysis but not for practice.' },
    ],
  },
];

// ──────────────────────────────────────────────────────────────
// Template helpers
// ──────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function htmlHead({ title, metaDesc, canonicalPath, ogTitle }) {
  const canonical = `${DOMAIN}/${canonicalPath}`;
  const twitterTitle = ogTitle || title;
  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeAttr(metaDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="TailorMeSwiftly">
  <meta property="og:title" content="${escapeAttr(ogTitle || title)}">
  <meta property="og:description" content="${escapeAttr(metaDesc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${DOMAIN}/logo.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeAttr(twitterTitle)}">
  <meta name="twitter:description" content="${escapeAttr(metaDesc)}">
  <meta name="twitter:image" content="${DOMAIN}/logo.png">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <title>${escapeHtml(title)} | TailorMeSwiftly</title>
  <link rel="stylesheet" href="/style.css?v=17">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`;
}

function jsonLd({ title, description, canonicalPath }) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: `${DOMAIN}/${canonicalPath}`,
    publisher: {
      '@type': 'Organization',
      name: 'TailorMeSwiftly',
      url: DOMAIN,
      logo: { '@type': 'ImageObject', url: `${DOMAIN}/logo.png` },
    },
  };
  return `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n  </script>`;
}

function pageStyles() {
  return `  <style>
    .seo-page { max-width: 800px; margin: 0 auto; padding: 0 1.5rem 4rem; }
    .seo-hero { text-align: center; padding: 3.5rem 0 2.5rem; }
    .seo-hero h1 { font-size: clamp(1.8rem, 4.5vw, 2.6rem); font-weight: 700; line-height: 1.2; color: var(--text-primary); letter-spacing: -0.02em; }
    .seo-hero h1 .seo-gradient { background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .seo-hero-sub { font-size: 1.1rem; color: var(--text-secondary); line-height: 1.7; max-width: 600px; margin: 1rem auto 2rem; }
    .seo-cta { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1.05rem; padding: 0.85rem 2rem; border-radius: var(--brutal-radius); text-decoration: none; font-weight: 600; background: var(--primary-color); color: var(--btn-primary-text); box-shadow: var(--brutal-shadow); transition: transform 0.15s, box-shadow 0.15s; }
    .seo-cta:hover { transform: translate(-2px, -2px); box-shadow: var(--brutal-shadow-hover); }
    .seo-section { margin-bottom: 2.5rem; }
    .seo-section h2 { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem; }
    .seo-section p { color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; }
    .seo-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin: 2rem 0; }
    .seo-feature { background: var(--panel-bg); border: 1px dashed var(--panel-border); border-radius: var(--brutal-radius); padding: 1.25rem; }
    .seo-feature h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; }
    .seo-feature p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }
    .seo-feature i { color: var(--primary-color); margin-right: 0.4rem; }
    .seo-links { margin-top: 3rem; padding-top: 2rem; border-top: 1px dashed var(--panel-border); }
    .seo-links h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; }
    .seo-links-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .seo-links-grid a { font-size: 0.85rem; color: var(--primary-color); text-decoration: none; padding: 0.35rem 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--brutal-radius); transition: background 0.2s; }
    .seo-links-grid a:hover { background: var(--panel-bg); }
    .seo-breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem; padding-top: 1.5rem; }
    .seo-breadcrumb a { color: var(--text-secondary); text-decoration: none; }
    .seo-breadcrumb a:hover { color: var(--primary-color); }
    .seo-breadcrumb i { font-size: 0.6rem; opacity: 0.6; }
    .seo-tool-card { background: var(--panel-bg); border: 1px dashed var(--panel-border); border-radius: var(--brutal-radius); padding: 1.5rem; margin-bottom: 1.25rem; }
    .seo-tool-card.highlight { border-color: var(--primary-color); border-style: solid; }
    .seo-tool-card h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; }
    .seo-tool-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7; }
    .seo-tool-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--primary-color); background: rgba(163,196,220,0.1); padding: 0.2rem 0.6rem; border-radius: 3px; margin-bottom: 0.5rem; }
    @media (max-width: 600px) { .seo-hero { padding: 2rem 0 1.5rem; } .seo-page { padding: 0 1rem 3rem; } }
  </style>`;
}

function siteHeader() {
  return `  <header class="app-header" role="banner">
    <a href="/" class="logo maker-mark" style="text-decoration:none;color:inherit;">
      <span class="mark-border">
        <span class="mark-text">TMS</span>
      </span>
      <div class="mark-name">
        <span class="mark-script">TailorMeSwiftly</span>
        <span class="mark-sub">BESPOKE APPLICATION ENGINE</span>
      </div>
    </a>
    <div class="header-actions" style="display: flex; gap: 0.25rem; align-items: center;">
      <a href="/pricing.html" title="Pricing"
        style="text-decoration: none; color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; padding: 0.4rem 0.6rem; border-radius: 8px; transition: color 0.2s;">
        <i class="fa-solid fa-gem"></i> Pricing
      </a>
      <a href="/login.html?signup=true" class="btn secondary-btn"
        style="padding: 0.45rem 0.9rem; text-decoration: none; font-size: 0.85rem; margin-left: 0.25rem;">
        Sign Up
      </a>
    </div>
  </header>`;
}

function siteFooter() {
  return `  <footer class="site-footer" role="contentinfo">
    <p>&copy; ${YEAR} TailorMeSwiftly.com. One platform for your entire career trajectory.</p>
    <p><a href="/pricing.html">Pricing</a> | <a href="/help.html">Help Center</a> | <a href="/terms.html">Terms &amp; Conditions</a> | <a href="/privacy.html">Privacy Policy</a> | <a href="/security.html">Security Policy</a></p>
  </footer>`;
}

function internalLinks(currentSlug, relatedSlugs) {
  // Always include a base set of links, plus related pages
  const baseLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing.html', label: 'Pricing' },
    { href: '/blog.html', label: 'Blog' },
    { href: '/help.html', label: 'Help Center' },
  ];

  const seoLinks = relatedSlugs
    .filter(s => s !== currentSlug)
    .slice(0, 8)
    .map(s => {
      const href = `/seo/${s}.html`;
      const label = s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { href, label };
    });

  const allLinks = [...baseLinks, ...seoLinks];

  return `    <div class="seo-links">
      <h3>Explore More</h3>
      <div class="seo-links-grid">
${allLinks.map(l => `        <a href="${l.href}">${l.label}</a>`).join('\n')}
      </div>
    </div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ──────────────────────────────────────────────────────────────
// Page generators
// ──────────────────────────────────────────────────────────────

const allPages = []; // { slug, title, filename } for index generation

function buildToolForJobPage(tool, job) {
  const slug = `${tool.slug}-for-${job.slug}`;
  const filename = `${slug}.html`;
  const title = `${tool.name} for ${job.plural}`;
  const metaDesc = `${tool.name} built specifically for ${job.plural}. AI-powered tools to tailor your application, pass ATS systems, and land ${job.name} roles faster.`;
  const canonicalPath = `seo/${filename}`;
  const content = JOB_CONTENT[job.slug]?.[tool.category] || '';

  // Gather related page slugs
  const relatedSlugs = [
    ...TOOLS.filter(t => t.slug !== tool.slug).map(t => `${t.slug}-for-${job.slug}`),
    ...INDUSTRIES.slice(0, 3).map(ind => `${tool.slug}-for-${ind.slug}`),
    `best-${tool.category}-tools-${YEAR}`,
  ];

  const features = [
    { icon: 'fa-bullseye', title: `${job.name}-Specific Optimization`, desc: `Tailored for the keywords, skills, and terminology that ${job.name} hiring managers and ATS systems look for.` },
    { icon: 'fa-robot', title: 'AI-Powered Analysis', desc: `Our AI reads the job description and restructures your application to maximize relevance for ${job.name} positions.` },
    { icon: 'fa-clock', title: 'Ready in Seconds', desc: `Generate a customized, ATS-optimized ${tool.shortName.toLowerCase()} in under 30 seconds. Edit, export, and apply.` },
  ];

  const html = `${htmlHead({ title, metaDesc, canonicalPath, ogTitle: title })}
${pageStyles()}
${jsonLd({ title, description: metaDesc, canonicalPath })}
</head>

<body>
${siteHeader()}

  <main class="seo-page">
    <nav class="seo-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <i class="fa-solid fa-chevron-right"></i>
      <a href="/seo/">SEO Resources</a>
      <i class="fa-solid fa-chevron-right"></i>
      <span>${escapeHtml(title)}</span>
    </nav>

    <section class="seo-hero">
      <h1><span class="seo-gradient">${escapeHtml(tool.name)}</span> for ${escapeHtml(job.plural)}</h1>
      <p class="seo-hero-sub">AI-powered ${tool.shortName.toLowerCase()} built for ${job.plural}. Optimize your application for the exact keywords, skills, and formatting that ${job.name} hiring managers expect.</p>
      <a href="${tool.ctaPage}" class="seo-cta"><i class="fa-solid ${tool.icon}"></i> ${tool.ctaLabel}</a>
    </section>

    <section class="seo-section">
      <h2>Why ${escapeHtml(job.plural)} Need Specialized ${escapeHtml(tool.name)}</h2>
      <p>${content}</p>
    </section>

    <div class="seo-features">
${features.map(f => `      <div class="seo-feature">
        <h3><i class="fa-solid ${f.icon}"></i> ${f.title}</h3>
        <p>${f.desc}</p>
      </div>`).join('\n')}
    </div>

    <section class="seo-section">
      <h2>How It Works</h2>
      <p>1. Upload your current resume or paste your experience details. 2. Paste the ${job.name} job description you are targeting. 3. TailorMeSwiftly's AI analyzes both documents, identifies keyword gaps, and generates a tailored ${tool.shortName.toLowerCase()} optimized for that specific role. The entire process takes under 30 seconds.</p>
    </section>

    <section class="seo-section">
      <h2>Frequently Asked Questions</h2>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>Is this tool free for ${escapeHtml(job.plural)}?</h3>
        <p>TailorMeSwiftly offers a free tier that includes basic ${tool.shortName.toLowerCase()} generation. Premium features like advanced ATS scoring and unlimited exports are available with a subscription. <a href="/pricing.html" style="color: var(--primary-color);">See pricing details.</a></p>
      </div>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>How is this different from a generic ${tool.shortName.toLowerCase()} tool?</h3>
        <p>Generic tools apply one-size-fits-all optimization. TailorMeSwiftly understands that ${job.name} roles have specific keyword patterns, industry jargon, and formatting expectations that differ from other professions. Our AI is trained to recognize and optimize for these differences.</p>
      </div>
      <div class="seo-feature">
        <h3>What file formats are supported?</h3>
        <p>You can upload your resume as PDF, DOCX, or plain text. Generated outputs can be exported as PDF, DOCX, or copied as formatted text for pasting into application portals.</p>
      </div>
    </section>

    <section style="text-align: center; margin: 2.5rem 0;">
      <a href="${tool.ctaPage}" class="seo-cta"><i class="fa-solid ${tool.icon}"></i> ${tool.ctaLabel}</a>
    </section>

${internalLinks(slug, relatedSlugs)}
  </main>

${siteFooter()}
</body>
</html>`;

  allPages.push({ slug, title, filename });
  return { filename, html };
}

function buildToolForIndustryPage(tool, industry) {
  const slug = `${tool.slug}-for-${industry.slug}`;
  const filename = `${slug}.html`;
  const title = `${tool.name} for ${industry.name}`;
  const metaDesc = `${tool.name} designed for ${industry.adj} professionals. AI-optimized applications that match ${industry.name} industry standards and ATS requirements.`;
  const canonicalPath = `seo/${filename}`;
  const content = INDUSTRY_CONTENT[industry.slug]?.[tool.category] || '';

  const relatedSlugs = [
    ...TOOLS.filter(t => t.slug !== tool.slug).map(t => `${t.slug}-for-${industry.slug}`),
    ...JOB_TITLES.slice(0, 3).map(jt => `${tool.slug}-for-${jt.slug}`),
    `best-${tool.category}-tools-${YEAR}`,
  ];

  const features = [
    { icon: 'fa-industry', title: `${industry.name} Industry Focus`, desc: `Optimized for the terminology, compliance requirements, and hiring patterns specific to the ${industry.adj} sector.` },
    { icon: 'fa-magnifying-glass', title: 'Industry-Specific ATS', desc: `${industry.name} companies use ATS configurations tuned for industry-specific credentials and keywords. Our AI matches those patterns.` },
    { icon: 'fa-chart-line', title: 'Competitive Advantage', desc: `Stand out among ${industry.adj} candidates with applications that demonstrate deep sector understanding and relevant experience.` },
  ];

  const html = `${htmlHead({ title, metaDesc, canonicalPath, ogTitle: title })}
${pageStyles()}
${jsonLd({ title, description: metaDesc, canonicalPath })}
</head>

<body>
${siteHeader()}

  <main class="seo-page">
    <nav class="seo-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <i class="fa-solid fa-chevron-right"></i>
      <a href="/seo/">SEO Resources</a>
      <i class="fa-solid fa-chevron-right"></i>
      <span>${escapeHtml(title)}</span>
    </nav>

    <section class="seo-hero">
      <h1><span class="seo-gradient">${escapeHtml(tool.name)}</span> for ${escapeHtml(industry.name)}</h1>
      <p class="seo-hero-sub">AI-powered ${tool.shortName.toLowerCase()} crafted for ${industry.adj} professionals. Optimized for the industry-specific keywords, certifications, and formatting that ${industry.name} hiring teams expect.</p>
      <a href="${tool.ctaPage}" class="seo-cta"><i class="fa-solid ${tool.icon}"></i> ${tool.ctaLabel}</a>
    </section>

    <section class="seo-section">
      <h2>${escapeHtml(tool.name)} in the ${escapeHtml(industry.name)} Industry</h2>
      <p>${content}</p>
    </section>

    <div class="seo-features">
${features.map(f => `      <div class="seo-feature">
        <h3><i class="fa-solid ${f.icon}"></i> ${f.title}</h3>
        <p>${f.desc}</p>
      </div>`).join('\n')}
    </div>

    <section class="seo-section">
      <h2>Why ${escapeHtml(industry.name)} Professionals Choose TailorMeSwiftly</h2>
      <p>The ${industry.adj} sector has unique hiring practices, from specialized ATS configurations to industry-specific credentialing requirements. TailorMeSwiftly's AI understands these nuances and generates applications that satisfy both automated filters and human reviewers in the ${industry.name} space.</p>
    </section>

    <section class="seo-section">
      <h2>How to Get Started</h2>
      <p>1. Upload your resume or paste your professional experience. 2. Add the job description from your target ${industry.name} role. 3. TailorMeSwiftly generates an optimized ${tool.shortName.toLowerCase()} in seconds, calibrated for ${industry.adj} hiring standards. Review, edit, and export in your preferred format.</p>
    </section>

    <section class="seo-section">
      <h2>Common Questions</h2>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>Does TailorMeSwiftly understand ${escapeHtml(industry.name)} terminology?</h3>
        <p>Yes. Our AI is trained on ${industry.adj} job descriptions, industry publications, and hiring patterns to accurately match the language used by ${industry.name} employers and their ATS systems.</p>
      </div>
      <div class="seo-feature">
        <h3>Can I use this for multiple ${escapeHtml(industry.name)} roles?</h3>
        <p>Absolutely. TailorMeSwiftly generates a unique, tailored output for every job description you submit. Apply to multiple ${industry.name} positions with applications optimized for each one.</p>
      </div>
    </section>

    <section style="text-align: center; margin: 2.5rem 0;">
      <a href="${tool.ctaPage}" class="seo-cta"><i class="fa-solid ${tool.icon}"></i> ${tool.ctaLabel}</a>
    </section>

${internalLinks(slug, relatedSlugs)}
  </main>

${siteFooter()}
</body>
</html>`;

  allPages.push({ slug, title, filename });
  return { filename, html };
}

function buildHowToPage(page) {
  const filename = `${page.slug}.html`;
  const canonicalPath = `seo/${filename}`;

  const relatedSlugs = [
    ...HOW_TO_PAGES.filter(p => p.slug !== page.slug).map(p => p.slug),
    ...BEST_OF_PAGES.map(p => p.slug),
    'resume-tailoring-for-software-engineer',
    'cover-letter-generator-for-tech',
  ];

  const html = `${htmlHead({ title: page.title, metaDesc: page.metaDesc, canonicalPath, ogTitle: page.title })}
${pageStyles()}
${jsonLd({ title: page.title, description: page.metaDesc, canonicalPath })}
</head>

<body>
${siteHeader()}

  <main class="seo-page">
    <nav class="seo-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <i class="fa-solid fa-chevron-right"></i>
      <a href="/seo/">SEO Resources</a>
      <i class="fa-solid fa-chevron-right"></i>
      <span>${escapeHtml(page.title)}</span>
    </nav>

    <section class="seo-hero">
      <h1><span class="seo-gradient">${escapeHtml(page.title)}</span></h1>
      <p class="seo-hero-sub">${escapeHtml(page.heroSubtitle)}</p>
    </section>

${page.sections.map(s => `    <section class="seo-section">
      <h2>${escapeHtml(s.heading)}</h2>
      <p>${s.body}</p>
    </section>`).join('\n\n')}

    <section style="text-align: center; margin: 2.5rem 0;">
      <a href="${page.ctaPage}" class="seo-cta"><i class="fa-solid fa-arrow-right"></i> ${page.ctaLabel}</a>
    </section>

${internalLinks(page.slug, relatedSlugs)}
  </main>

${siteFooter()}
</body>
</html>`;

  allPages.push({ slug: page.slug, title: page.title, filename });
  return { filename, html };
}

function buildBestOfPage(page) {
  const filename = `${page.slug}.html`;
  const canonicalPath = `seo/${filename}`;

  const relatedSlugs = [
    ...BEST_OF_PAGES.filter(p => p.slug !== page.slug).map(p => p.slug),
    ...HOW_TO_PAGES.map(p => p.slug),
    'resume-tailoring-for-software-engineer',
    'cover-letter-generator-for-tech',
  ];

  const html = `${htmlHead({ title: page.title, metaDesc: page.metaDesc, canonicalPath, ogTitle: page.title })}
${pageStyles()}
${jsonLd({ title: page.title, description: page.metaDesc, canonicalPath })}
</head>

<body>
${siteHeader()}

  <main class="seo-page">
    <nav class="seo-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <i class="fa-solid fa-chevron-right"></i>
      <a href="/seo/">SEO Resources</a>
      <i class="fa-solid fa-chevron-right"></i>
      <span>${escapeHtml(page.title)}</span>
    </nav>

    <section class="seo-hero">
      <h1><span class="seo-gradient">${escapeHtml(page.title)}</span></h1>
      <p class="seo-hero-sub">${escapeHtml(page.heroSubtitle)}</p>
    </section>

    <section class="seo-section">
      <h2>Top ${escapeHtml(page.category)} Compared</h2>
      <p>We reviewed the leading ${page.category.toLowerCase()} available in ${YEAR} and compared them on accuracy, ease of use, ATS compatibility, and value. Here is what we found.</p>
    </section>

${page.tools.map(t => `    <div class="seo-tool-card${t.highlight ? ' highlight' : ''}">
${t.highlight ? '      <span class="seo-tool-badge">Our Pick</span>\n' : ''}      <h3>${escapeHtml(t.name)}</h3>
      <p>${t.desc}</p>
    </div>`).join('\n\n')}

    <section class="seo-section" style="margin-top: 2rem;">
      <h2>How We Evaluated</h2>
      <p>Each tool was tested against real job descriptions across multiple industries. We measured ATS parse success rates, content quality, personalization depth, and time-to-output. Our recommendations reflect tools that consistently delivered higher interview callback rates in our testing.</p>
    </section>

    <section style="text-align: center; margin: 2.5rem 0;">
      <a href="/app.html" class="seo-cta"><i class="fa-solid fa-rocket"></i> Try TailorMeSwiftly Free</a>
    </section>

${internalLinks(page.slug, relatedSlugs)}
  </main>

${siteFooter()}
</body>
</html>`;

  allPages.push({ slug: page.slug, title: page.title, filename });
  return { filename, html };
}

function buildIndexPage() {
  // Group pages by category
  const jobPages = allPages.filter(p => JOB_TITLES.some(j => p.slug.endsWith(`-for-${j.slug}`)));
  const industryPages = allPages.filter(p => INDUSTRIES.some(i => p.slug.endsWith(`-for-${i.slug}`)));
  const howToPages = allPages.filter(p => p.slug.startsWith('how-to-'));
  const bestOfPages = allPages.filter(p => p.slug.startsWith('best-'));

  const metaDesc = 'Browse all TailorMeSwiftly career resources: resume tailoring guides, cover letter tips, interview prep, and salary negotiation tools for every job title and industry.';

  const html = `${htmlHead({ title: 'Career Resources Directory', metaDesc, canonicalPath: 'seo/index.html', ogTitle: 'Career Resources | TailorMeSwiftly' })}
${pageStyles()}
  <style>
    .seo-index-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; margin-bottom: 2rem; }
    .seo-index-card { display: block; padding: 0.85rem 1rem; background: var(--panel-bg); border: 1px dashed var(--panel-border); border-radius: var(--brutal-radius); text-decoration: none; color: var(--text-primary); font-size: 0.9rem; font-weight: 500; transition: background 0.2s, border-color 0.2s; }
    .seo-index-card:hover { background: rgba(163,196,220,0.08); border-color: var(--primary-color); }
    .seo-category { margin-bottom: 2.5rem; }
    .seo-category h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--panel-border); }
  </style>
${jsonLd({ title: 'Career Resources Directory', description: metaDesc, canonicalPath: 'seo/index.html' })}
</head>

<body>
${siteHeader()}

  <main class="seo-page">
    <section class="seo-hero">
      <h1><span class="seo-gradient">Career Resources</span> Directory</h1>
      <p class="seo-hero-sub">Browse ${allPages.length} targeted guides for every job title, industry, and career challenge. Each resource is designed to help you land your next role faster.</p>
    </section>

    <div class="seo-category">
      <h2><i class="fa-solid fa-graduation-cap" style="color: var(--primary-color); margin-right: 0.4rem;"></i> How-To Guides</h2>
      <div class="seo-index-grid">
${howToPages.map(p => `        <a href="${p.filename}" class="seo-index-card">${escapeHtml(p.title)}</a>`).join('\n')}
      </div>
    </div>

    <div class="seo-category">
      <h2><i class="fa-solid fa-trophy" style="color: var(--primary-color); margin-right: 0.4rem;"></i> Best Tools ${YEAR}</h2>
      <div class="seo-index-grid">
${bestOfPages.map(p => `        <a href="${p.filename}" class="seo-index-card">${escapeHtml(p.title)}</a>`).join('\n')}
      </div>
    </div>

    <div class="seo-category">
      <h2><i class="fa-solid fa-briefcase" style="color: var(--primary-color); margin-right: 0.4rem;"></i> By Job Title</h2>
      <div class="seo-index-grid">
${jobPages.map(p => `        <a href="${p.filename}" class="seo-index-card">${escapeHtml(p.title)}</a>`).join('\n')}
      </div>
    </div>

    <div class="seo-category">
      <h2><i class="fa-solid fa-building" style="color: var(--primary-color); margin-right: 0.4rem;"></i> By Industry</h2>
      <div class="seo-index-grid">
${industryPages.map(p => `        <a href="${p.filename}" class="seo-index-card">${escapeHtml(p.title)}</a>`).join('\n')}
      </div>
    </div>

    <section style="text-align: center; margin: 2.5rem 0;">
      <a href="/app.html" class="seo-cta"><i class="fa-solid fa-rocket"></i> Try TailorMeSwiftly Free</a>
    </section>
  </main>

${siteFooter()}
</body>
</html>`;

  return { filename: 'index.html', html };
}

// ──────────────────────────────────────────────────────────────
// Main: generate all pages
// ──────────────────────────────────────────────────────────────

function main() {
  // Ensure output dir exists
  if (!fs.existsSync(SEO_DIR)) {
    fs.mkdirSync(SEO_DIR, { recursive: true });
  }

  const generated = [];

  // 1. Tool x Job Title pages  (4 tools x 10 jobs = 40 pages)
  for (const tool of TOOLS) {
    for (const job of JOB_TITLES) {
      const { filename, html } = buildToolForJobPage(tool, job);
      fs.writeFileSync(path.join(SEO_DIR, filename), html);
      generated.push(filename);
    }
  }

  // 2. Tool x Industry pages  (4 tools x 9 industries = 36 pages)
  for (const tool of TOOLS) {
    for (const industry of INDUSTRIES) {
      const { filename, html } = buildToolForIndustryPage(tool, industry);
      fs.writeFileSync(path.join(SEO_DIR, filename), html);
      generated.push(filename);
    }
  }

  // 3. How-to pages  (4 pages)
  for (const page of HOW_TO_PAGES) {
    const { filename, html } = buildHowToPage(page);
    fs.writeFileSync(path.join(SEO_DIR, filename), html);
    generated.push(filename);
  }

  // 4. Best-of pages  (4 pages)
  for (const page of BEST_OF_PAGES) {
    const { filename, html } = buildBestOfPage(page);
    fs.writeFileSync(path.join(SEO_DIR, filename), html);
    generated.push(filename);
  }

  // 5. Index page
  const { filename: indexFilename, html: indexHtml } = buildIndexPage();
  fs.writeFileSync(path.join(SEO_DIR, indexFilename), indexHtml);
  generated.push(indexFilename);

  console.log(`Generated ${generated.length} pSEO pages in seo/`);
  console.log(`  - ${TOOLS.length * JOB_TITLES.length} tool x job-title pages`);
  console.log(`  - ${TOOLS.length * INDUSTRIES.length} tool x industry pages`);
  console.log(`  - ${HOW_TO_PAGES.length} how-to guides`);
  console.log(`  - ${BEST_OF_PAGES.length} best-of roundup pages`);
  console.log(`  - 1 index page`);
}

main();
