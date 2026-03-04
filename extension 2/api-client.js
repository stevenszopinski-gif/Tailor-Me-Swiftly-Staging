// TailorMeSwiftly Extension — Supabase API Client
// Depends on supabase-auth.js (TmsAuth global)
(function () {
  'use strict';

  var SUPABASE_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';

  // ---- Helpers ----

  async function authHeaders() {
    var token = await TmsAuth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + token,
    };
  }

  // Build fresh auth headers after a force token refresh
  async function freshAuthHeaders() {
    var token = await TmsAuth.forceRefresh();
    if (!token) throw new Error('Session expired. Please sign out and sign in again.');
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + token,
    };
  }

  // Detect RLS / auth errors from PostgREST responses
  function isAuthOrRlsError(data) {
    var msg = (data && (data.message || data.msg || '')) || '';
    return msg.indexOf('row-level security') !== -1
      || msg.indexOf('JWTExpired') !== -1
      || msg.indexOf('JWT expired') !== -1
      || msg.indexOf('permission denied') !== -1;
  }

  // ---- Job Applications ----

  async function saveJobToKanban(jobData) {
    var headers = await authHeaders();
    headers['Prefer'] = 'return=representation';

    var user = await TmsAuth.getUser();
    if (!user || !user.id) throw new Error('Not authenticated');

    var body = JSON.stringify({
      user_id: user.id,
      company: jobData.company || 'Unknown Company',
      role: jobData.title || 'Unknown Role',
      status: 'saved',
      job_url: jobData.url || null,
      job_description: (jobData.description || '').substring(0, 50000),
      source: 'extension',
    });

    var resp = await fetch(SUPABASE_URL + '/rest/v1/job_applications', {
      method: 'POST',
      headers: headers,
      body: body,
    });

    var data = await resp.json();

    // If RLS/auth error, force refresh token and retry once
    if (!resp.ok && isAuthOrRlsError(data)) {
      console.warn('[tms-ext] RLS/auth error, refreshing token and retrying...');
      var retryHeaders = await freshAuthHeaders();
      retryHeaders['Prefer'] = 'return=representation';

      // Re-fetch user after refresh (user_id might differ if session changed)
      var freshUser = await TmsAuth.getUser();
      if (!freshUser || !freshUser.id) throw new Error('Session expired. Please sign out and sign in again.');

      var retryBody = JSON.stringify({
        user_id: freshUser.id,
        company: jobData.company || 'Unknown Company',
        role: jobData.title || 'Unknown Role',
        status: 'saved',
        job_url: jobData.url || null,
        job_description: (jobData.description || '').substring(0, 50000),
        source: 'extension',
      });

      resp = await fetch(SUPABASE_URL + '/rest/v1/job_applications', {
        method: 'POST',
        headers: retryHeaders,
        body: retryBody,
      });

      data = await resp.json();
    }

    if (!resp.ok) throw new Error(data.message || 'Failed to save job');
    return Array.isArray(data) ? data[0] : data;
  }

  // ---- Resume Profiles ----

  async function getDefaultResumeProfile() {
    var headers = await authHeaders();
    var resp = await fetch(
      SUPABASE_URL + '/rest/v1/resume_profiles?is_default=eq.true&limit=1',
      { headers: headers }
    );
    var data = await resp.json();
    if (!resp.ok || !data.length) return null;
    return data[0];
  }

  // ---- Resume Generation ----

  var SYSTEM_PROMPT = 'You are an elite Executive Career Coach and Expert ATS Resume Writer.\n\n' +
    'Your task: Take the candidate\'s existing resume and tailor it for the target job description.\n\n' +
    'CRITICAL RULES:\n' +
    '- ACCURACY IS PARAMOUNT: NEVER fabricate, exaggerate, or invent experience\n' +
    '- Only rephrase what the candidate actually did — do not upgrade their role\n' +
    '- Use ONLY what appears in the source resume\n' +
    '- Weave in keywords from the job description naturally\n' +
    '- Preserve all metrics, numbers, and specific achievements exactly\n\n' +
    'OUTPUT FORMAT:\n' +
    'Respond with exactly 2 code blocks:\n' +
    '1. ```html — The tailored resume as clean, semantic HTML\n' +
    '2. ```json — Metadata object with: applicantName, matchScore (0-100), missingKeywords (array), targetCompany, targetRole';

  async function generateTailoredResume(jobDescription, resumeText) {
    var headers = await authHeaders();

    var resp = await fetch(SUPABASE_URL + '/functions/v1/gemini-proxy', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: 'user',
          parts: [{ text: '=== RESUME ===\n' + resumeText + '\n\n=== JOB DESCRIPTION ===\n' + jobDescription }]
        }],
        generationConfig: { temperature: 0.7 },
      }),
    });

    var result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Generation failed');
    return result;
  }

  function parseGenerationResult(result) {
    var rawText = '';
    try {
      rawText = result.candidates[0].content.parts[0].text;
    } catch (e) {
      throw new Error('Invalid generation response');
    }

    var htmlMatch = rawText.match(/```html\s*\n([\s\S]*?)```/);
    var jsonMatch = rawText.match(/```json\s*\n([\s\S]*?)```/);

    var resumeHtml = htmlMatch ? htmlMatch[1].trim() : '';
    var metadata = {};
    if (jsonMatch) {
      try { metadata = JSON.parse(jsonMatch[1]); } catch (e) { /* ignore */ }
    }

    return {
      resumeHtml: resumeHtml,
      rawText: rawText,
      metadata: metadata,
      matchScore: metadata.matchScore || 0,
      applicantName: metadata.applicantName || '',
      targetCompany: metadata.targetCompany || '',
      missingKeywords: metadata.missingKeywords || [],
    };
  }

  // ---- Save Generation ----

  async function saveGeneration(userId, parsed, jobAppId) {
    var headers = await authHeaders();
    headers['Prefer'] = 'return=representation';

    var genResp = await fetch(SUPABASE_URL + '/rest/v1/generations', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        user_id: userId,
        resume_html: parsed.resumeHtml,
        match_score: parsed.matchScore,
        applicant_name: parsed.applicantName,
        target_company: parsed.targetCompany,
        missing_keywords: parsed.missingKeywords,
        application_status: 'Tailored',
      }),
    });

    var genData = await genResp.json();
    if (!genResp.ok) throw new Error('Failed to save generation');
    var generation = Array.isArray(genData) ? genData[0] : genData;

    // Link generation to job application
    if (jobAppId && generation.id) {
      await fetch(SUPABASE_URL + '/rest/v1/job_applications?id=eq.' + jobAppId, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ generation_id: generation.id }),
      });
    }

    return generation;
  }

  // Expose globally
  window.TmsApi = {
    saveJobToKanban: saveJobToKanban,
    getDefaultResumeProfile: getDefaultResumeProfile,
    generateTailoredResume: generateTailoredResume,
    parseGenerationResult: parseGenerationResult,
    saveGeneration: saveGeneration,
  };
})();
