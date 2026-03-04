import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const prompt = `Generate 3 social media posts to launch TailorMeSwiftly.com — a free AI-powered CAREER tool (not just a job application tool). It helps professionals at every stage: tailor resumes, generate cover letters, prep for interviews with AI mock interviews, and negotiate salaries with real market data. Covers 90+ job roles across tech, healthcare, business, creative, legal, education, and trades.

IMPORTANT FRAMING: Position this as a career advancement platform, not just a resume builder. Emphasize that it helps people grow their careers, make smarter career moves, and earn what they deserve — not just "apply to jobs." The tone should feel empowering and forward-looking.

Return ONLY valid JSON array, no code fences. Each object: { platform, text, hashtags }

1. LinkedIn post (800-1200 chars): Professional, thought-leadership tone. Open with a bold statement about career growth (not job applications). Highlight how the tool empowers career decisions — from knowing your market value to nailing negotiations. Mention 90+ roles, free, AI-powered. End with CTA.

2. Instagram post (300-500 chars): Motivational, empowering. Hook line about owning your career. Short punchy paragraphs. Emphasize career growth, not just getting hired. End with CTA. 10-12 hashtags.

3. Facebook post (400-700 chars): Conversational. Open with a relatable career frustration (feeling underpaid, unsure of next move, stuck). Present the tool as the career co-pilot. End with CTA asking people to share their career goals.

URL: https://tailormeswiftly.com
Use 1-2 emojis max per post. Do NOT use the word "wizard." Keep it sharp and modern.`;

const req = {
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
};
req.systemInstruction = { parts: [{ text: 'You are an expert social media copywriter specializing in career and professional development brands. Write posts that feel authentic, empowering, and drive engagement. Return ONLY a JSON array.' }] };

const result = await model.generateContent(req);
console.log(result.response.text());
