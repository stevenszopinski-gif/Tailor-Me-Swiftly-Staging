// results.js — shared utilities for all result pages
// Reads the tms_outputs payload from sessionStorage

const THEME_STORAGE = 'ats_theme_preference';

// ───────────────────────────────────────────────
// TOOL ACCESS TIERS & GATING
// ───────────────────────────────────────────────

const TOOL_TIERS = {
    // Free — always accessible
    'resume':            'free',
    'results':           'free',
    'history':           'free',

    // Premium-only
    'interview-prep':    'premium',
    'salary-negotiator': 'premium',
    'cover-letter':      'premium',
    'pain-letter':       'premium',
    'hook-generator':    'premium',
    'outreach':          'premium',
    'toxic-radar':       'premium',
    'comp-decoder':      'premium',
    'shadow-jobs':       'premium',
    'guerrilla-tactics': 'premium',
    'referral-mapper':   'premium',
    'auto-app':          'premium',
    'thank-you':         'premium',

    // Teaser — 1 free use, then locked
    'ghosting-predictor': 'teaser',
    'linkedin-sync':      'teaser',
    'video-intro':        'teaser',
    'skills-tracker':     'teaser',
    'day-in-life':        'teaser',
    'reverse-interview':  'teaser',
    'rejection-reverser': 'teaser',
    'prove-it':           'teaser',
    'tech-screen':        'teaser',
    'cold-email':         'teaser',
    'career-pivot':       'teaser'
};

function toolSlugFromPage(filenameOrSlug) {
    return (filenameOrSlug || '').replace(/\.html$/, '').replace(/^\//, '');
}

function currentToolSlug() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || '';
    return toolSlugFromPage(filename);
}

const ADMIN_EMAILS = ['stevenszopinski@gmail.com'];

async function checkToolAccess(slug) {
    const tier = TOOL_TIERS[slug] || 'free';
    if (tier === 'free') return { allowed: true };

    const user = await waitForSupabaseAuth();
    if (!user) return { allowed: false, reason: 'not_authenticated' };

    if (ADMIN_EMAILS.includes(user.email)) return { allowed: true };

    const { data: profile } = await window.supabaseClient
        .from('user_profiles')
        .select('plan, tool_usage')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!profile) return { allowed: true };
    if (profile.plan === 'premium') return { allowed: true };

    if (tier === 'premium') return { allowed: false, reason: 'premium' };

    if (tier === 'teaser') {
        const usage = profile.tool_usage || {};
        const count = usage[slug] || 0;
        if (count >= 1) return { allowed: false, reason: 'teaser_exhausted' };
        return { allowed: true };
    }

    return { allowed: true };
}

async function incrementToolUsage(slug) {
    if (!slug) slug = currentToolSlug();
    const user = await waitForSupabaseAuth();
    if (!user) return;

    const { data: profile } = await window.supabaseClient
        .from('user_profiles')
        .select('tool_usage')
        .eq('user_id', user.id)
        .maybeSingle();

    const usage = profile?.tool_usage || {};
    usage[slug] = (usage[slug] || 0) + 1;

    await window.supabaseClient
        .from('user_profiles')
        .update({ tool_usage: usage })
        .eq('user_id', user.id);
}

