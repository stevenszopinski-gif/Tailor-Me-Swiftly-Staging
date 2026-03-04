/**
 * Updates blog.html with cards for newly generated blog articles.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { BLOG_TOPICS } from './roles-data.mjs';
import { escapeHtml, YEAR } from './templates.mjs';

export function updateBlogIndex(root) {
  const blogPath = join(root, 'blog.html');
  let html = readFileSync(blogPath, 'utf-8');

  // Check which topics are already linked
  const existingLinks = BLOG_TOPICS.filter(t => html.includes(`blog/${t.slug}.html`));
  const newTopics = BLOG_TOPICS.filter(t => !html.includes(`blog/${t.slug}.html`));

  if (newTopics.length === 0) {
    console.log('  blog.html already has all topic cards.');
    return;
  }

  // Generate new cards
  const cards = newTopics.map(t => `      <a href="blog/${t.slug}.html" class="blog-card">
        <span class="blog-card-tag">${escapeHtml(t.tag)}</span>
        <h3>${escapeHtml(t.title)}</h3>
        <p>${escapeHtml(t.desc)}</p>
        <div class="blog-card-meta"><span>${t.readTime} read</span><span>Mar ${YEAR}</span></div>
      </a>`).join('\n');

  // Insert before the closing </div> of the blog grid
  // Find the blog-grid container
  const gridEndPattern = /(<div class="blog-grid"[^>]*>[\s\S]*?)(<\/div>\s*<\/main>)/;
  const match = html.match(gridEndPattern);

  if (match) {
    html = html.replace(gridEndPattern, `$1\n${cards}\n$2`);
    writeFileSync(blogPath, html);
    console.log(`  Added ${newTopics.length} new cards to blog.html`);
  } else {
    console.log('  Warning: Could not find blog-grid insertion point in blog.html');
  }
}
