#!/usr/bin/env node
/**
 * AI Content Generation CLI for TailorMeSwiftly.
 *
 * Usage:
 *   node scripts/generate-content.mjs --all                    # Generate everything
 *   node scripts/generate-content.mjs --seo                    # SEO pages only
 *   node scripts/generate-content.mjs --seo --role=devops-engineer  # Single role
 *   node scripts/generate-content.mjs --blog                   # Blog articles only
 *   node scripts/generate-content.mjs --social                 # Social posts only
 *   node scripts/generate-content.mjs --all --dry-run          # Preview without generating
 *
 * Environment:
 *   GEMINI_API_KEY or GOOGLE_API_KEY — required for content generation
 */
import { execSync } from 'child_process';
import { resolve } from 'path';
import { GeminiClient } from './lib/gemini-client.mjs';
import { generateSeoPages } from './lib/seo-generator.mjs';
import { generateBlogArticles } from './lib/blog-generator.mjs';
import { generateSocialContent } from './lib/social-generator.mjs';
import { updateSeoIndex } from './lib/seo-index-updater.mjs';
import { updateBlogIndex } from './lib/blog-index-updater.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function getFlagValue(name) {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
}

async function main() {
  const doAll = hasFlag('all');
  const doSeo = hasFlag('seo') || doAll;
  const doBlog = hasFlag('blog') || doAll;
  const doSocial = hasFlag('social') || doAll;
  const dryRun = hasFlag('dry-run');
  const singleRole = getFlagValue('role');

  if (!doSeo && !doBlog && !doSocial) {
    console.log('Usage: node scripts/generate-content.mjs --all|--seo|--blog|--social [--dry-run] [--role=slug]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('Error: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
    process.exit(1);
  }

  const client = dryRun ? null : new GeminiClient({ apiKey });

  console.log('=== TailorMeSwiftly Content Generator ===');
  if (dryRun) console.log('  (DRY RUN — no files will be written)\n');

  // 1. SEO Pages
  if (doSeo) {
    await generateSeoPages(client, ROOT, { singleRole, dryRun });
    if (!dryRun) {
      console.log('\nUpdating SEO index...');
      updateSeoIndex(ROOT);
    }
  }

  // 2. Blog Articles
  if (doBlog) {
    await generateBlogArticles(client, ROOT, { dryRun });
    if (!dryRun) {
      console.log('\nUpdating blog index...');
      updateBlogIndex(ROOT);
    }
  }

  // 3. Social Content
  if (doSocial) {
    await generateSocialContent(client, ROOT, { dryRun });
  }

  // 4. Regenerate sitemap
  if (!dryRun && (doSeo || doBlog)) {
    console.log('\nRegenerating sitemap...');
    try {
      execSync('node scripts/generate-sitemap.js', { cwd: ROOT, stdio: 'inherit' });
    } catch (e) {
      console.error('  Warning: sitemap generation failed:', e.message);
    }
  }

  console.log('\n=== Done! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