const TOOL_PREVIEWS = {
    'interview-prep':    { icon: 'fa-comments',       name: 'AI Mock Interview',      desc: '10 tailored questions with AI voice interviewer, real-time scoring, and detailed feedback on your answers.' },
    'salary-negotiator': { icon: 'fa-sack-dollar',     name: 'Salary Negotiator',      desc: 'Practice salary conversations voice-to-voice with an AI HR rep trained on real negotiation tactics.' },
    'cover-letter':      { icon: 'fa-envelope-open-text', name: 'Cover Letter Generator', desc: 'AI-crafted cover letters that weave your experience into a compelling narrative for each specific role.' },
    'pain-letter':       { icon: 'fa-heart-crack',     name: 'Pain Letter',            desc: 'Research the company\'s challenges and generate a letter that shows you understand their pain points.' },
    'hook-generator':    { icon: 'fa-magnet',          name: 'Hook Generator',         desc: 'Attention-grabbing opening lines for cold outreach, cover letters, and LinkedIn messages.' },
    'outreach':          { icon: 'fa-paper-plane',     name: 'Intro Email',            desc: 'Personalized outreach emails with company intel, the right tone, and a clear call to action.' },
    'toxic-radar':       { icon: 'fa-biohazard',       name: 'Toxic Culture Radar',    desc: 'Toxicity score, layoff risk analysis, and Glassdoor sentiment — know before you go.' },
    'comp-decoder':      { icon: 'fa-scale-balanced',  name: 'Comp Decoder',           desc: 'Decode the true value of an offer with cost-of-living adjustments, equity breakdown, and benefits analysis.' },
    'shadow-jobs':       { icon: 'fa-eye',             name: 'Shadow Jobs',            desc: 'Monitor company career pages for early-stage openings before they hit job boards.' },
    'guerrilla-tactics': { icon: 'fa-user-ninja',      name: 'Guerrilla Tactics',      desc: 'Unconventional strategies to bypass ATS filters and get your resume directly to decision makers.' },
    'referral-mapper':   { icon: 'fa-people-arrows',   name: 'Referral Mapper',        desc: 'Find backdoor referral paths into your target company with ready-to-send outreach scripts.' },
    'auto-app':          { icon: 'fa-robot',           name: 'Auto-App Agent',         desc: 'AI scans job boards, finds matching roles, and generates tailored applications automatically.' },
    'thank-you':         { icon: 'fa-envelope-circle-check', name: 'Thank-You Engine', desc: '3 variants of the perfect post-interview follow-up, personalized to your conversation.' },
    'ghosting-predictor':{ icon: 'fa-ghost',           name: 'Ghosting Predictor',     desc: 'Detect ghost jobs and stale listings instantly so you don\'t waste time on dead-end applications.' },
    'linkedin-sync':     { icon: 'fa-linkedin',        name: 'LinkedIn Sync',          desc: 'Pull your LinkedIn profile and auto-populate resume fields for faster tailoring.' },
    'video-intro':       { icon: 'fa-video',           name: 'Video Intro',            desc: '60-second video intro script with built-in teleprompter — make a memorable first impression.' },
    'skills-tracker':    { icon: 'fa-chart-line',      name: 'Skills Tracker',         desc: 'See which of your skills are rising in demand vs decaying, with market trend data.' },
    'day-in-life':       { icon: 'fa-sun',             name: 'Day in the Life',        desc: 'Realistic simulation of a typical day in the role — meetings, tasks, and culture.' },
    'reverse-interview': { icon: 'fa-magnifying-glass-arrow-right', name: 'Reverse Interview', desc: 'Smart, probing questions to ask your interviewer that reveal what it\'s really like inside.' },
    'rejection-reverser':{ icon: 'fa-rotate-left',     name: 'Rejection Reverser',     desc: 'Turn a rejection into a networking opportunity with AI-drafted follow-up messages.' },
    'prove-it':          { icon: 'fa-chart-column',    name: 'Prove It',               desc: 'Transform vague resume bullets into quantified, metric-driven accomplishments.' },
    'tech-screen':       { icon: 'fa-fire',            name: 'Trial By Fire',          desc: 'Custom coding challenges with a built-in IDE, tailored to the exact role you\'re applying for.' },
    'career-pivot':      { icon: 'fa-shuffle',         name: 'Career Pivot Advisor',   desc: 'AI-powered roadmap for switching industries — transferable skills, gap analysis, and action steps.' }
};

