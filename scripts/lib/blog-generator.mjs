/**
 * Blog article generator — creates long-form articles using AI.
 */
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { BLOG_TOPICS } from './roles-data.mjs';
import { escapeHtml, escapeAttr, YEAR } from './templates.mjs';

const DOMAIN = 'https://tailormeswiftly.com';

const BLOG_SYSTEM_PROMPT = `You are a career expert writing long-form blog content for TailorMeSwiftly.com.
Write a complete blog article body in HTML format.
Requirements:
- 1500-2000 words of substantive, actionable content
- Use <h2> for section headings (4-6 sections)
- Use <p> tags for paragraphs
- Include 1-2 stat callout blocks: <div class="stat-callout"><span class="stat-number">XX%</span> Description text</div>
- Include 1 tip box: <div class="tip-box"><i class="fa-solid fa-lightbulb"></i> <strong>Tip:</strong> text</div>
- Use <ul><li> for lists where appropriate
- Use <strong> and <em> for emphasis
- Naturally mention TailorMeSwiftly 2-3 times as a tool that helps with the topic
- Include practical, specific advice (not generic platitudes)
- Write in a confident, direct voice
- Do NOT include the article title, metadata, or any wrapper HTML — just the article body content
- End with a brief conclusion paragraph
Return ONLY the HTML body content.`;

function blogTemplate(topic, bodyHtml) {
  const canonical = `${DOMAIN}/blog/${topic.slug}.html`;
  const metaDesc = topic.desc;

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeAttr(metaDesc)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="TailorMeSwiftly">
  <meta property="og:title" content="${escapeAttr(topic.title)}">
  <meta property="og:description" content="${escapeAttr(metaDesc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${DOMAIN}/logo.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeAttr(topic.title)}">
  <meta name="twitter:description" content="${escapeAttr(metaDesc)}">
  <meta name="twitter:image" content="${DOMAIN}/logo.png">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <title>${escapeHtml(topic.title)} | TailorMeSwiftly Blog</title>
  <link rel="stylesheet" href="/style.css?v=17">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@300..700&family=Outfit:wght@300..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    .blog-article-wrap { max-width: 780px; margin: 0 auto; padding: 0 1.5rem 4rem; }
    .article-tag { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--primary-color); background: rgba(163,196,220,0.1); padding: 0.25rem 0.7rem; border-radius: 3px; margin-bottom: 0.75rem; }
    .article-title { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 700; line-height: 1.25; color: var(--text-primary); margin-bottom: 0.75rem; }
    .article-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--panel-border); }
    .blog-post h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 2rem 0 0.75rem; }
    .blog-post p { color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; margin-bottom: 1rem; }
    .blog-post ul { color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; padding-left: 1.5rem; margin-bottom: 1rem; }
    .blog-post li { margin-bottom: 0.4rem; }
    .stat-callout { border-left: 4px solid var(--primary-color); padding: 1rem 1.25rem; margin: 1.5rem 0; background: var(--panel-bg); border-radius: 0 var(--brutal-radius) var(--brutal-radius) 0; }
    .stat-callout .stat-number { font-size: 1.8rem; font-weight: 700; color: var(--primary-color); display: block; margin-bottom: 0.25rem; }
    .tip-box { background: rgba(163,196,220,0.08); border: 1px dashed var(--panel-border); border-radius: var(--brutal-radius); padding: 1rem 1.25rem; margin: 1.5rem 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7; }
    .tip-box i { color: var(--primary-color); margin-right: 0.4rem; }
    .blog-cta { text-align: center; margin: 2.5rem 0; padding: 2rem; background: var(--panel-bg); border: 1px dashed var(--panel-border); border-radius: var(--brutal-radius); }
    .blog-cta a { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1rem; padding: 0.8rem 1.8rem; border-radius: var(--brutal-radius); text-decoration: none; font-weight: 600; background: var(--primary-color); color: var(--btn-primary-text); box-shadow: var(--brutal-shadow); }
    .blog-breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem; padding-top: 1.5rem; }
    .blog-breadcrumb a { color: var(--text-secondary); text-decoration: none; }
    .blog-breadcrumb a:hover { color: var(--primary-color); }
    .blog-breadcrumb i { font-size: 0.6rem; opacity: 0.6; }
    @media (max-width: 600px) { .blog-article-wrap { padding: 0 1rem 3rem; } }
  </style>
