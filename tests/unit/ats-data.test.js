import { describe, it, expect } from 'vitest';

// ── Test ATS data processing logic (extracted from showATSResults) ──

function countIssues(atsData) {
    const searchIssues = (atsData.searchability || []).filter(s => s.status !== 'pass').length;
    const hardMissing = (atsData.hardSkills || []).filter(s => !s.inResume).length;
    const softMissing = (atsData.softSkills || []).filter(s => !s.inResume).length;
    const tipIssues = (atsData.recruiterTips || []).filter(t => t.status !== 'pass').length;
    const fmtIssues = (atsData.formatting || []).reduce(
        (c, cat) => c + cat.checks.filter(ch => ch.status !== 'pass').length, 0
    );
    return { searchIssues, hardMissing, softMissing, tipIssues, fmtIssues };
}

function getScoreColor(score) {
    return score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#dc2626';
}

function clampScore(raw) {
    return Math.min(100, Math.max(0, raw || 0));
}

const MOCK_ATS_DATA = {
    matchScore: 72,
    searchability: [
        { label: 'Contact Information', status: 'pass', details: ['Email found', 'Phone found'] },
        { label: 'Summary', status: 'warn', details: ['Summary section is weak'] },
        { label: 'Section Headings', status: 'pass', details: ['Standard headings used'] },
        { label: 'Job Title Match', status: 'fail', details: ['Title does not match target'] },
        { label: 'Date Formatting', status: 'pass', details: ['Consistent date format'] },
        { label: 'Education Match', status: 'pass', details: ['Education section found'] },
    ],
    hardSkills: [
        { skill: 'JavaScript', inResume: true, jdCount: 5 },
        { skill: 'React', inResume: true, jdCount: 4 },
        { skill: 'AWS', inResume: false, jdCount: 3 },
        { skill: 'Docker', inResume: false, jdCount: 2 },
        { skill: 'Python', inResume: true, jdCount: 2 },
    ],
    softSkills: [
        { skill: 'Leadership', inResume: true, jdCount: 3 },
        { skill: 'Communication', inResume: false, jdCount: 2 },
    ],
    recruiterTips: [
        { label: 'Job Level Match', status: 'pass', detail: 'Level matches well' },
        { label: 'Measurable Results', status: 'warn', detail: 'Add more metrics' },
        { label: 'Resume Tone', status: 'pass', detail: 'Professional tone' },
        { label: 'Word Count', status: 'pass', detail: 'Appropriate length' },
        { label: 'Action Verbs', status: 'fail', detail: 'Weak opening verbs' },
    ],
    formatting: [
        {
            category: 'Font & Readability',
            checks: [
                { status: 'pass', detail: 'Standard font' },
                { status: 'warn', detail: 'Line spacing could improve' },
            ]
        },
        {
            category: 'Layout',
            checks: [
                { status: 'pass', detail: 'Clean layout' },
            ]
        },
    ],
};

describe('ATS Issue Counting', () => {
    it('counts searchability issues correctly', () => {
        const counts = countIssues(MOCK_ATS_DATA);
        expect(counts.searchIssues).toBe(2); // warn + fail
    });

    it('counts missing hard skills', () => {
        const counts = countIssues(MOCK_ATS_DATA);
        expect(counts.hardMissing).toBe(2); // AWS, Docker
    });

    it('counts missing soft skills', () => {
        const counts = countIssues(MOCK_ATS_DATA);
        expect(counts.softMissing).toBe(1); // Communication
    });

    it('counts recruiter tip issues', () => {
        const counts = countIssues(MOCK_ATS_DATA);
        expect(counts.tipIssues).toBe(2); // warn + fail
    });

    it('counts formatting issues across categories', () => {
        const counts = countIssues(MOCK_ATS_DATA);
        expect(counts.fmtIssues).toBe(1); // 1 warn in Font & Readability
    });

    it('handles empty ATS data gracefully', () => {
        const counts = countIssues({});
        expect(counts.searchIssues).toBe(0);
        expect(counts.hardMissing).toBe(0);
        expect(counts.softMissing).toBe(0);
        expect(counts.tipIssues).toBe(0);
        expect(counts.fmtIssues).toBe(0);
    });

    it('handles all-pass data', () => {
        const allPass = {
            searchability: [{ label: 'Test', status: 'pass', details: [] }],
            hardSkills: [{ skill: 'JS', inResume: true, jdCount: 1 }],
            softSkills: [{ skill: 'Leadership', inResume: true, jdCount: 1 }],
            recruiterTips: [{ label: 'Test', status: 'pass', detail: 'OK' }],
            formatting: [{ category: 'Layout', checks: [{ status: 'pass', detail: 'OK' }] }],
        };
        const counts = countIssues(allPass);
        expect(counts.searchIssues).toBe(0);
        expect(counts.hardMissing).toBe(0);
        expect(counts.tipIssues).toBe(0);
    });
});

describe('Score Utilities', () => {
    it('green for scores >= 75', () => {
        expect(getScoreColor(75)).toBe('#16a34a');
        expect(getScoreColor(100)).toBe('#16a34a');
    });

    it('amber for scores 50-74', () => {
        expect(getScoreColor(50)).toBe('#f59e0b');
        expect(getScoreColor(74)).toBe('#f59e0b');
    });

    it('red for scores < 50', () => {
        expect(getScoreColor(49)).toBe('#dc2626');
        expect(getScoreColor(0)).toBe('#dc2626');
    });

    it('clamps score to 0-100', () => {
        expect(clampScore(150)).toBe(100);
        expect(clampScore(-10)).toBe(0);
        expect(clampScore(72)).toBe(72);
    });

    it('handles null/undefined score', () => {
        expect(clampScore(null)).toBe(0);
        expect(clampScore(undefined)).toBe(0);
    });
});

describe('ATS JSON Response Parsing', () => {
    it('strips markdown backticks from AI response', () => {
        const raw = '```json\n{"matchScore": 85}\n```';
        const cleaned = raw.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        const parsed = JSON.parse(cleaned);
        expect(parsed.matchScore).toBe(85);
    });

    it('handles response without backticks', () => {
        const raw = '{"matchScore": 85}';
        const cleaned = raw.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        const parsed = JSON.parse(cleaned);
        expect(parsed.matchScore).toBe(85);
    });

    it('parses full ATS response structure', () => {
        const raw = JSON.stringify(MOCK_ATS_DATA);
        const parsed = JSON.parse(raw);
        expect(parsed.searchability).toHaveLength(6);
        expect(parsed.hardSkills).toHaveLength(5);
        expect(parsed.recruiterTips).toHaveLength(5);
        expect(parsed.formatting).toHaveLength(2);
    });
});