function showToolUpgradeModal(reason, slug) {
    document.getElementById('tool-upgrade-modal')?.remove();
    if (!slug) slug = currentToolSlug();

    const isPremiumLock = (reason === 'premium');
    const title = isPremiumLock ? 'Premium Feature' : 'Free Trial Used';
    const preview = TOOL_PREVIEWS[slug];

    // Build tool preview block
    let previewHtml = '';
    if (preview) {
        previewHtml = `
            <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:1rem;margin-bottom:1.25rem;text-align:left;">
                <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
                    <i class="fa-solid ${preview.icon}" style="color:#f59e0b;font-size:1.1rem;"></i>
                    <strong style="color:var(--text-primary);font-size:0.95rem;">${preview.name}</strong>
                </div>
                <p style="color:var(--text-secondary);font-size:0.82rem;line-height:1.55;margin:0;">${preview.desc}</p>
            </div>`;
    }

    // Build highlights list
    const highlights = `
        <div style="text-align:left;margin-bottom:1.25rem;">
            <p style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">Premium includes:</p>
            <div style="display:flex;flex-direction:column;gap:0.3rem;">
                <span style="font-size:0.82rem;color:var(--text-secondary);"><i class="fa-solid fa-check" style="color:#10b981;margin-right:0.4rem;font-size:0.7rem;"></i>Unlimited generations</span>
                <span style="font-size:0.82rem;color:var(--text-secondary);"><i class="fa-solid fa-check" style="color:#10b981;margin-right:0.4rem;font-size:0.7rem;"></i>All 24 AI-powered tools</span>
                <span style="font-size:0.82rem;color:var(--text-secondary);"><i class="fa-solid fa-check" style="color:#10b981;margin-right:0.4rem;font-size:0.7rem;"></i>Voice interviews & negotiation</span>
                <span style="font-size:0.82rem;color:var(--text-secondary);"><i class="fa-solid fa-check" style="color:#10b981;margin-right:0.4rem;font-size:0.7rem;"></i>Company intelligence suite</span>
            </div>
        </div>`;

    const overlay = document.createElement('div');
    overlay.id = 'tool-upgrade-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div style="background:var(--panel-bg);border:1px solid var(--panel-border);border-radius:16px;padding:2rem;max-width:440px;width:90%;text-align:center;">
            <i class="fa-solid fa-crown" style="font-size:2.5rem;color:#f59e0b;margin-bottom:1rem;display:block;"></i>
            <h2 style="margin:0 0 1rem;font-size:1.3rem;color:var(--text-primary);">${title}</h2>
            ${previewHtml}
            ${highlights}
            <button class="btn primary-btn" onclick="toolCreateCheckout()" style="width:100%;margin-bottom:0.75rem;min-height:48px;">
                <i class="fa-solid fa-bolt"></i> Upgrade to Premium — $9.99/mo
            </button>
            <button class="btn ghost-btn" onclick="this.closest('#tool-upgrade-modal').remove();window.location.href='results.html';" style="width:100%;min-height:44px;">
                Back to Dashboard
            </button>
            <a href="pricing.html" style="display:block;margin-top:0.75rem;font-size:0.8rem;color:var(--text-secondary);text-decoration:none;">See full feature comparison &rarr;</a>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function toolCreateCheckout() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) { alert('Please sign in first.'); return; }

    try {
        const { data, error } = await window.supabaseClient.functions.invoke('create-checkout', {
            body: {
                userId: session.user.id,
                email: session.user.email,
                returnUrl: window.location.origin + '/results.html'
            }
        });
        if (error) throw error;
        if (data?.url) window.location.href = data.url;
    } catch (e) {
        console.error('Checkout error:', e);
        alert('Unable to start checkout. Please try again.');
    }
}

async function guardToolAccess(slug) {
    if (!slug) slug = currentToolSlug();
    const result = await checkToolAccess(slug);
    if (!result.allowed) {
        if (result.reason === 'not_authenticated') {
            window.location.href = 'login.html';
            return false;
        }
        showToolUpgradeModal(result.reason, slug);
        return false;
    }
    return true;
}

// ───────────────────────────────────────────────
// GEMINI CALL CACHING (client-side, sessionStorage)
// Transparently intercepts all gemini-proxy calls.
// Cache key = hash of request body (system prompt + user prompt).
// Automatically invalidates when resume/job changes.
// ───────────────────────────────────────────────
function _gemCacheHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h).toString(36);
}

