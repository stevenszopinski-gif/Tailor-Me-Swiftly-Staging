/**
 * Regenerates seo/index.html with all roles organized by category.
 */
import { writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ROLE_CATEGORIES, ACTIONS } from './roles-data.mjs';
import { htmlHead, jsonLd, pageStyles, siteHeader, siteFooter, escapeHtml, YEAR } from './templates.mjs';

export function updateSeoIndex(root) {
  const seoDir = join(root, 'seo');
  const existingFiles = new Set(readdirSync(seoDir).filter(f => f.endsWith('.html')));

  // Collect all role pages that exist
  const allRoleLinks = [];
  for (const cat of ROLE_CATEGORIES) {
    const catLinks = [];
    for (const role of cat.roles) {
      for (const action of ACTIONS) {
        const filename = `${action.slug}-for-${role.slug}.html`;
        if (existingFiles.has(filename)) {
          catLinks.push({
            href: `/seo/${filename}`,
            label: `${action.name} for ${role.plural}`,
            role: role.name,
            action: action.name,
          });
        }
      }
    }
    if (catLinks.length > 0) {
      allRoleLinks.push({ category: cat, links: catLinks });
    }
  }

  // Also collect original roles (from the existing generator)
  const originalRoleSlugs = [
    'software-engineer', 'product-manager', 'data-scientist', 'ux-designer',
    'marketing-manager', 'project-manager', 'financial-analyst', 'nurse',
    'teacher', 'sales-representative',
  ];
  const originalRoles = originalRoleSlugs.map(slug => {
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { slug, name };
  });
  const originalLinks = [];
  for (const role of originalRoles) {
    for (const action of ACTIONS) {
      const filename = `${action.slug}-for-${role.slug}.html`;
      if (existingFiles.has(filename)) {
        originalLinks.push({
          href: `/seo/${filename}`,
          label: `${action.name} for ${role.name}`,
        });
      }
    }
  }

  // Collect how-to and best-of pages
  const howToFiles = [...existingFiles].filter(f => f.startsWith('how-to-'));
  const bestOfFiles = [...existingFiles].filter(f => f.startsWith('best-'));
  // Industry pages
  const industryFiles = [...existingFiles].filter(f => {
    return !f.startsWith('how-to-') && !f.startsWith('best-') && f !== 'index.html' &&
      !ROLE_CATEGORIES.some(cat => cat.roles.some(r => f.includes(r.slug))) &&
      !originalRoleSlugs.some(s => f.includes(s));
  });

  const title = 'SEO Resources & Career Guides';
  const metaDesc = 'Comprehensive career resources: resume tailoring, cover letter generators, interview prep, and salary negotiation guides for every job title and industry.';

  const html = `${htmlHead({ title, metaDesc, canonicalPath: 'seo/index.html', ogTitle: title })}
${pageStyles()}
${jsonLd({ title, description: metaDesc, canonicalPath: 'seo/index.html' })}
</head>

<body>
${siteHeader()}

  <main class="seo-page">
    <section class="seo-hero">
      <h1><span class="seo-gradient">Career Resources</span> & Guides</h1>
      <p class="seo-hero-sub">Browse role-specific tools for resume tailoring, cover letters, interview prep, and salary negotiation.</p>
    </section>

${howToFiles.length > 0 ? `    <section class="seo-section">
      <h2><i class="fa-solid fa-book-open" style="color:var(--primary-color);margin-right:0.4rem;"></i> How-To Guides</h2>
      <div class="seo-links-grid">
${howToFiles.map(f => `        <a href="/seo/${f}">${f.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a>`).join('\n')}
      </div>
    </section>` : ''}

${bestOfFiles.length > 0 ? `    <section class="seo-section">
      <h2><i class="fa-solid fa-trophy" style="color:var(--primary-color);margin-right:0.4rem;"></i> Best Tools ${YEAR}</h2>
      <div class="seo-links-grid">
${bestOfFiles.map(f => `        <a href="/seo/${f}">${f.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a>`).join('\n')}
      </div>
    </section>` : ''}

${originalLinks.length > 0 ? `    <section class="seo-section">
      <h2><i class="fa-solid fa-star" style="color:var(--primary-color);margin-right:0.4rem;"></i> Popular Roles</h2>
      <div class="seo-links-grid">
${originalLinks.map(l => `        <a href="${l.href}">${l.label}</a>`).join('\n')}
      </div>
    </section>` : ''}

${allRoleLinks.map(({ category, links }) => `    <section class="seo-section">
      <h2><i class="fa-solid ${category.icon}" style="color:var(--primary-color);margin-right:0.4rem;"></i> ${escapeHtml(category.name)}</h2>
      <div class="seo-links-grid">
${links.map(l => `        <a href="${l.href}">${l.label}</a>`).join('\n')}
      </div>
    </section>`).join('\n\n')}

  </main>

${siteFooter()}
</body>
</html>`;

  writeFileSync(join(seoDir, 'index.html'), html);
  console.log('  Updated seo/index.html');
}