</head>

<body>
  <header class="app-header" role="banner">
    <a href="/" class="logo maker-mark" style="text-decoration:none;color:inherit;">
      <span class="mark-border"><span class="mark-text">TMS</span></span>
      <div class="mark-name">
        <span class="mark-script">TailorMeSwiftly</span>
        <span class="mark-sub">BESPOKE APPLICATION ENGINE</span>
      </div>
    </a>
    <div class="header-actions" style="display: flex; gap: 0.25rem; align-items: center;">
      <a href="/pricing.html" title="Pricing" style="text-decoration: none; color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; padding: 0.4rem 0.6rem;">
        <i class="fa-solid fa-gem"></i> Pricing
      </a>
      <a href="/login.html?signup=true" class="btn secondary-btn" style="padding: 0.45rem 0.9rem; text-decoration: none; font-size: 0.85rem;">
        Sign Up
      </a>
    </div>
  </header>

  <main class="blog-article-wrap">
    <nav class="blog-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <i class="fa-solid fa-chevron-right"></i>
      <a href="/blog.html">Blog</a>
      <i class="fa-solid fa-chevron-right"></i>
      <span>${escapeHtml(topic.title)}</span>
    </nav>

    <span class="article-tag">${escapeHtml(topic.tag)}</span>
    <h1 class="article-title">${escapeHtml(topic.title)}</h1>
    <div class="article-meta">
      <span><i class="fa-regular fa-calendar"></i> Mar ${YEAR}</span>
      <span><i class="fa-regular fa-clock"></i> ${topic.readTime} read</span>
      <span><i class="fa-regular fa-user"></i> TailorMeSwiftly Team</span>
    </div>

    <article class="blog-post">
${bodyHtml}
    </article>

    <div class="blog-cta">
      <p style="margin-bottom: 1rem; color: var(--text-secondary);">Ready to put these insights into action?</p>
      <a href="/app.html"><i class="fa-solid fa-file-lines"></i> Tailor Your Resume Now</a>
    </div>

    <p style="margin-top: 2rem;"><a href="/blog.html" style="color: var(--primary-color); text-decoration: none;"><i class="fa-solid fa-arrow-left"></i> Back to Blog</a></p>
  </main>

  <footer class="site-footer" role="contentinfo">
    <p><a href="/pricing.html">Pricing</a> | <a href="/help.html">Help Center</a> | <a href="/terms.html">Terms &amp; Conditions</a> | <a href="/privacy.html">Privacy Policy</a> | <a href="/security.html">Security Policy</a></p>
    <p>&copy; ${YEAR} TailorMeSwiftly.com</p>
  </footer>
</body>
</html>`;
}

export async function generateBlogArticles(client, root, { dryRun } = {}) {
  const blogDir = join(root, 'blog');
  const generated = [];

  console.log(`\nGenerating ${BLOG_TOPICS.length} blog articles...`);

  for (const topic of BLOG_TOPICS) {
    const filename = `${topic.slug}.html`;
    const filepath = join(blogDir, filename);
    const cacheKey = `blog-${topic.slug}`;

    if (dryRun) {
      console.log(`  [dry-run] blog/${filename}`);
      generated.push(filename);
      continue;
    }

    // Skip if file already exists and is in cache
    if (existsSync(filepath) && client.getCached(cacheKey)) {
      process.stdout.write('.');
      generated.push(filename);
      continue;
    }

    const userPrompt = `Write a blog article about: "${topic.title}"
Topic tag: ${topic.tag}
Target reading time: ${topic.readTime}
Description: ${topic.desc}

Write actionable, specific content. Include real statistics, frameworks, and tools where relevant. The audience is job seekers and career changers.`;

    const bodyHtml = await client.generate(cacheKey, BLOG_SYSTEM_PROMPT, userPrompt);
    const html = blogTemplate(topic, bodyHtml);
    writeFileSync(filepath, html);
    generated.push(filename);
  }

  console.log(`\n  Done: ${generated.length} blog articles generated.`);
  return generated;
}