(function initGeminiCache() {
    const poll = setInterval(() => {
        if (!window.supabaseClient?.functions?.invoke || window._gemCacheReady) return;
        window._gemCacheReady = true;
        clearInterval(poll);

        const _invoke = window.supabaseClient.functions.invoke.bind(window.supabaseClient.functions);

        window.supabaseClient.functions.invoke = async function (fn, opts) {
            if (fn !== 'gemini-proxy') return _invoke(fn, opts);

            const body = opts?.body || {};
            // Skip caching if the call already uses server-side caching
            if (body.cacheKey) return _invoke(fn, opts);

            // Build a fingerprint from system prompt + user content (first 300 chars each)
            const sys = (body.systemInstruction?.parts?.[0]?.text || '').slice(0, 300);
            const usr = (body.contents?.[0]?.parts?.[0]?.text || '').slice(0, 300);
            const key = 'tms_gc_' + _gemCacheHash(sys + '|' + usr);

            // Cache check
            try {
                const hit = sessionStorage.getItem(key);
                if (hit) {
                    console.log('[Gemini Cache] HIT', key);
                    return { data: JSON.parse(hit), error: null };
                }
            } catch {}

            // API call
            let res = await _invoke(fn, opts);

            // Auth recovery: if call failed due to expired session,
            // try refreshing the session first, then retry
            const isNon2xx = res.error?.message?.includes('non-2xx');
            const isAuthEdgeError = !res.error && res.data?.error?.status === 'EDGE_ERROR'
                && /unauthorized|expired|auth/i.test(res.data.error.message || '');

            if ((isNon2xx || isAuthEdgeError) && !opts._retried) {
                try {
                    const { data: refreshData } = await window.supabaseClient.auth.refreshSession();
                    if (refreshData?.session) {
                        res = await _invoke(fn, { ...opts, _retried: true });
                    } else {
                        await window.supabaseClient.auth.signOut({ scope: 'local' });
                        res = await _invoke(fn, { ...opts, _retried: true });
                    }
                } catch {}
            }

            // Detect edge function errors returned as 200 (error wrapped in data)
            if (!res.error && res.data?.error?.status === 'EDGE_ERROR') {
                return { data: null, error: { message: res.data.error.message || 'Edge function error' } };
            }
            // Detect Gemini API errors not wrapped as EDGE_ERROR (e.g. model not found)
            if (!res.error && res.data?.error) {
                return { data: null, error: { message: res.data.error.message || 'Gemini API error' } };
            }
            // Validate that the response has usable text content
            if (!res.error && res.data && !res.data.candidates?.[0]?.content?.parts?.[0]) {
                const reason = res.data.promptFeedback?.blockReason || 'No response from Gemini (empty candidates)';
                return { data: null, error: { message: reason } };
            }

            // Cache store on success
            if (!res.error && res.data?.candidates?.[0]) {
                try {
                    sessionStorage.setItem(key, JSON.stringify(res.data));
                    console.log('[Gemini Cache] STORED', key);
                } catch (e) {
                    // sessionStorage full — evict oldest tool caches
                    if (e.name === 'QuotaExceededError') {
                        for (let i = 0; i < sessionStorage.length; i++) {
                            const k = sessionStorage.key(i);
                            if (k?.startsWith('tms_gc_')) { sessionStorage.removeItem(k); break; }
                        }
                        try { sessionStorage.setItem(key, JSON.stringify(res.data)); } catch {}
                    }
                }
            }

            return res;
        };
    }, 50);
})();

function loadOutputs() {
    try {
        const raw = sessionStorage.getItem('tms_outputs');
        if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through */ }
    return null;
}

// Load a generation from the DB and hydrate sessionStorage so pages work normally.
// Returns the outputs object, or null if not found/not authed.
async function loadGenerationFromDb(genId) {
    if (!genId) return null;
    const user = await waitForSupabaseAuth();
    if (!user) return null;
    try {
        const { data, error } = await window.supabaseClient
            .from('generations')
            .select('*')
            .eq('id', genId)
            .eq('user_id', user.id)
            .single();
        if (error || !data) return null;

        const outputs = {
            generationId: data.id,
            resumeHtml: data.resume_html || '',
            resumeText: data.resume_text || '',
            coverHtml: data.cover_letter_html || '',
            jobText: data.job_text || data.job_description || '',
            matchScore: data.match_score || null,
            applicantName: data.applicant_name || '',
            targetCompany: data.target_company || '',
            interviewQa: data.interview_qa || null,
            emailText: data.email_text || '',
            companyPrimaryColor: data.company_primary_color || '#1a1a2e',
            missingKeywords: data.missing_keywords || []
        };

        sessionStorage.setItem('tms_outputs', JSON.stringify(outputs));
        return outputs;
    } catch (e) {
        console.error('loadGenerationFromDb:', e);
        return null;
    }
}

