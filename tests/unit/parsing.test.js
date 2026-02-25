import { describe, it, expect } from 'vitest';

// ── Test the code block extraction regex used in parseAndRedirect ──
function extractCodeBlocks(content) {
    const pattern = /```(?:html|json|text)?\n([\s\S]*?)```/g;
    const matches = [];
    let m;
    while ((m = pattern.exec(content)) !== null) matches.push(m[1].trim());
    return matches;
}

function parseMetadata(jsonString) {
    try {
        return JSON.parse(jsonString || '{}');
    } catch (e) {
        return {};
    }
}

describe('Code Block Extraction', () => {
    it('extracts HTML and JSON blocks from AI response', () => {
        const content = '```html\n<h1>John Doe</h1>\n<h2>Experience</h2>\n```\n```json\n{"applicantName":"John Doe","matchScore":85}\n```';
        const blocks = extractCodeBlocks(content);
        expect(blocks).toHaveLength(2);
        expect(blocks[0]).toContain('<h1>John Doe</h1>');
        expect(blocks[1]).toContain('"applicantName"');
    });

    it('handles empty response gracefully', () => {
        const blocks = extractCodeBlocks('');
        expect(blocks).toHaveLength(0);
    });

    it('handles response with no code fences', () => {
        const blocks = extractCodeBlocks('Just plain text without fences');
        expect(blocks).toHaveLength(0);
    });

    it('handles response with only HTML block', () => {
        const content = '```html\n<h1>Resume</h1>\n```';
        const blocks = extractCodeBlocks(content);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toBe('<h1>Resume</h1>');
    });

    it('trims whitespace from extracted blocks', () => {
        const content = '```html\n   <h1>Padded</h1>   \n```';
        const blocks = extractCodeBlocks(content);
        expect(blocks[0]).toBe('<h1>Padded</h1>');
    });

    it('handles text code fence type', () => {
        const content = '```text\nPlain text block\n```';
        const blocks = extractCodeBlocks(content);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toBe('Plain text block');
    });
});

describe('Metadata Parsing', () => {
    it('parses valid JSON metadata', () => {
        const meta = parseMetadata('{"applicantName":"Jane","matchScore":92}');
        expect(meta.applicantName).toBe('Jane');
        expect(meta.matchScore).toBe(92);
    });

    it('returns empty object for invalid JSON', () => {
        const meta = parseMetadata('not valid json');
        expect(meta).toEqual({});
    });

    it('returns empty object for null input', () => {
        const meta = parseMetadata(null);
        expect(meta).toEqual({});
    });

    it('returns empty object for empty string', () => {
        const meta = parseMetadata('');
        expect(meta).toEqual({});
    });

    it('handles metadata with all fields', () => {
        const json = JSON.stringify({
            applicantName: 'Steven',
            targetCompany: 'Acme',
            matchScore: 78,
            missingKeywords: ['AWS', 'Docker'],
            companyPrimaryColor: '#ff0000'
        });
        const meta = parseMetadata(json);
        expect(meta.applicantName).toBe('Steven');
        expect(meta.targetCompany).toBe('Acme');
        expect(meta.missingKeywords).toEqual(['AWS', 'Docker']);
        expect(meta.companyPrimaryColor).toBe('#ff0000');
    });
});
