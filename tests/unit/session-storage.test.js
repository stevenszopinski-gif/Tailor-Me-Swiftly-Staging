import { describe, it, expect, beforeEach } from 'vitest';

// ── Test sessionStorage payload handling (loadOutputs pattern) ──

function loadOutputs() {
    try {
        const raw = sessionStorage.getItem('tms_outputs');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function buildPayload(resumeHtml, meta, resumeText, jobText) {
    return {
        resumeHtml,
        coverHtml: null,
        interviewQa: null,
        emailText: null,
        applicantName: meta.applicantName || '',
        targetCompany: meta.targetCompany || '',
        matchScore: meta.matchScore || null,
        missingKeywords: meta.missingKeywords || [],
        companyPrimaryColor: meta.companyPrimaryColor || '#1a1a2e',
        resumeText,
        jobText,
    };
}

describe('loadOutputs()', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns null when no data in sessionStorage', () => {
        expect(loadOutputs()).toBeNull();
    });

    it('returns parsed data from sessionStorage', () => {
        const data = { resumeHtml: '<h1>Test</h1>', applicantName: 'John' };
        sessionStorage.setItem('tms_outputs', JSON.stringify(data));
        const result = loadOutputs();
        expect(result.resumeHtml).toBe('<h1>Test</h1>');
        expect(result.applicantName).toBe('John');
    });

    it('returns null for corrupted JSON', () => {
        sessionStorage.setItem('tms_outputs', 'not-valid-json{{{');
        expect(loadOutputs()).toBeNull();
    });

    it('handles empty string in sessionStorage', () => {
        sessionStorage.setItem('tms_outputs', '');
        expect(loadOutputs()).toBeNull();
    });
});

describe('buildPayload()', () => {
    it('creates a complete payload with all fields', () => {
        const meta = {
            applicantName: 'Steven',
            targetCompany: 'Acme',
            matchScore: 85,
            missingKeywords: ['AWS'],
            companyPrimaryColor: '#ff0000',
        };
        const payload = buildPayload('<h1>Steven</h1>', meta, 'raw text', 'job desc');
        expect(payload.resumeHtml).toBe('<h1>Steven</h1>');
        expect(payload.applicantName).toBe('Steven');
        expect(payload.matchScore).toBe(85);
        expect(payload.companyPrimaryColor).toBe('#ff0000');
        expect(payload.resumeText).toBe('raw text');
        expect(payload.jobText).toBe('job desc');
        expect(payload.coverHtml).toBeNull();
    });

    it('uses defaults for missing meta fields', () => {
        const payload = buildPayload('<h1>Resume</h1>', {}, 'text', 'job');
        expect(payload.applicantName).toBe('');
        expect(payload.targetCompany).toBe('');
        expect(payload.matchScore).toBeNull();
        expect(payload.missingKeywords).toEqual([]);
        expect(payload.companyPrimaryColor).toBe('#1a1a2e');
    });
});
