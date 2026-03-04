#!/usr/bin/env node
/**
 * Adds FAQPage schema markup to SEO pages.
 * Extracts existing FAQ sections from the HTML and wraps them in JSON-LD.
 * This gives Google rich snippets (expandable Q&A in search results = more clicks).
 * Idempotent — skips pages that already have FAQPage schema.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const seoDir = join(ROOT, 'seo');

function escJson(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

let updated = 0;
let skipped = 0;

const files = readdirSync(seoDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = join(seoDir, file);
  let html = readFileSync(filePath, 'utf-8');

  if (html.includes('FAQPage')) {
    skipped++;
    continue;
  }

  // Extract FAQ Q&A pairs from existing HTML structure
  const faqRegex = /<div class="seo-feature"[^>]*>\s*<h3>([^<]+)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g;
  const faqs = [];
  let match;
  while ((match = faqRegex.exec(html)) !== null) {
    const question = match[1].trim();
    const answer = match[2].replace(/<[^>]+>/g, '').trim(); // strip inner HTML tags
    // Only include entries that look like FAQ questions
    if (question.includes('?') || question.toLowerCase().startsWith('how') || question.toLowerCase().startsWith('what') || question.toLowerCase().startsWith('is ') || question.toLowerCase().startsWith('can ')) {
      faqs.push({ question, answer });
    }
  }

  if (faqs.length === 0) continue;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  const scriptTag = `  <script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n  </script>`;

  // Insert before </head>
  html = html.replace('</head>', `${scriptTag}\n</head>`);
  writeFileSync(filePath, html);
  updated++;
}

console.log(`Done: ${updated} pages got FAQ schema, ${skipped} already had it.`);
