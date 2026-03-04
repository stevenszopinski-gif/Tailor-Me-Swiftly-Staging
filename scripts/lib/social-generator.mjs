/**
 * Social media content generator — creates LinkedIn, Instagram, and Facebook posts.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const SOCIAL_SYSTEM_PROMPT = `You are a social media manager for TailorMeSwiftly.com, a career tool platform.
Generate social media posts. Return ONLY a valid JSON array of objects, no markdown code fences.
Each object must have: platform (string), type (string: "tip"|"stat"|"myth"|"question"|"insight"|"listicle"|"hook"), text (string), hashtags (array of strings).
Rules:
- Mix tones: authoritative tips, surprising stats, myth-busting, engagement questions
- Each post must be unique and valuable standalone
- 1-2 emojis max per post
- Mention TailorMeSwiftly naturally in ~40% of posts
- Include a [LINK] placeholder where a URL would go`;

export async function generateSocialContent(client, root, { dryRun } = {}) {
  if (dryRun) {
    console.log('\n  [dry-run] Would generate 45 social posts');
    return;
  }

  console.log('\nGenerating social media content...');

  // LinkedIn posts (professional, long-form)
  const linkedinContent = await client.generate(
    'social-linkedin-v2',
    SOCIAL_SYSTEM_PROMPT,
    `Generate 15 LinkedIn posts about job searching, resume optimization, ATS systems, interview prep, salary negotiation, and career growth. Each post: platform "linkedin", 800-1300 chars, professional tone, use line breaks for readability, include a call-to-action, 3-5 hashtags.`
  );

  // Instagram posts (visual-friendly captions, hashtag-heavy)
  const instagramContent = await client.generate(
    'social-instagram-v2',
    SOCIAL_SYSTEM_PROMPT,
    `Generate 15 Instagram posts (captions) about job searching, resume tips, career advice, and interview prep. Each post: platform "instagram", 300-600 chars, conversational and motivational tone, use line breaks and short paragraphs, end with a strong CTA, 10-15 hashtags (mix of broad and niche career hashtags like #JobSearch #ResumeTips #CareerGoals #HiringNow #InterviewPrep #ATS #CareerAdvice #JobHunt2026 etc).`
  );

  // Facebook posts (conversational, shareable)
  const facebookContent = await client.generate(
    'social-facebook-v2',
    SOCIAL_SYSTEM_PROMPT,
    `Generate 15 Facebook posts about job searching, resume optimization, career growth, and interview tips. Each post: platform "facebook", 400-800 chars, conversational and relatable tone, ask questions to drive comments, use line breaks, 3-5 hashtags.`
  );

  // Parse and combine
  let posts = [];
  try {
    const strip = s => s.replace(/```json?\n?/g, '').replace(/```/g, '');
    const linkedin = JSON.parse(strip(linkedinContent));
    const instagram = JSON.parse(strip(instagramContent));
    const facebook = JSON.parse(strip(facebookContent));
    posts = [...linkedin, ...instagram, ...facebook];
  } catch (e) {
    console.error('  Warning: Could not parse social content as JSON, saving raw output.');
    posts = [{ raw_linkedin: linkedinContent, raw_instagram: instagramContent, raw_facebook: facebookContent }];
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
