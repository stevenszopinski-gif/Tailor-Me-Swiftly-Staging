/**
 * Social media content generator — creates LinkedIn and X/Twitter posts.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const SOCIAL_SYSTEM_PROMPT = `You are a social media manager for TailorMeSwiftly.com, a career tool platform.
Generate social media posts. Return ONLY a valid JSON array of objects, no markdown code fences.
Each object must have: platform (string: "linkedin" or "twitter"), type (string: "tip"|"stat"|"myth"|"question"|"promotion"), text (string), hashtags (array of 3-5 strings).
LinkedIn posts: professional, 800-1300 chars, use line breaks for readability, include a call-to-action.
Twitter posts: punchy, under 280 chars including hashtags, one key insight.
Rules:
- Mix tones: authoritative tips, surprising stats, myth-busting, engagement questions
- Each post must be unique
- 1-2 emojis max per post
- Mention TailorMeSwiftly naturally in ~40% of posts
- Include a [LINK] placeholder where a URL would go`;

export async function generateSocialContent(client, root, { dryRun } = {}) {
  if (dryRun) {
    console.log('\n  [dry-run] Would generate 30 social posts');
    return;
  }

  console.log('\nGenerating social media content...');

  // LinkedIn posts
  const linkedinContent = await client.generate(
    'social-linkedin',
    SOCIAL_SYSTEM_PROMPT,
    `Generate 15 LinkedIn posts about job searching, resume optimization, ATS systems, interview prep, salary negotiation, and career growth. Mix of tips, stats, myths, and questions. Each post should be 800-1300 characters.`
  );

  // Twitter posts
  const twitterContent = await client.generate(
    'social-twitter',
    SOCIAL_SYSTEM_PROMPT,
    `Generate 15 Twitter/X posts about job searching, resume tips, ATS systems, interview prep, and career advice. Each must be under 280 characters including hashtags. Punchy and engaging.`
  );

  // Parse and combine
  let posts = [];
  try {
    const linkedin = JSON.parse(linkedinContent.replace(/```json?\n?/g, '').replace(/```/g, ''));
    const twitter = JSON.parse(twitterContent.replace(/```json?\n?/g, '').replace(/```/g, ''));
    posts = [...linkedin, ...twitter];
  } catch (e) {
    console.error('  Warning: Could not parse social content as JSON, saving raw output.');
    posts = [{ raw_linkedin: linkedinContent, raw_twitter: twitterContent }];
  }

  const output = {
    generated: new Date().toISOString().split('T')[0],
    totalPosts: posts.length,
    posts: posts.map((p, i) => ({ id: i + 1, ...p })),
  };

  // Write JSON
  writeFileSync(join(root, 'social-content.json'), JSON.stringify(output, null, 2));

  // Write Markdown
  const md = [`# Social Media Content\n\nGenerated: ${output.generated}\n\n---\n`];
  for (const p of output.posts) {
    if (p.raw_linkedin) {
      md.push(`## Raw Output\n\n### LinkedIn\n${p.raw_linkedin}\n\n### Twitter\n${p.raw_twitter}\n`);
    } else {
      md.push(`## ${p.platform?.toUpperCase() || 'POST'} — ${p.type || 'general'}\n\n${p.text || ''}\n\nHashtags: ${(p.hashtags || []).join(' ')}\n\n---\n`);
    }
  }
  writeFileSync(join(root, 'social-content.md'), md.join('\n'));

  console.log(`  Done: ${posts.length} social posts generated.`);
  return posts;
}
