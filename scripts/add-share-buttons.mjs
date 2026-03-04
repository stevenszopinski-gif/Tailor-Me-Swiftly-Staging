#!/usr/bin/env node
/**
 * Injects social share buttons into all SEO pages, blog articles, and key site pages.
 * Idempotent — skips files that already have share buttons.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

const SHARE_BAR_HTML = `    <div class="share-bar">
      <span>Share:</span>
      <a class="share-btn" title="Share on LinkedIn" aria-label="Share on LinkedIn" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(location.href),'_blank','width=600,height=400');return false;" href="#"><i class="fa-brands fa-linkedin-in"></i></a>
      <a class="share-btn" title="Share on Facebook" aria-label="Share on Facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href),'_blank','width=600,height=400');return false;" href="#"><i class="fa-brands fa-facebook-f"></i></a>
      <a class="share-btn" title="Share on X" aria-label="Share on X" onclick="window.open('https://x.com/intent/tweet?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(document.title),'_blank','width=600,height=400');return false;" href="#"><i class="fa-brands fa-x-twitter"></i></a>
      <button class="share-btn" title="Copy link" aria-label="Copy link" onclick="navigator.clipboard.writeText(location.href);this.classList.add('copied');this.innerHTML='<i class=&apos;fa-solid fa-check&apos;></i>';setTimeout(()=>{this.classList.remove('copied');this.innerHTML='<i class=&apos;fa-solid fa-link&apos;></i>';},2000)"><i class="fa-solid fa-link"></i></button>
    </div>`;

let updated = 0;
let skipped = 0;

function inject(filePath, anchorPattern, position = 'before') {
  let html = readFileSync(filePath, 'utf-8');
  if (html.includes('share-bar')) {
    skipped++;
    return;
  }

  const idx = html.indexOf(anchorPattern);
  if (idx === -1) return;

  if (position === 'before') {
    html = html.slice(0, idx) + SHARE_BAR_HTML + '\n' + html.slice(idx);
  } else {
    const end = idx + anchorPattern.length;
    html = html.slice(0, end) + '\n' + SHARE_BAR_HTML + html.slice(end);
  }

  writeFileSync(filePath, html);
  updated++;
}

// --- SEO pages: insert before the "Explore More" links section ---
const seoDir = join(ROOT, 'seo');
const seoFiles = readdirSync(seoDir).filter(f => f.endsWith('.html') && f !== 'index.html');
for (const f of seoFiles) {
  inject(join(seoDir, f), '<div class="seo-links">', 'before');
}

// --- Blog articles: insert before "Back to Blog" link ---
const blogDir = join(ROOT, 'blog');
const blogFiles = readdirSync(blogDir).filter(f => f.endsWith('.html'));
for (const f of blogFiles) {
  // Try inserting after the blog CTA div
  const filePath = join(blogDir, f);
  const html = readFileSync(filePath, 'utf-8');
  if (html.includes('share-bar')) {
    skipped++;
    continue;
  }

  // Insert before "Back to Blog" link
  const anchor = '<p style="margin-top: 2rem;"><a href="/blog.html"';
  if (html.includes(anchor)) {
    inject(filePath, anchor, 'before');
  } else {
    // Fallback: insert before </main>
    inject(filePath, '</main>', 'before');
  }
}

// --- Main pages: index, app, pricing, etc ---
const mainPages = [
  'index.html', 'app.html', 'pricing.html', 'blog.html',
  'interview-prep.html', 'salary-negotiator.html', 'help.html',
];
for (const page of mainPages) {
  const filePath = join(ROOT, page);
  try {
    readFileSync(filePath, 'utf-8'); // check exists
    inject(filePath, '</main>', 'before');
  } catch { /* file doesn't exist, skip */ }
}

console.log(`Done: ${updated} files updated, ${skipped} already had share buttons.`);
