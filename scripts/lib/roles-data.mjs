/**
 * Role definitions for SEO content generation.
 * 80 new roles across 8 categories × 4 actions = 320 pages.
 */

export const ROLE_CATEGORIES = [
  {
    id: 'accounting-finance',
    name: 'Accounting & Finance',
    icon: 'fa-calculator',
    roles: [
      { slug: 'accountant', name: 'Accountant', plural: 'Accountants' },
      { slug: 'auditor', name: 'Auditor', plural: 'Auditors' },
      { slug: 'tax-analyst', name: 'Tax Analyst', plural: 'Tax Analysts' },
      { slug: 'financial-planner', name: 'Financial Planner', plural: 'Financial Planners' },
      { slug: 'controller', name: 'Controller', plural: 'Controllers' },
      { slug: 'actuary', name: 'Actuary', plural: 'Actuaries' },
      { slug: 'investment-banker', name: 'Investment Banker', plural: 'Investment Bankers' },
      { slug: 'credit-analyst', name: 'Credit Analyst', plural: 'Credit Analysts' },
    ],
  },
  {
    id: 'tech',
    name: 'Technology',
    icon: 'fa-laptop-code',
    roles: [
      { slug: 'devops-engineer', name: 'DevOps Engineer', plural: 'DevOps Engineers' },
      { slug: 'cloud-engineer', name: 'Cloud Engineer', plural: 'Cloud Engineers' },
      { slug: 'cybersecurity-analyst', name: 'Cybersecurity Analyst', plural: 'Cybersecurity Analysts' },
      { slug: 'machine-learning-engineer', name: 'Machine Learning Engineer', plural: 'Machine Learning Engineers' },
      { slug: 'backend-developer', name: 'Backend Developer', plural: 'Backend Developers' },
      { slug: 'frontend-developer', name: 'Frontend Developer', plural: 'Frontend Developers' },
      { slug: 'ios-developer', name: 'iOS Developer', plural: 'iOS Developers' },
      { slug: 'android-developer', name: 'Android Developer', plural: 'Android Developers' },
      { slug: 'qa-engineer', name: 'QA Engineer', plural: 'QA Engineers' },
      { slug: 'systems-administrator', name: 'Systems Administrator', plural: 'Systems Administrators' },
      { slug: 'database-administrator', name: 'Database Administrator', plural: 'Database Administrators' },
      { slug: 'site-reliability-engineer', name: 'Site Reliability Engineer', plural: 'Site Reliability Engineers' },
      { slug: 'technical-writer', name: 'Technical Writer', plural: 'Technical Writers' },
      { slug: 'scrum-master', name: 'Scrum Master', plural: 'Scrum Masters' },
      { slug: 'solutions-architect', name: 'Solutions Architect', plural: 'Solutions Architects' },
      { slug: 'it-support-specialist', name: 'IT Support Specialist', plural: 'IT Support Specialists' },
      { slug: 'network-engineer', name: 'Network Engineer', plural: 'Network Engineers' },
      { slug: 'blockchain-developer', name: 'Blockchain Developer', plural: 'Blockchain Developers' },
      { slug: 'game-developer', name: 'Game Developer', plural: 'Game Developers' },
      { slug: 'embedded-systems-engineer', name: 'Embedded Systems Engineer', plural: 'Embedded Systems Engineers' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'fa-heart-pulse',
    roles: [
      { slug: 'physician-assistant', name: 'Physician Assistant', plural: 'Physician Assistants' },
      { slug: 'pharmacist', name: 'Pharmacist', plural: 'Pharmacists' },
      { slug: 'medical-lab-technician', name: 'Medical Lab Technician', plural: 'Medical Lab Technicians' },
      { slug: 'physical-therapist', name: 'Physical Therapist', plural: 'Physical Therapists' },
      { slug: 'occupational-therapist', name: 'Occupational Therapist', plural: 'Occupational Therapists' },
      { slug: 'dental-hygienist', name: 'Dental Hygienist', plural: 'Dental Hygienists' },
      { slug: 'radiologic-technologist', name: 'Radiologic Technologist', plural: 'Radiologic Technologists' },
      { slug: 'health-information-technician', name: 'Health Information Technician', plural: 'Health Information Technicians' },
      { slug: 'clinical-research-coordinator', name: 'Clinical Research Coordinator', plural: 'Clinical Research Coordinators' },
      { slug: 'speech-language-pathologist', name: 'Speech-Language Pathologist', plural: 'Speech-Language Pathologists' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'fa-briefcase',
    roles: [
      { slug: 'business-analyst', name: 'Business Analyst', plural: 'Business Analysts' },
      { slug: 'operations-manager', name: 'Operations Manager', plural: 'Operations Managers' },
      { slug: 'supply-chain-manager', name: 'Supply Chain Manager', plural: 'Supply Chain Managers' },
      { slug: 'human-resources-manager', name: 'Human Resources Manager', plural: 'Human Resources Managers' },
      { slug: 'recruiter', name: 'Recruiter', plural: 'Recruiters' },
      { slug: 'account-executive', name: 'Account Executive', plural: 'Account Executives' },
      { slug: 'customer-success-manager', name: 'Customer Success Manager', plural: 'Customer Success Managers' },
      { slug: 'event-planner', name: 'Event Planner', plural: 'Event Planners' },
      { slug: 'management-consultant', name: 'Management Consultant', plural: 'Management Consultants' },
      { slug: 'real-estate-agent', name: 'Real Estate Agent', plural: 'Real Estate Agents' },
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: 'fa-palette',
    roles: [
      { slug: 'graphic-designer', name: 'Graphic Designer', plural: 'Graphic Designers' },
      { slug: 'content-writer', name: 'Content Writer', plural: 'Content Writers' },
      { slug: 'social-media-manager', name: 'Social Media Manager', plural: 'Social Media Managers' },
      { slug: 'video-editor', name: 'Video Editor', plural: 'Video Editors' },
      { slug: 'photographer', name: 'Photographer', plural: 'Photographers' },
      { slug: 'interior-designer', name: 'Interior Designer', plural: 'Interior Designers' },
      { slug: 'fashion-designer', name: 'Fashion Designer', plural: 'Fashion Designers' },
      { slug: 'copywriter', name: 'Copywriter', plural: 'Copywriters' },
      { slug: 'art-director', name: 'Art Director', plural: 'Art Directors' },
      { slug: 'brand-strategist', name: 'Brand Strategist', plural: 'Brand Strategists' },
    ],
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: 'fa-scale-balanced',
    roles: [
      { slug: 'paralegal', name: 'Paralegal', plural: 'Paralegals' },
      { slug: 'legal-secretary', name: 'Legal Secretary', plural: 'Legal Secretaries' },
      { slug: 'compliance-officer', name: 'Compliance Officer', plural: 'Compliance Officers' },
      { slug: 'contract-manager', name: 'Contract Manager', plural: 'Contract Managers' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'fa-graduation-cap',
    roles: [
      { slug: 'school-counselor', name: 'School Counselor', plural: 'School Counselors' },
      { slug: 'librarian', name: 'Librarian', plural: 'Librarians' },
      { slug: 'instructional-designer', name: 'Instructional Designer', plural: 'Instructional Designers' },
      { slug: 'esl-teacher', name: 'ESL Teacher', plural: 'ESL Teachers' },
      { slug: 'special-education-teacher', name: 'Special Education Teacher', plural: 'Special Education Teachers' },
    ],
  },
  {
    id: 'trades-engineering',
    name: 'Trades & Engineering',
    icon: 'fa-wrench',
    roles: [
      { slug: 'electrician', name: 'Electrician', plural: 'Electricians' },
      { slug: 'plumber', name: 'Plumber', plural: 'Plumbers' },
      { slug: 'hvac-technician', name: 'HVAC Technician', plural: 'HVAC Technicians' },
      { slug: 'civil-engineer', name: 'Civil Engineer', plural: 'Civil Engineers' },
      { slug: 'mechanical-engineer', name: 'Mechanical Engineer', plural: 'Mechanical Engineers' },
      { slug: 'chemical-engineer', name: 'Chemical Engineer', plural: 'Chemical Engineers' },
      { slug: 'environmental-scientist', name: 'Environmental Scientist', plural: 'Environmental Scientists' },
      { slug: 'urban-planner', name: 'Urban Planner', plural: 'Urban Planners' },
      { slug: 'logistics-coordinator', name: 'Logistics Coordinator', plural: 'Logistics Coordinators' },
      { slug: 'executive-assistant', name: 'Executive Assistant', plural: 'Executive Assistants' },
    ],
  },
];

// Flatten for easy iteration
export const ALL_NEW_ROLES = ROLE_CATEGORIES.flatMap(cat =>
  cat.roles.map(role => ({ ...role, category: cat.id, categoryName: cat.name }))
);

// Existing roles from generate-seo-pages.js — skip these
export const EXISTING_ROLE_SLUGS = new Set([
  'software-engineer', 'product-manager', 'data-scientist', 'ux-designer',
  'marketing-manager', 'project-manager', 'financial-analyst', 'nurse',
  'teacher', 'sales-representative',
]);

// The 4 action types (matching existing TOOLS array)
export const ACTIONS = [
  { slug: 'resume-tailoring', name: 'Resume Tailoring', shortName: 'Resume Tailoring',
    category: 'resume', ctaPage: '/app.html', ctaLabel: 'Tailor Your Resume Now', icon: 'fa-file-lines' },
  { slug: 'cover-letter-generator', name: 'Cover Letter Generator', shortName: 'Cover Letter',
    category: 'cover-letter', ctaPage: '/app.html', ctaLabel: 'Generate Your Cover Letter', icon: 'fa-envelope-open-text' },
  { slug: 'interview-prep', name: 'Interview Prep', shortName: 'Interview Prep',
    category: 'interview-prep', ctaPage: '/interview-prep.html', ctaLabel: 'Start Interview Prep', icon: 'fa-microphone' },
  { slug: 'salary-negotiation', name: 'Salary Negotiation', shortName: 'Salary Negotiation',
    category: 'salary-negotiation', ctaPage: '/salary-negotiator.html', ctaLabel: 'Practice Salary Negotiation', icon: 'fa-coins' },
];

// Blog topics
export const BLOG_TOPICS = [
  { slug: 'top-skills-tech-2026', title: 'Top Skills Employers Want for Tech Roles in 2026', tag: 'Skills Trends', readTime: '7 min', desc: 'The most in-demand technical skills for 2026 and how to showcase them on your resume.' },
  { slug: 'ai-resume-future', title: 'How AI Is Changing Resume Screening Forever', tag: 'ATS Strategy', readTime: '6 min', desc: 'AI-powered ATS systems are getting smarter. Here is how to stay ahead.' },
  { slug: 'remote-work-resume-tips', title: 'Remote Work Resume Tips That Actually Get Callbacks', tag: 'Resume Tips', readTime: '5 min', desc: 'Proven strategies to make your remote work experience stand out to hiring managers.' },
  { slug: 'career-change-2026', title: 'Career Change in 2026: The Complete Pivot Playbook', tag: 'Career Strategy', readTime: '8 min', desc: 'A step-by-step guide to switching careers, from skill mapping to your first interview.' },
  { slug: 'healthcare-hiring-trends', title: 'Healthcare Hiring Trends: What Recruiters Look for in 2026', tag: 'Industry Insights', readTime: '6 min', desc: 'Inside the healthcare hiring pipeline and what makes candidates stand out.' },
  { slug: 'cybersecurity-career-guide', title: 'Breaking Into Cybersecurity: Skills, Certs, and Resume Strategies', tag: 'Career Guide', readTime: '7 min', desc: 'Everything you need to break into one of the fastest-growing fields.' },
  { slug: 'soft-skills-resume', title: 'How to Showcase Soft Skills on Your Resume Without Sounding Generic', tag: 'Resume Tips', readTime: '5 min', desc: 'Turn vague soft skills into concrete, measurable achievements.' },
  { slug: 'salary-transparency-2026', title: 'Salary Transparency Laws in 2026: What Job Seekers Need to Know', tag: 'Negotiation', readTime: '6 min', desc: 'New laws are changing how companies share salary data. Use them to your advantage.' },
  { slug: 'freelance-to-fulltime', title: 'From Freelance to Full-Time: Translating Contract Work on Your Resume', tag: 'Resume Tips', readTime: '5 min', desc: 'How to present freelance and contract experience so employers see stability, not risk.' },
  { slug: 'data-skills-demand', title: 'The 10 Data Skills in Highest Demand for 2026', tag: 'Skills Trends', readTime: '7 min', desc: 'From SQL to dbt to prompt engineering, the data skills hiring managers want right now.' },
];
