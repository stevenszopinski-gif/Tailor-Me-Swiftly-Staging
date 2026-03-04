#!/usr/bin/env node
/**
 * Differentiate FAQ sections across SEO pages to reduce keyword cannibalization.
 *
 * Adds a 4th unique FAQ question per role, and varies the answer text for the
 * existing 3 questions based on role category (tech, healthcare, finance, creative, etc.)
 */
const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { join } = require('path');

const SEO_DIR = join(__dirname, '..', 'seo');

// ─── Role Categories ────────────────────────────────────────
const ROLE_CATEGORIES = {
  tech: ['software-engineer', 'backend-developer', 'frontend-developer', 'fullstack-developer', 'devops-engineer', 'cloud-engineer', 'data-engineer', 'data-scientist', 'machine-learning-engineer', 'android-developer', 'ios-developer', 'mobile-developer', 'blockchain-developer', 'cybersecurity-analyst', 'qa-engineer', 'site-reliability-engineer', 'solutions-architect', 'systems-administrator', 'technical-writer', 'web-developer', 'database-administrator', 'embedded-systems-engineer', 'game-developer', 'it-support-specialist', 'network-engineer'],
  finance: ['accountant', 'actuary', 'auditor', 'compliance-officer', 'financial-analyst', 'financial-planner', 'investment-banker', 'risk-analyst', 'tax-specialist', 'underwriter', 'account-executive'],
  healthcare: ['nurse', 'pharmacist', 'physical-therapist', 'physician-assistant', 'clinical-research-coordinator', 'dental-hygienist', 'dietitian', 'epidemiologist', 'health-informatics-specialist', 'medical-technologist', 'occupational-therapist', 'speech-language-pathologist', 'veterinarian'],
  creative: ['art-director', 'brand-strategist', 'content-strategist', 'copywriter', 'graphic-designer', 'ux-designer', 'ui-designer', 'ux-researcher', 'video-producer', 'social-media-manager', 'photographer', 'interior-designer'],
  business: ['business-analyst', 'management-consultant', 'product-manager', 'project-manager', 'program-manager', 'scrum-master', 'operations-manager', 'supply-chain-manager', 'procurement-specialist', 'real-estate-agent', 'event-planner', 'logistics-coordinator'],
  marketing: ['digital-marketer', 'seo-specialist', 'marketing-manager', 'email-marketer', 'growth-hacker', 'ppc-specialist', 'public-relations-specialist', 'market-research-analyst'],
  education: ['teacher', 'professor', 'instructional-designer', 'school-counselor', 'curriculum-developer', 'academic-advisor', 'librarian', 'tutor'],
  engineering: ['civil-engineer', 'chemical-engineer', 'electrical-engineer', 'mechanical-engineer', 'environmental-engineer', 'industrial-engineer', 'aerospace-engineer', 'biomedical-engineer', 'petroleum-engineer', 'structural-engineer'],
  legal: ['lawyer', 'paralegal', 'legal-analyst', 'patent-attorney', 'corporate-counsel'],
  hr: ['hr-manager', 'recruiter', 'talent-acquisition-specialist', 'training-specialist', 'compensation-analyst', 'hr-generalist'],
};

function getCategoryForRole(roleSlug) {
  for (const [cat, roles] of Object.entries(ROLE_CATEGORIES)) {
    if (roles.includes(roleSlug)) return cat;
  }
  return 'general';
}