// Resolve the generation ID from URL param or localStorage fallback.
function resolveGenerationId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('gen');
    if (fromUrl) return fromUrl;
    return localStorage.getItem('tms_last_gen_id') || null;
}

// ───────────────────────────────────────────────
// SECTION DRAG & DROP REORDERING
// ───────────────────────────────────────────────
function initDraggableResume(container) {
    if (!container) return;

    // We assume the LLM output is a flat list of block-level elements (divs, headings, ul)
    // or grouped into section divs. We apply draggable to immediate children.
    const sections = container.children;

    for (let el of sections) {
        // Skip small text/br tags
        if (el.tagName === 'BR' || el.tagName === 'HR') continue;

        el.setAttribute('draggable', 'true');
        el.classList.add('draggable-section');

        // Add a subtle drag handle style on hover (handled in CSS usually, but initialized here)
        el.addEventListener('dragstart', (e) => {
            el.classList.add('dragging-section');
            e.dataTransfer.effectAllowed = 'move';
            // Firefox requires dataTransfer data
            e.dataTransfer.setData('text/plain', '');

            // Set a slight delay so the drag image doesn't snap away
            setTimeout(() => el.style.opacity = '0.4', 0);
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging-section');
            el.style.opacity = '1';

            // Remove highlight from all
            for (let c of container.children) {
                c.style.borderTop = '';
                c.style.borderBottom = '';
            }
        });
    }

    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';

        const dragging = container.querySelector('.dragging-section');
        if (!dragging) return;

        const afterElement = getSectionDragAfterElement(container, e.clientY);

        // Visual indicator logic (simple border)
        for (let c of container.children) {
            c.style.borderTop = '';
            c.style.borderBottom = '';
        }

        if (afterElement) {
            afterElement.style.borderTop = '2px solid var(--primary-color)';
        } else {
            // If dropping at the end, highlight bottom of last element
            const last = container.lastElementChild;
            if (last && last !== dragging) last.style.borderBottom = '2px solid var(--primary-color)';
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const dragging = container.querySelector('.dragging-section');
        if (!dragging) return;

        const afterElement = getSectionDragAfterElement(container, e.clientY);

        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }

        // Cleanup visuals
        for (let c of container.children) {
            c.style.borderTop = '';
            c.style.borderBottom = '';
        }
    });
}

function getSectionDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-section:not(.dragging-section)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // Mouse position relative to center of element
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function initResultTheme() {
    const saved = localStorage.getItem(THEME_STORAGE) || 'light';
    document.body.setAttribute('data-theme', saved);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.innerHTML = saved === 'dark'
            ? '<i class="fa-solid fa-moon"></i> Theme'
            : '<i class="fa-solid fa-sun"></i> Theme';
        btn.addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem(THEME_STORAGE, next);
            btn.innerHTML = next === 'dark'
                ? '<i class="fa-solid fa-moon"></i> Theme'
                : '<i class="fa-solid fa-sun"></i> Theme';
        });
    });
}

function showSessionExpired(container) {
    // Try to restore from the generations DB before showing expired
    const genId = resolveGenerationId();
    if (genId) {
        container.innerHTML = `
            <div style="text-align:center;padding:4rem 2rem;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--primary-color);margin-bottom:1rem;display:block;"></i>
                <p style="color:var(--text-secondary);">Restoring your previous session...</p>
            </div>`;
        loadGenerationFromDb(genId).then(outputs => {
            if (outputs) {
                // Data restored to sessionStorage — reload page so it picks up the data
                location.reload();
            } else {
                _renderExpired(container);
            }
        }).catch(() => _renderExpired(container));
        return;
    }
    _renderExpired(container);
}

