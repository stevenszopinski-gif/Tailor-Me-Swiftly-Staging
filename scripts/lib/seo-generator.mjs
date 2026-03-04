/**
 * SEO page generator — creates role-specific landing pages using AI-generated content.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ALL_NEW_ROLES, ACTIONS, EXISTING_ROLE_SLUGS, ROLE_CATEGORIES } from './roles-data.mjs';
import { htmlHead, jsonLd, pageStyles, siteHeader, siteFooter, internalLinks, escapeHtml, YEAR } from './templates.mjs';

const SYSTEM_PROMPT = `You are a career content expert writing for TailorMeSwiftly.com, an AI-powered resume and career tool.
Write a single paragraph (3-5 sentences, 80-120 words) explaining why professionals in a specific role need specialized help with a specific career action.
The paragraph must:
- Be unique and specific to this exact role (mention real tools, skills, certifications, and ATS keywords specific to this profession)
- Reference TailorMeSwiftly naturally (what it does for this role)
- Not repeat phrases used for other roles
- Be written in a confident, authoritative, second-person voice
- Not use bullet points or formatting — just flowing prose
Return ONLY the paragraph text with no preamble or wrapping.`;

export async function generateSeoPages(client, root, { singleRole, dryRun } = {}) {
  const seoDir = join(root, 'seo');
  if (!existsSync(seoDir)) mkdirSync(seoDir, { recursive: true });

  let roles = ALL_NEW_ROLES.filter(r => !EXISTING_ROLE_SLUGS.has(r.slug));
  if (singleRole) {
    roles = roles.filter(r => r.slug === singleRole);
    if (roles.length === 0) {
      console.log(`Role "${singleRole}" not found in new roles.`);
      return [];
    }
  }

  const generated = [];
  const total = roles.length * ACTIONS.length;
  let count = 0;

  console.log(`\nGenerating ${total} SEO pages for ${roles.length} roles...`);

  for (const role of roles) {
    for (const action of ACTIONS) {
      count++;
      const slug = `${action.slug}-for-${role.slug}`;
      const filename = `${slug}.html`;
      const cacheKey = `seo-${slug}`;

      if (dryRun) {
        console.log(`  [dry-run] ${filename}`);
        generated.push(filename);
        continue;
      }

      // Generate unique content paragraph
      const userPrompt = `Write the "Why ${role.plural} Need Specialized ${action.name}" paragraph for a ${role.name} role.
Category: ${role.categoryName}
Action type: ${action.name} (${action.category})
The paragraph should mention specific skills, tools, certifications, and keywords that ${role.name} professionals use and that ATS systems scan for in this field.`;

      const content = await client.generate(cacheKey, SYSTEM_PROMPT, userPrompt);

      // Build the page
      const title = `${action.name} for ${role.plural}`;
      const metaDesc = `${action.name} built specifically for ${role.plural}. AI-powered tools to tailor your application, pass ATS systems, and land ${role.name} roles faster.`;
      const canonicalPath = `seo/${filename}`;

      const relatedSlugs = [
        ...ACTIONS.filter(a => a.slug !== action.slug).map(a => `${a.slug}-for-${role.slug}`),
        `best-${action.category}-tools-${YEAR}`,
      ];

      const features = [
        { icon: 'fa-bullseye', title: `${role.name}-Specific Optimization`, desc: `Tailored for the keywords, skills, and terminology that ${role.name} hiring managers and ATS systems look for.` },
        { icon: 'fa-robot', title: 'AI-Powered Analysis', desc: `Our AI reads the job description and restructures your application to maximize relevance for ${role.name} positions.` },
        { icon: 'fa-clock', title: 'Ready in Seconds', desc: `Generate a customized, ATS-optimized ${action.shortName.toLowerCase()} in under 30 seconds. Edit, export, and apply.` },
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
      <h1><span class="seo-gradient">${escapeHtml(action.name)}</span> for ${escapeHtml(role.plural)}</h1>
      <p class="seo-hero-sub">AI-powered ${action.shortName.toLowerCase()} built for ${role.plural}. Optimize your application for the exact keywords, skills, and formatting that ${role.name} hiring managers expect.</p>
      <a href="${action.ctaPage}" class="seo-cta"><i class="fa-solid ${action.icon}"></i> ${action.ctaLabel}</a>
    </section>

    <section class="seo-section">
      <h2>Why ${escapeHtml(role.plural)} Need Specialized ${escapeHtml(action.name)}</h2>
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
      <p>1. Upload your current resume or paste your experience details. 2. Paste the ${role.name} job description you are targeting. 3. TailorMeSwiftly's AI analyzes both documents, identifies keyword gaps, and generates a tailored ${action.shortName.toLowerCase()} optimized for that specific role. The entire process takes under 30 seconds.</p>
    </section>

    <section class="seo-section">
      <h2>Frequently Asked Questions</h2>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>Is this tool free for ${escapeHtml(role.plural)}?</h3>
        <p>TailorMeSwiftly offers a free tier that includes basic ${action.shortName.toLowerCase()} generation. Premium features like advanced ATS scoring and unlimited exports are available with a subscription. <a href="/pricing.html" style="color: var(--primary-color);">See pricing details.</a></p>
      </div>
      <div class="seo-feature" style="margin-bottom: 1rem;">
        <h3>How is this different from a generic ${action.shortName.toLowerCase()} tool?</h3>
        <p>Generic tools apply one-size-fits-all optimization. TailorMeSwiftly understands that ${role.name} roles have specific keyword patterns, industry jargon, and formatting expectations that differ from other professions. Our AI is trained to recognize and optimize for these differences.</p>
      </div>
      <div class="seo-feature">
        <h3>What file formats are supported?</h3>
        <p>You can upload your resume as PDF, DOCX, or plain text. Generated outputs can be exported as PDF, DOCX, or copied as formatted text for pasting into application portals.</p>
      </div>
    </section>

    <section style="text-align: center; margin: 2.5rem 0;">
      <a href="${action.ctaPage}" class="seo-cta"><i class="fa-solid ${action.icon}"></i> ${action.ctaLabel}</a>
    </section>

${internalLinks(slug, relatedSlugs)}
  </main>

${siteFooter()}
</body>
</html>`;

      writeFileSync(join(seoDir, filename), html);
      generated.push(filename);

      if (count % 50 === 0) {
        console.log(`\n  ${count}/${total} pages generated...`);
      }
    }
  }

  console.log(`\n  Done: ${generated.length} SEO pages generated.`);
  return generated;
}