// ─── Category-specific FAQ variations ───────────────────────
const FAQ_VARIATIONS = {
  tech: {
    q1_extra: 'The free tier includes GitHub and portfolio integration for showcasing technical projects alongside your application.',
    q2_extra: 'Our AI understands tech stacks, programming languages, and framework-specific keywords that generic tools miss — from React to Kubernetes to Terraform.',
    q3_extra: 'For developers, we also support importing directly from GitHub profiles and LinkedIn.',
    q4: { question: 'Can it handle technical jargon and stack-specific terminology?', answer: 'Yes. Our AI is trained on thousands of tech job descriptions and understands framework names, programming languages, cloud platforms, and methodology-specific terms. It knows the difference between React and Angular, AWS and GCP, and optimizes your application accordingly.' },
  },
  finance: {
    q1_extra: 'The free tier covers standard financial role applications including keyword optimization for regulatory and compliance terminology.',
    q2_extra: 'Our AI understands finance-specific terminology like GAAP, IFRS, SOX compliance, and regulatory frameworks that generic tools overlook.',
    q3_extra: 'Exports are formatted to meet the conservative, detail-oriented standards expected in financial services.',
    q4: { question: 'Does it understand financial certifications like CPA, CFA, or CMA?', answer: 'Absolutely. Our AI recognizes and strategically places certifications, regulatory knowledge, and compliance experience. It understands the hierarchy of financial credentials and positions them for maximum impact with hiring managers in banking, accounting, and financial services.' },
  },
  healthcare: {
    q1_extra: 'The free tier supports clinical role applications and includes HIPAA-aware content optimization.',
    q2_extra: 'Our AI understands clinical terminology, licensure requirements, and patient care metrics that generic tools cannot properly contextualize.',
    q3_extra: 'All outputs follow healthcare industry formatting standards and can include credential suffixes.',
    q4: { question: 'Does it handle clinical certifications and licensure?', answer: 'Yes. Our AI properly formats and positions clinical certifications (RN, BSN, NP, PA-C, etc.), understands EHR systems like Epic and Cerner, and optimizes for healthcare-specific ATS keywords including patient outcomes, clinical protocols, and evidence-based practice terminology.' },
  },
  creative: {
    q1_extra: 'The free tier includes portfolio link integration so you can showcase visual work alongside your application.',
    q2_extra: 'Our AI understands creative industry terminology, portfolio presentation, and the balance between showcasing creative vision and meeting hiring requirements.',
    q3_extra: 'We support rich formatting that preserves the visual quality creative professionals expect.',
    q4: { question: 'Can I include portfolio links and creative samples?', answer: 'Yes. Our AI intelligently weaves portfolio URLs, Behance/Dribbble profiles, and project case studies into your application. It knows that creative roles require showing, not just telling — and formats your experience to highlight visual thinking, brand development, and creative leadership.' },
  },
  business: {
    q1_extra: 'The free tier covers standard business role applications including cross-functional leadership and stakeholder management keywords.',
    q2_extra: 'Our AI understands business frameworks like Agile, Six Sigma, OKRs, and P&L management that generic tools treat as generic buzzwords.',
    q3_extra: 'Outputs are optimized for the structured, results-driven format that business hiring managers prefer.',
    q4: { question: 'How does it handle cross-functional experience?', answer: 'Our AI excels at positioning cross-functional leadership, stakeholder management, and strategic planning experience. It understands how to frame business impact using metrics like revenue growth, cost reduction, and process improvement — the language that resonates with business hiring managers.' },
  },
  marketing: {
    q1_extra: 'The free tier includes optimization for digital marketing metrics and campaign terminology.',
    q2_extra: 'Our AI understands marketing KPIs, attribution models, and platform-specific terminology from Google Ads to HubSpot to Salesforce.',
    q3_extra: 'We optimize for both traditional and digital marketing role formats.',
    q4: { question: 'Does it understand marketing metrics and platform terminology?', answer: 'Yes. Our AI knows the difference between CAC, LTV, ROAS, and MQL. It understands platform-specific terminology for Google Ads, Meta Business Suite, HubSpot, Marketo, and Salesforce — and positions your campaign results and growth metrics for maximum impact.' },
  },
  education: {
    q1_extra: 'The free tier supports K-12 and higher education role applications with curriculum-specific optimization.',
    q2_extra: 'Our AI understands pedagogical terminology, assessment frameworks, and educational technology that generic tools cannot contextualize.',
    q3_extra: 'Outputs follow the structured format preferred by school districts and academic institutions.',
    q4: { question: 'Does it work for both K-12 and higher education roles?', answer: 'Yes. Our AI understands the distinct requirements of K-12 teaching positions (state standards, IEPs, classroom management) versus higher education roles (research publications, grant funding, tenure track). It optimizes your application for the specific educational context you are targeting.' },
  },
  engineering: {
    q1_extra: 'The free tier covers engineering role applications with technical specification and project management keyword optimization.',
    q2_extra: 'Our AI understands engineering design standards, PE licensure, and CAD/simulation tools that generic platforms miss.',
    q3_extra: 'Outputs emphasize quantified project outcomes and technical specifications in the format engineering hiring managers expect.',
    q4: { question: 'Can it handle PE licensure and engineering certifications?', answer: 'Yes. Our AI recognizes Professional Engineer (PE) licensure, FE/EIT certifications, and industry-specific credentials. It understands CAD tools (AutoCAD, SolidWorks, CATIA), simulation software, and regulatory standards (ASME, IEEE, OSHA) to position your engineering expertise effectively.' },
  },
  legal: {
    q1_extra: 'The free tier supports legal role applications with jurisdiction-aware terminology and bar admission formatting.',
    q2_extra: 'Our AI understands legal writing conventions, bar admissions, practice area terminology, and billable hours metrics that generic tools miss.',
    q3_extra: 'Outputs follow the formal, precise style expected in legal hiring.',
    q4: { question: 'Does it understand bar admissions and practice areas?', answer: 'Yes. Our AI properly formats bar admissions, practice area specializations, and case outcome metrics. It understands the distinction between BigLaw, boutique firms, in-house counsel, and government legal roles — and tailors your application to each context.' },
  },
  hr: {
    q1_extra: 'The free tier covers HR role applications with people operations and talent management keyword optimization.',
    q2_extra: 'Our AI understands HRIS platforms, talent management frameworks, and employment law terminology that generic tools overlook.',
    q3_extra: 'Outputs are optimized for the people-centric, metrics-driven format that HR leadership expects.',
    q4: { question: 'Does it understand HR technology and people operations?', answer: 'Yes. Our AI knows HRIS platforms (Workday, BambooHR, ADP), ATS systems from the recruiter side, and people analytics terminology. It positions your experience in employee engagement, retention metrics, and organizational development — the language that resonates with HR leadership.' },
  },
  general: {
    q1_extra: 'The free tier covers 5 AI-powered generations per month for any role or industry.',
    q2_extra: 'Our AI analyzes thousands of successful applications in your field to understand what hiring managers prioritize.',
    q3_extra: 'All standard document formats are supported for seamless use with any application portal.',
    q4: { question: 'How quickly can I generate a tailored application?', answer: 'The entire process takes under 30 seconds. Upload your resume, paste the job description, and our AI analyzes both documents to generate a fully optimized, ATS-ready application tailored to the specific role and company.' },
  },
};

