/**
 * Google Gemini API wrapper with file-based caching for idempotent generation.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.content-cache');

export class GeminiClient {
  constructor({ apiKey, model = 'gemini-2.5-flash', maxConcurrent = 5 }) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model });
    this.modelName = model;
    this.maxConcurrent = maxConcurrent;
    this.requestCount = 0;

    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  }

  getCachePath(key) {
    return join(CACHE_DIR, `${key}.json`);
  }

  getCached(key) {
    const p = this.getCachePath(key);
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8')).content;
    }
    return null;
  }

  setCache(key, content) {
    writeFileSync(this.getCachePath(key), JSON.stringify({
      content,
      generatedAt: new Date().toISOString(),
      model: this.modelName,
    }));
  }

  async generate(cacheKey, systemPrompt, userPrompt) {
    const cached = this.getCached(cacheKey);
    if (cached) {
      process.stdout.write('.');
      return cached;
    }

    // Rate limiting
    if (this.requestCount > 0) {
      await new Promise(r => setTimeout(r, 200));
    }
    this.requestCount++;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    const content = result.response.text();
    this.setCache(cacheKey, content);
    process.stdout.write('+');
    return content;
  }

  async processInBatches(items, processFn, batchSize = null) {
    const size = batchSize || this.maxConcurrent;
    const results = [];
    for (let i = 0; i < items.length; i += size) {
      const batch = items.slice(i, i + size);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
    }
    return results;
  }
}
