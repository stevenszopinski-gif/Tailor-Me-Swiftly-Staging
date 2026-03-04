#!/usr/bin/env node
/**
 * Auto-generates sitemap.xml from all public HTML pages.
 * Run during CI/CD deploy or manually: node scripts/generate-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://tailormeswiftly.com';
const ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().split('T')[0];

// Pages that should NOT appear in the sitemap
const EXCLUDE = new Set([
  'app.html',
  'dashboard.html',
  'history.html',
  'account.html',
  'results.html',
  'resume.html',
  'system_dashboard.html',
  '404.html',
  'news/briefing.test.html',
  // Redirect stubs (backward compat only)
  'learning.html',
  'cold-email.html',
  'news-detail.html',
]);

// Priority overrides (default is 0.6)
const PRIORITY = {
  'index.html': 1.0,
  'pricing.html': 0.8,
  'login.html': 0.7,
  'signup.html': 0.7,
  'blog.html': 0.7,
  'seo/index.html': 0.6,
  'help.html': 0.6,
  'updates.html': 0.5,
  'privacy.html': 0.3,
  'terms.html': 0.3,
  'security.html': 0.3,
};

// Priority for pSEO pages by prefix pattern (default 0.5)
function getPriority(page) {
  if (PRIORITY[page] !== undefined) return PRIORITY[page];
  if (page.startsWith('seo/')) return 0.5;
  return 0.6;
}

// Change frequency overrides (default is 'monthly')
const CHANGEFREQ = {
  'index.html': 'weekly',
  'blog.html': 'weekly',
  'updates.html': 'weekly',
  'pricing.html': 'monthly',
  'privacy.html': 'yearly',
  'terms.html': 'yearly',
  'security.html': 'yearly',
};

function findHtmlFiles(dir, base = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    // Skip directories we never want in the sitemap
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.github', '.claude', 'supabase', 'react-upgrade',
           'tests', 'test-results', 'deploy', 'shared', 'extension', 'scripts'].includes(entry.name)) {
        continue;
      }
      results.push(...findHtmlFiles(path.join(dir, entry.name), relPath));
    } else if (entry.name.endsWith('.html') && !EXCLUDE.has(relPath)) {
      results.push(relPath);
    }
  }
  return results;
}

const pages = findHtmlFiles(ROOT);

// Sort: index.html first, then alphabetically
pages.sort((a, b) => {
  if (a === 'index.html') return -1;
  if (b === 'index.html') return 1;
  return a.localeCompare(b);
});

const urls = pages.map(page => {
  const loc = page === 'index.html' ? DOMAIN + '/' : `${DOMAIN}/${page}`;
  const priority = getPriority(page);
  const changefreq = CHANGEFREQ[page] || (page.startsWith('seo/') ? 'monthly' : 'monthly');

  return `    <url>
        <loc>${loc}</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const outPath = path.join(ROOT, 'sitemap.xml');
fs.writeFileSync(outPath, sitemap);
console.log(`Generated sitemap.xml with ${pages.length} URLs`);