// ─── Tool type display names ────────────────────────────────
const TOOL_TYPES = {
  'cover-letter-generator': { name: 'cover letter', gen: 'cover letter generation' },
  'resume-tailoring': { name: 'resume tailoring', gen: 'resume tailoring generation' },
  'interview-prep': { name: 'interview prep', gen: 'interview prep' },
  'salary-negotiation': { name: 'salary negotiation', gen: 'salary negotiation' },
};

// ─── Process files ──────────────────────────────────────────
function processFile(filePath, fileName) {
  // Parse filename to extract tool type and role
  let toolType = null;
  let roleSlug = null;

  for (const [prefix, info] of Object.entries(TOOL_TYPES)) {
    if (fileName.startsWith(prefix + '-for-')) {
      toolType = prefix;
      roleSlug = fileName.replace(prefix + '-for-', '').replace('.html', '');
      break;
    }
  }

  if (!toolType || !roleSlug) return false; // Skip non-role pages

  const category = getCategoryForRole(roleSlug);
  const variation = FAQ_VARIATIONS[category] || FAQ_VARIATIONS.general;
  const toolInfo = TOOL_TYPES[toolType];
  const roleName = roleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  let html = readFileSync(filePath, 'utf-8');

  // ── Update HTML FAQ section ──
  // Build the new FAQ section
  const newFaqHtml = `      <h2>Frequently Asked Questions</h2>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>Is this tool free for ${roleName}s?</h3>
        <p>TailorMeSwiftly offers a free tier that includes basic ${toolInfo.gen}. ${variation.q1_extra} Premium features like advanced ATS scoring and unlimited exports are available with a subscription. <a href="/pricing.html" style="color: var(--primary-color);">See pricing details.</a></p>
      </div>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>How is this different from a generic ${toolInfo.name} tool?</h3>
        <p>Generic tools apply one-size-fits-all optimization. TailorMeSwiftly understands that ${roleName} roles have specific keyword patterns, industry jargon, and formatting expectations that differ from other professions. ${variation.q2_extra}</p>
      </div>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>What file formats are supported?</h3>
        <p>You can upload your resume as PDF, DOCX, or plain text. Generated outputs can be exported as PDF, DOCX, or copied as formatted text for pasting into application portals. ${variation.q3_extra}</p>
      </div>
      <div class="seo-feature">
        <h3>${variation.q4.question}</h3>
        <p>${variation.q4.answer}</p>
      </div>`;

  // Replace the old FAQ HTML block
  // Match: <h2>Frequently Asked Questions</h2> ... all seo-feature divs ... up to </section>
  const faqRegex = /<h2>Frequently Asked Questions<\/h2>[\s\S]*?(?=<\/section>)/;

  if (faqRegex.test(html)) {
    html = html.replace(faqRegex, newFaqHtml + '\n    ');
  }

  // ── Update JSON-LD FAQ schema ──
  const newFaqSchema = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is this tool free for ${roleName}s?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TailorMeSwiftly offers a free tier that includes basic ${toolInfo.gen}. ${variation.q1_extra} Premium features like advanced ATS scoring and unlimited exports are available with a subscription. See pricing details."
      }
    },
    {
      "@type": "Question",
      "name": "How is this different from a generic ${toolInfo.name} tool?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Generic tools apply one-size-fits-all optimization. TailorMeSwiftly understands that ${roleName} roles have specific keyword patterns, industry jargon, and formatting expectations that differ from other professions. ${variation.q2_extra}"
      }
    },
    {
      "@type": "Question",
      "name": "What file formats are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can upload your resume as PDF, DOCX, or plain text. Generated outputs can be exported as PDF, DOCX, or copied as formatted text for pasting into application portals. ${variation.q3_extra}"
      }
    },
    {
      "@type": "Question",
      "name": "${variation.q4.question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${variation.q4.answer}"
      }
    }
  ]
}`;

  // Replace old FAQ schema
  const schemaRegex = /\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"FAQPage",\s*"mainEntity":\s*\[[\s\S]*?\]\s*\}/;
  if (schemaRegex.test(html)) {
    html = html.replace(schemaRegex, newFaqSchema);
  }

  writeFileSync(filePath, html);
  return true;
}

// ─── Main ───────────────────────────────────────────────────
const files = readdirSync(SEO_DIR).filter(f => f.endsWith('.html'));
let updated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = join(SEO_DIR, file);
  if (processFile(filePath, file)) {
    updated++;
  } else {
    skipped++;
  }
}

console.log(`Done! Updated ${updated} files, skipped ${skipped} non-role files.`);
