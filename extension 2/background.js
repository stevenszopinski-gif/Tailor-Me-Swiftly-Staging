// TailorMeSwiftly Background Service Worker v3
// Manages badge count, capture history, and background resume generation

var SUPABASE_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co';
var SUPABASE_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';
var AUTH_STORAGE_KEY = 'tms_auth';

// ---- Token helpers (duplicated here since service workers can't import popup scripts) ----

async function getStoredToken() {
    var result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    var auth = result[AUTH_STORAGE_KEY];
    if (!auth) return null;

    // Check expiry (30s buffer)
    if (auth.expires_at < Date.now() + 30000) {
        try {
            var resp = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
                body: JSON.stringify({ refresh_token: auth.refresh_token }),
            });
            var data = await resp.json();
            if (!resp.ok) return null;

            auth = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: Date.now() + (data.expires_in * 1000),
                user: data.user,
            };
            var obj = {};
            obj[AUTH_STORAGE_KEY] = auth;
            await chrome.storage.local.set(obj);
        } catch (e) {
            return null;
        }
    }

    return auth;
}

// ---- System prompt (matches WizardPage.tsx) ----

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

// ---- Message listener ----

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'update_badge') {
        var count = request.count || 0;
        chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }

    if (request.action === 'update_badge_increment') {
        chrome.storage.local.get('tms_captures', function (result) {
            var count = (result.tms_captures || []).length;
            chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
            chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
        });
    }

    if (request.action === 'generate_resume') {
        handleBackgroundGeneration(request);
    }
});

// ---- Background generation ----

async function handleBackgroundGeneration(request) {
    var jobDescription = request.jobDescription;
    var resumeText = request.resumeText;
    var jobAppId = request.jobAppId;
    var jobTitle = request.jobTitle || 'Unknown Role';
    var company = request.company || 'Unknown Company';

    try {
        var auth = await getStoredToken();
        if (!auth) {
            showNotification('Generation Failed', 'Please log in again.');
            return;
        }

        var token = auth.access_token;
        var userId = auth.user ? auth.user.id : null;

        // Call Gemini proxy
        var resp = await fetch(SUPABASE_URL + '/functions/v1/gemini-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
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

        // Parse result
        var rawText = '';
        try { rawText = result.candidates[0].content.parts[0].text; } catch (e) { throw new Error('Invalid response'); }

        var htmlMatch = rawText.match(/```html\s*\n([\s\S]*?)```/);
        var jsonMatch = rawText.match(/```json\s*\n([\s\S]*?)```/);
        var resumeHtml = htmlMatch ? htmlMatch[1].trim() : '';
        var metadata = {};
        if (jsonMatch) { try { metadata = JSON.parse(jsonMatch[1]); } catch (e) { /* ignore */ } }

        var matchScore = metadata.matchScore || 0;
        var applicantName = metadata.applicantName || '';
        var targetCompany = metadata.targetCompany || company;

        // Save generation to database
        if (userId) {
            var headers = {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + token,
                'Prefer': 'return=representation',
            };

            var genResp = await fetch(SUPABASE_URL + '/rest/v1/generations', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    user_id: userId,
                    resume_html: resumeHtml,
                    match_score: matchScore,
                    applicant_name: applicantName,
                    target_company: targetCompany,
                    missing_keywords: metadata.missingKeywords || [],
                    application_status: 'Tailored',
                }),
            });

            var genData = await genResp.json();
            var generation = Array.isArray(genData) ? genData[0] : genData;

            // Link generation to job application
            if (jobAppId && generation && generation.id) {
                await fetch(SUPABASE_URL + '/rest/v1/job_applications?id=eq.' + jobAppId, {
                    method: 'PATCH',
                    headers: headers,
                    body: JSON.stringify({ generation_id: generation.id }),
                });
            }
        }

        showNotification(
            'Resume Tailored!',
            jobTitle + ' at ' + company + ' — ' + matchScore + '% match'
        );
    } catch (e) {
        console.error('[tms-bg] Generation error:', e);
        showNotification('Generation Failed', e.message || 'Please try again.');
    }
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'logo.png',
        title: title,
        message: message,
    });
}

// ---- Initialize badge on install/startup ----

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.get('tms_captures', function (result) {
        var count = (result.tms_captures || []).length;
        if (count > 0) {
            chrome.action.setBadgeText({ text: String(count) });
            chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
        }
    });
});