function _renderExpired(container) {
    container.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;color:var(--accent-color);margin-bottom:1rem;display:block;"></i>
            <h2 style="margin-bottom:0.75rem;">Session Expired</h2>
            <p style="color:var(--text-secondary);margin-bottom:1.5rem;">Your generated content is no longer available. Please generate a new application.</p>
            <a href="app.html" class="btn primary-btn"><i class="fa-solid fa-arrow-left"></i> Back to App</a>
        </div>`;
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btn.style.color = 'var(--success-color)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
    });
}

function downloadAsPDF(el, filename) {
    const opt = {
        margin: [10, 6],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
    };
    el.classList.add('pdf-rendering');
    html2pdf().set(opt).from(el).save().then(() => el.classList.remove('pdf-rendering'));
}

// ───────────────────────────────────────────────
// SUPABASE PERSISTENCE (generations table)
// ───────────────────────────────────────────────
async function waitForSupabaseAuth() {
    // Wait for client
    if (!window.supabaseClient) {
        await new Promise(resolve => {
            let tries = 0;
            const poll = setInterval(() => {
                if (window.supabaseClient || ++tries > 50) { clearInterval(poll); resolve(); }
            }, 100);
        });
        if (!window.supabaseClient) return null;
    }
    // Wait for session to be restored
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) return session.user;
    // Session may still be loading — wait for auth state change
    return new Promise(resolve => {
        const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange((event, sess) => {
            subscription.unsubscribe();
            resolve(sess?.user || null);
        });
        setTimeout(() => { subscription.unsubscribe(); resolve(null); }, 3000);
    });
}

async function saveGenerationToSupabase(outputs) {
    const user = await waitForSupabaseAuth();
    if (!user) return null;
    try {

        const row = {
            user_id: user.id,
            job_description: outputs.jobText || null,
            resume_html: outputs.resumeHtml || null,
            cover_letter_html: outputs.coverHtml || null,
            match_score: outputs.matchScore || null,
            applicant_name: outputs.applicantName || null,
            target_company: outputs.targetCompany || null,
            interview_qa: outputs.interviewQa || null,
            email_text: outputs.emailText || null,
            resume_text: outputs.resumeText || null,
            job_text: outputs.jobText || null,
            company_primary_color: outputs.companyPrimaryColor || '#1a1a2e',
            missing_keywords: outputs.missingKeywords || []
        };

        // If we already have an ID, update the existing row
        if (outputs.generationId) {
            row.id = outputs.generationId;
        }

        const { data, error } = await window.supabaseClient
            .from('generations')
            .upsert(row, { onConflict: 'id' })
            .select()
            .single();

        if (error) { console.error('Save generation error:', error); return null; }

        if (data) {
            if (!outputs.generationId) {
                outputs.generationId = data.id;
                sessionStorage.setItem('tms_outputs', JSON.stringify(outputs));
            }
            // Persist gen ID in localStorage so it survives browser restarts
            localStorage.setItem('tms_last_gen_id', data.id);
        }
        return data;
    } catch (e) {
        console.error('saveGenerationToSupabase:', e);
        return null;
    }
}

async function updateGenerationField(generationId, fields) {
    if (!generationId) return;
    const user = await waitForSupabaseAuth();
    if (!user) return;
    try {
        await window.supabaseClient
            .from('generations')
            .update(fields)
            .eq('id', generationId);
    } catch (e) {
        console.error('updateGenerationField:', e);
    }
}

// Shared auth header update (show user avatar if logged in)
async function initResultAuth() {
    if (!window.supabaseClient) {
        // Poll until client is ready (up to 5s)
        let tries = 0;
        await new Promise(resolve => {
            const poll = setInterval(() => {
                if (window.supabaseClient || ++tries > 50) { clearInterval(poll); resolve(); }
            }, 100);
        });
        if (!window.supabaseClient) return;
    }
    const { data: { session } } = await supabaseClient.auth.getSession();
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const loginBtn = document.getElementById('login-btn');
    if (session) {
        if (userProfile) userProfile.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userAvatar) userAvatar.src = session.user.user_metadata?.avatar_url
            || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(session.user.email)}`;
        const greeting = document.getElementById('user-greeting');
        if (greeting) {
            const firstName = (session.user.user_metadata?.full_name || session.user.email || '').split(/[\s@]/)[0];
            greeting.textContent = `Hi, ${firstName}`;
        }
    }
}
