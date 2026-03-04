#!/usr/bin/env node
/**
 * Export social-content.json to Buffer-compatible CSV files.
 * Creates separate CSVs for LinkedIn, Instagram, and Facebook.
 *
 * Buffer bulk upload format: Text, Link (optional), Is Pinned (optional), Publish Date (optional)
 * Posts spaced across days, alternating morning/afternoon.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const data = JSON.parse(readFileSync(join(ROOT, 'social-content.json'), 'utf-8'));

const SITE_URL = 'https://tailormeswiftly.com';

// Map post types to relevant landing pages
const LINK_MAP = {
  tip: `${SITE_URL}/app.html`,
  stat: `${SITE_URL}/blog.html`,
  myth: `${SITE_URL}/seo/`,
  question: `${SITE_URL}`,
  insight: `${SITE_URL}/blog.html`,
  hook: `${SITE_URL}/app.html`,
  listicle: `${SITE_URL}/seo/`,
  promotion: `${SITE_URL}/app.html`,
};

function escapeCSV(text) {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function generateSchedule(count, startDate) {
  const dates = [];
  const d = new Date(startDate);
  for (let i = 0; i < count; i++) {
    // Alternate between 9:00 AM and 2:00 PM
    const hour = i % 2 === 0 ? 9 : 14;
    d.setHours(hour, 0, 0, 0);
    dates.push(new Date(d));
    if (i % 2 === 1) d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy} ${hh}:${min}`;
}

function buildCSV(posts, startDate) {
  const schedule = generateSchedule(posts.length, startDate);
  const rows = ['Text,Link,Is Pinned,Publish Date'];

  posts.forEach((post, i) => {
    let text = post.text.replace(/\[LINK\]/g, '').trim();
    if (post.hashtags && post.hashtags.length > 0) {
      text += '\n\n' + post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
    }

    const link = LINK_MAP[post.type] || SITE_URL;
    const date = formatDate(schedule[i]);

    rows.push(`${escapeCSV(text)},${link},false,${date}`);
  });

  return rows.join('\n');
}

// Split by platform
const linkedin = data.posts.filter(p => p.platform === 'linkedin');
const instagram = data.posts.filter(p => p.platform === 'instagram');
const facebook = data.posts.filter(p => p.platform === 'facebook');
// Keep twitter for backwards compat
const twitter = data.posts.filter(p => p.platform === 'twitter');

// Start scheduling from tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);

const files = [];

if (linkedin.length) {
  writeFileSync(join(ROOT, 'buffer-linkedin.csv'), buildCSV(linkedin, tomorrow));
  files.push(`  buffer-linkedin.csv — ${linkedin.length} posts`);
}
if (instagram.length) {
  writeFileSync(join(ROOT, 'buffer-instagram.csv'), buildCSV(instagram, tomorrow));
  files.push(`  buffer-instagram.csv — ${instagram.length} posts`);
}
if (facebook.length) {
  writeFileSync(join(ROOT, 'buffer-facebook.csv'), buildCSV(facebook, tomorrow));
  files.push(`  buffer-facebook.csv — ${facebook.length} posts`);
}
if (twitter.length) {
  writeFileSync(join(ROOT, 'buffer-twitter.csv'), buildCSV(twitter, tomorrow));
  files.push(`  buffer-twitter.csv — ${twitter.length} posts`);
}

console.log(`Exported ${data.posts.length} posts:\n${files.join('\n')}`);
console.log(`\nSchedule: 2 posts/day (9AM + 2PM), starting ${tomorrow.toLocaleDateString()}`);
console.log(`\nTo import into Buffer:`);
console.log(`  1. Go to https://publish.buffer.com`);
console.log(`  2. Select a channel → "Queue" → "Bulk Upload"`);
console.log(`  3. Upload the matching CSV file`);
console.log(`  4. Repeat for each channel`);
