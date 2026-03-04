#!/usr/bin/env node
/**
 * Generates blog/feed.xml RSS feed from blog HTML files.
 * Also adds <link rel="alternate" type="application/rss+xml"> to blog.html and index.html if missing.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const DOMAIN = 'https://tailormeswiftly.com';
const blogDir = join(ROOT, 'blog');

function extractMeta(html) {
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1]?.replace(/ \| TailorMeSwiftly.*$/, '') || '';
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  return { title, desc };
}

const blogFiles = readdirSync(blogDir).filter(f => f.endsWith('.html')).sort((a, b) => {
  return statSync(join(blogDir, b)).mtime - statSync(join(blogDir, a)).mtime;
});

const items = blogFiles.map(f => {
  const html = readFileSync(join(blogDir, f), 'utf-8');
  const { title, desc } = extractMeta(html);
  const stat = statSync(join(blogDir, f));
  return {
    title,
    desc,
    link: `${DOMAIN}/blog/${f}`,
    pubDate: stat.mtime.toUTCString(),
  };
});

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TailorMeSwiftly Blog</title>
    <link>${DOMAIN}/blog.html</link>
    <description>Career advice, resume tips, interview strategies, and salary negotiation guides from TailorMeSwiftly.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${DOMAIN}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${DOMAIN}/logo.png</url>
      <title>TailorMeSwiftly Blog</title>
      <link>${DOMAIN}/blog.html</link>
    </image>
${items.map(i => `    <item>
      <title>${escXml(i.title)}</title>
      <link>${i.link}</link>
      <guid>${i.link}</guid>
      <pubDate>${i.pubDate}</pubDate>
      <description>${escXml(i.desc)}</description>
    </item>`).join('\n')}
  </channel>
</rss>`;

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

writeFileSync(join(blogDir, 'feed.xml'), rss);
console.log(`Generated blog/feed.xml with ${items.length} articles`);

// Add RSS link to <head> of key pages
const rssLink = '<link rel="alternate" type="application/rss+xml" title="TailorMeSwiftly Blog" href="/blog/feed.xml">';
for (const page of ['index.html', 'blog.html']) {
  const filePath = join(ROOT, page);
  let html = readFileSync(filePath, 'utf-8');
  if (!html.includes('application/rss+xml')) {
    html = html.replace('</head>', `  ${rssLink}\n</head>`);
    writeFileSync(filePath, html);
    console.log(`  Added RSS link to ${page}`);
  }
}
