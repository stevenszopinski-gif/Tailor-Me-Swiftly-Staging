const THEME_STORAGE = 'ats_theme_preference';
const API_STORAGE = 'ats_api_config';
const PREFS_STORAGE = 'ats_user_writing_preferences';

// Supabase edge function URL for fetching job descriptions
const SUPABASE_FETCH_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co/functions/v1/fetch-url';
const SUPABASE_ANON_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';

// Timeout utility for API calls
function withTimeout(promise, ms = 60000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
        )
    ]);
}

// AI Guide Feature
window.applyGuideMod = function (instruction) {
    const prefsInput = document.getElementById('user-prefs-input');
    const existing = prefsInput.value.trim();
    if (existing) {
        prefsInput.value = existing + '\n- ' + instruction;
    } else {
        prefsInput.value = '- ' + instruction;
    }

    // Save to local storage automatically
    localStorage.setItem('ats_user_writing_preferences', prefsInput.value);

    // Show feedback
    const feedback = document.getElementById('ai-guide-feedback');
    if (feedback) {
        feedback.style.display = 'block';
        setTimeout(() => { feedback.style.display = 'none'; }, 3000);
    }

    // Auto-minimize after click
    setTimeout(() => {
        const body = document.getElementById('ai-guide-body');
        if (body) body.classList.add('hidden');
    }, 1000);
};

let el = {};

function initDOMReferences() {
    el = {
        // Navigation
        steps: document.querySelectorAll('.wizard-step'),
        stepIndicators: document.querySelectorAll('.step'),
        nextTo2Btn: document.getElementById('next-to-2'),
        nextTo3Btn: document.getElementById('next-to-3'),
        backTo1Btn: document.getElementById('back-to-1'),
        startOverBtn: document.getElementById('start-over'),

        // Theme
        themeToggleBtn: document.getElementById('theme-toggle'),

        // Step 1: File & LinkedIn
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        fileStatus: document.getElementById('file-status'),
        fileName: document.getElementById('file-name'),
        parseStatus: document.getElementById('parse-status'),
        baseResumeRaw: document.getElementById('base-resume'),

        // Step 2: URL
        jobUrlInput: document.getElementById('job-url'),
        urlStatus: document.getElementById('url-status'),
        jobDescRaw: document.getElementById('job-description'),

        // Step 3: Gaps Assistant
        strategyCards: document.querySelectorAll('.strategy-card'),
        nextTo4Btn: document.getElementById('next-to-4'),
        backTo2Btn: document.getElementById('back-to-2'),
        missingSkillsContainer: document.getElementById('missing-skills-container'),
        missingSkillsLoading: document.getElementById('missing-skills-loading'),
        missingSkillsList: document.getElementById('missing-skills-list'),
        missingSkillsError: document.getElementById('missing-skills-error'),

        // Step 4: Loading / Generation
        generationControl: document.getElementById('generation-control'),
        resultsView: document.getElementById('results-view'),
        loadingOverlay: document.getElementById('loading-overlay'),
        genStatus: document.getElementById('generation-status'),
        refinePrompt: document.getElementById('refine-prompt'),
        refineBtn: document.getElementById('refine-btn'),

        // Preferences
        prefsModal: document.getElementById('prefs-modal'),
        openPrefsBtn: document.getElementById('open-prefs'),
        closePrefsBtn: document.getElementById('close-prefs'),
        savePrefsBtn: document.getElementById('save-prefs'),
        prefsInput: document.getElementById('user-prefs-input'),

        // Auth UI
        loginBtn: document.getElementById('login-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        userProfile: document.getElementById('user-profile'),
        userAvatar: document.getElementById('user-avatar'),

        // Template Switcher
        templateBtns: document.querySelectorAll('.template-btn'),
        resumeWrapper: document.getElementById('resume-output'),

        // Chat / Refinement
        chatMessages: document.getElementById('chat-messages'),

        // New Features
        genInterviewBtn: document.getElementById('gen-interview-btn'),
        interviewOutput: document.getElementById('interview-output'),
        genEmailBtn: document.getElementById('gen-email-btn'),
        emailOut: document.getElementById('email-output'),
        linkedinBtn: document.getElementById('linkedin-btn'),
        linkedinModal: document.getElementById('linkedin-modal'),
        closeLinkedinBtn: document.getElementById('close-linkedin'),
        linkedinOutput: document.getElementById('linkedin-output'),
        copyLinkedinBtn: document.getElementById('copy-linkedin-btn'),
        shareBtn: document.getElementById('share-btn'),
        shareToast: document.getElementById('share-toast'),
        resumeWordCount: document.getElementById('resume-word-count'),
        resumePageEst: document.getElementById('resume-page-est'),
        coverWordCount: document.getElementById('cover-word-count'),
        coverPageEst: document.getElementById('cover-page-est')
    };
}

let state = {
    currentStep: 1,
    model: 'gemini-3-flash-preview',
    theme: localStorage.getItem(THEME_STORAGE) || 'dark',
    resumeText: '',
    jobText: '',
    applicantName: '',
    targetCompany: '',
    userPreferences: localStorage.getItem(PREFS_STORAGE) || '',
    chatHistory: [], // [{role: 'user', content: '...'}, {role: 'model', content: '...'}]
    lastMissingSkillsKey: '',
    selectedMissingSkills: []
};

// Initialize
function init() {
    initDOMReferences();
    document.body.setAttribute('data-theme', state.theme);
    updateThemeIcon(state.theme);
    attachEventListeners();

    // Initial check to sync buttons
    window.checkStep1();
    window.checkStep2();

    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            updateWelcomeMessage(session.user);
        }
    });

    // Use Last Resume banner
    const lastResume = (() => { try { return JSON.parse(localStorage.getItem('tms_last_resume')); } catch (e) { return null; } })();
    if (lastResume && lastResume.text) {
        const bar = document.getElementById('use-last-resume-bar');
        const nameEl = document.getElementById('last-resume-name');
        if (bar && nameEl) {
            nameEl.textContent = lastResume.name || 'Previous Resume';
            bar.style.display = 'block';
            document.getElementById('use-last-resume-btn')?.addEventListener('click', () => {
                state.resumeText = lastResume.text;
                el.baseResumeRaw.value = lastResume.text;
                if (el.parseStatus) el.parseStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Loaded';
                if (el.fileName) el.fileName.textContent = lastResume.name || 'Previous Resume';
                if (el.fileStatus) el.fileStatus.classList.remove('hidden');
                bar.style.display = 'none';
                checkStep1();
            });
        }
    }
}

function loadSettings() {
    // Set initial theme
    document.body.setAttribute('data-theme', state.theme);
    updateThemeIcon(state.theme);
}

function updateThemeIcon(theme) {
    if (el.themeToggleBtn) el.themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i> Theme' : '<i class="fa-solid fa-sun"></i> Theme';
}

function attachEventListeners() {
    // Nav (Tool Only) — each button guarded independently
    if (el.nextTo2Btn) el.nextTo2Btn.addEventListener('click', () => {
        if (state.resumeText.trim()) goToStep(2);
    });
    if (el.nextTo3Btn) el.nextTo3Btn.addEventListener('click', () => {
        if (state.jobText.trim()) goToStep(3);
    });
    if (el.nextTo4Btn) el.nextTo4Btn.addEventListener('click', () => {
        goToStep(4);
        processGeneration();
    });
    if (el.backTo1Btn) el.backTo1Btn.addEventListener('click', () => goToStep(1));
    if (el.backTo2Btn) el.backTo2Btn.addEventListener('click', () => goToStep(2));
    if (el.startOverBtn) el.startOverBtn.addEventListener('click', () => {
        state.resumeText = '';
        state.jobText = '';
        if (el.fileStatus) el.fileStatus.classList.add('hidden');
        if (el.baseResumeRaw) el.baseResumeRaw.value = '';
        if (el.jobUrlInput) el.jobUrlInput.value = '';
        if (el.jobDescRaw) el.jobDescRaw.value = '';
        if (el.urlStatus) el.urlStatus.innerHTML = '';
        if (el.generationControl) el.generationControl.classList.remove('hidden');
        window.checkStep1(); window.checkStep2();
        goToStep(1);
    });



    // File Upload Handlers (Drag & Drop) - Tool Only
    if (el.dropZone) {
        el.dropZone.addEventListener('click', (e) => {
            if (!e.target.closest('button') && e.target !== el.fileInput) {
                el.fileInput.click();
            }
        });
        el.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.dropZone.classList.add('dragover');
        });
        el.dropZone.addEventListener('dragleave', () => el.dropZone.classList.remove('dragover'));
        el.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            el.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
        el.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
            // Reset so re-selecting the same file still triggers change
            e.target.value = '';
        });

        const manualResume = document.getElementById('manual-resume-input');
        if (manualResume) {
            manualResume.addEventListener('input', () => {
                state.resumeText = manualResume.value;
                checkStep1();
            });
        }
    }

    // Template Switcher (Phase 3)
    if (el.templateBtns) {
        el.templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');

                // Toggle active class on buttons
                el.templateBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Apply theme to resume
                applyTemplateTheme(theme);
            });
        });
    }

    // URL Fetcher - Tool Only
    if (el.jobDescRaw) {
        el.jobDescRaw.addEventListener('input', checkStep2);
        if (el.jobUrlInput) el.jobUrlInput.addEventListener('input', (e) => {
            if (!el.jobUrlInput.value) {
                if (el.urlStatus) el.urlStatus.innerHTML = '';
            } else if (e.target.value.startsWith('http')) {
                fetchJobDescription();
            }
        });
    }

    // Output Tabs & Copy/Download
    if (el.tabs) el.tabs.forEach(btn => btn.addEventListener('click', handleTabSwitch));
    if (el.copyBtns) el.copyBtns.forEach(btn => btn.addEventListener('click', handleCopy));
    document.querySelectorAll('.download-btn').forEach(btn => btn.addEventListener('click', handleDownloadPDF));

    // Generation & Refine
    if (el.refineBtn) el.refineBtn.addEventListener('click', processRefinement);

    // New Feature: Interview Prep
    if (el.genInterviewBtn) el.genInterviewBtn.addEventListener('click', generateInterviewQuestions);

    // New Feature: Introduction Email
    if (el.genEmailBtn) el.genEmailBtn.addEventListener('click', generateEmailDraft);

    // New Feature: LinkedIn About
    if (el.linkedinBtn) {
        el.linkedinBtn.addEventListener('click', () => {
            if (el.linkedinModal) el.linkedinModal.classList.add('visible');
            generateLinkedInAbout();
        });
        if (el.closeLinkedinBtn) el.closeLinkedinBtn.addEventListener('click', () => el.linkedinModal.classList.remove('visible'));
        if (el.copyLinkedinBtn) el.copyLinkedinBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(el.linkedinOutput.innerText || el.linkedinOutput.textContent);
            el.copyLinkedinBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { el.copyLinkedinBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy to Clipboard'; }, 2000);
        });
    }

    // New Feature: Share via Link
    if (el.shareBtn) el.shareBtn.addEventListener('click', handleShare);

    // New Feature: Word Count Live Observer
    initWordCountObserver();

    // Preferences
    if (el.openPrefsBtn) {
        el.openPrefsBtn.addEventListener('click', () => {
            if (el.prefsInput) el.prefsInput.value = state.userPreferences;
            if (el.prefsModal) el.prefsModal.style.display = 'block';
        });
        if (el.closePrefsBtn) el.closePrefsBtn.addEventListener('click', () => el.prefsModal.style.display = 'none');
        if (el.savePrefsBtn) el.savePrefsBtn.addEventListener('click', handleSavePreferences);
    }

    // Close modals and dropdowns on outside click
    window.addEventListener('click', (e) => {
        if (el.prefsModal && e.target === el.prefsModal) el.prefsModal.style.display = 'none';
        if (el.linkedinModal && e.target === el.linkedinModal) el.linkedinModal.classList.remove('visible');

        // Close avatar dropdown when clicking outside
        const dropdown = document.getElementById('avatar-dropdown');
        const avatar = document.getElementById('user-avatar');
        if (dropdown && !dropdown.contains(e.target) && e.target !== avatar) {
            dropdown.classList.add('hidden');
        }
    });
}

// ------ WIZARD NAVIGATION ------
function goToStep(num) {
    state.currentStep = num;

    // UI steps
    if (el.steps) {
        el.steps.forEach((s, idx) => {
            s.classList.toggle('active-step', idx + 1 === num);
        });
    }

    // UI indicators
    if (el.stepIndicators) {
        el.stepIndicators.forEach((ind, idx) => {
            ind.classList.toggle('active', idx + 1 <= num);
        });
    }

    // Trigger missing skills extraction on step 3
    if (num === 3) {
        extractMissingSkills();
    }
}

// ------ STEP 1: PARSING FILES ------
async function handleFile(file) {
    console.log("handleFile triggered with:", file.name);
    if (el.fileName) el.fileName.textContent = file.name;
    if (el.fileStatus) el.fileStatus.classList.remove('hidden');
    if (el.parseStatus) {
        el.parseStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing...';
        el.parseStatus.className = 'parse-status';
    }

    try {
        let text = '';
        const ext = file.name.split('.').pop().toLowerCase();
        console.log("File extension:", ext);

        if (ext === 'pdf') {
            text = await extractTextFromPDF(file);
        } else if (ext === 'docx') {
            text = await extractTextFromDOCX(file);
        } else if (ext === 'txt') {
            text = await file.text();
        } else {
            throw new Error('Unsupported format. Use PDF, DOCX, or TXT.');
        }

        console.log("Extracted text length:", text.length);
        if (!text.trim()) throw new Error('No text found in file.');

        state.resumeText = text;
        if (el.baseResumeRaw) el.baseResumeRaw.value = text;
        // Persist for 'Use Last Resume' feature
        try { localStorage.setItem('tms_last_resume', JSON.stringify({ text, name: file.name })); } catch (e) { }

        if (el.parseStatus) {
            el.parseStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Extracted Successfully';
            el.parseStatus.className = 'parse-status success-text';
        }
        checkStep1();

    } catch (err) {
        console.error("handleFile Error:", err);
        if (el.parseStatus) {
            el.parseStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message}`;
            el.parseStatus.className = 'parse-status error-text';
        }
        state.resumeText = '';
        checkStep1();
    }
}

// ------ LinkedIn Support ------
// ------ Generic Resilience Helper ------
async function fetchWithFallback(targetUrl) {
    const session = window.supabaseClient ? (await window.supabaseClient.auth.getSession()).data.session : null;
    const token = session?.access_token || SUPABASE_ANON_KEY;

    const resp = await fetch(SUPABASE_FETCH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ url: targetUrl })
    });

    const data = await resp.json();

    if (!resp.ok) {
        throw new Error(data.error || `Fetch failed (${resp.status})`);
    }

    // LinkedIn or other soft errors (returned as 200 with error field)
    if (data.error) {
        throw new Error(data.error);
    }

    return data;
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        text += strings.join(' ') + '\n';
    }
    return text;
}

async function extractTextFromDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

// Make validation functions global for auth.js access
function checkStep1() {
    const btn = document.getElementById('next-to-2');
    console.log("checkStep1 called. Resume text length:", state.resumeText.length);
    if (btn) {
        btn.disabled = !state.resumeText.trim();
        console.log("Button disabled state:", btn.disabled);
    } else {
        console.log("Could not find next-to-2 button");
    }
}
window.checkStep1 = checkStep1;

function checkStep2() {
    if (el.jobDescRaw) state.jobText = el.jobDescRaw.value.trim();
    const btn = document.getElementById('next-to-3');
    if (btn) btn.disabled = !state.jobText.trim();
}
window.checkStep2 = checkStep2;

async function fetchJobDescription() {
    const url = el.jobUrlInput.value.trim();
    if (!url) return;

    el.urlStatus.innerHTML = '<span style="color:var(--text-secondary)"><i class="fa-solid fa-spinner fa-spin"></i> Fetching from proxied source...</span>';

    try {
        const data = await fetchWithFallback(url);

        // Structured response (Greenhouse, Lever, Workday, JSON-LD)
        if (data.structured && data.text) {
            el.jobDescRaw.value = data.text;
            const extras = [data.title, data.company].filter(Boolean).join(' at ');
            const label = extras ? `Extracted: ${extras}` : 'Extracted structured job data';
            el.urlStatus.innerHTML = `<span class="success-text"><i class="fa-solid fa-check"></i> ${label}. Review below.</span>`;
            checkStep2();
            return;
        }

        // Fallback: raw HTML
        if (data.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.html, 'text/html');
            doc.querySelectorAll('script, style, nav, header, footer').forEach(e => e.remove());
            const text = doc.body.textContent || "";
            const cleanText = text.replace(/\s+/g, ' ').trim();

            if (cleanText.length > 50) {
                el.jobDescRaw.value = cleanText;
                el.urlStatus.innerHTML = '<span class="success-text"><i class="fa-solid fa-check"></i> Scraped successfully. Review raw text below.</span>';
                checkStep2();
            } else {
                throw new Error("Page loaded but no readable text was found.");
            }
        } else {
            throw new Error("Proxy failed to fetch the URL.");
        }
    } catch (err) {
        el.urlStatus.innerHTML = `<span class="error-text"><i class="fa-solid fa-xmark"></i> ${err.message}. Please paste the text manually below.</span>`;
    }
}

// ------ OUTPUT TABS & UTILS ------
function handleTabSwitch(e) {
    const target = e.target.dataset.tab;
    el.tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');

    el.panes.forEach(p => {
        p.classList.toggle('active', p.id === target);
    });
}

function handleCopy(e) {
    const btn = e.target.closest('button');
    const targetId = btn.dataset.target;
    // We now have a div with innerHTML/innerText
    const targetEl = document.getElementById(targetId);
    const txt = targetEl.innerText || targetEl.textContent;

    if (txt) {
        navigator.clipboard.writeText(txt).then(() => {
            const temp = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            btn.style.color = 'var(--success-color)';
            setTimeout(() => {
                btn.innerHTML = temp;
                btn.style.color = '';
            }, 2000);
        });
    }
}

function handleDownloadPDF(e) {
    const btn = e.target.closest('button');
    const targetId = btn.dataset.target;
    const targetEl = document.getElementById(targetId);

    if (!targetEl.innerHTML.trim()) return;

    // Generate dynamic filename
    const dateStr = new Date().toISOString().split('T')[0];
    const nameStr = state.applicantName ? state.applicantName.replace(/\s+/g, '_') : 'Applicant';
    const compStr = state.targetCompany ? state.targetCompany.replace(/\s+/g, '_') : 'Company';
    const docType = targetId === 'resume-output' ? 'Resume' : 'Cover_Letter';

    const dynamicFilename = `${nameStr}_${compStr}_${docType}_${dateStr}.pdf`;

    const opt = {
        margin: [12.7, 12.7], // 0.5 inch margins
        filename: dynamicFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
    };

    // Temporarily hide the placeholder or uneditable styles for PDF
    targetEl.classList.add('pdf-rendering');
    html2pdf().set(opt).from(targetEl).save().then(() => {
        targetEl.classList.remove('pdf-rendering');
    });
}
// ------ DID YOU KNOW? LOADING FACTS ------
const LOADING_QUOTES = [
    "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
    "Octopuses have three hearts and blue blood.",
    "A group of flamingos is called a 'flamboyance'.",
    "Bananas are technically berries, but strawberries aren't.",
    "The inventor of the Pringles can is buried in one.",
    "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
    "Wombat poop is cube-shaped so it doesn't roll away.",
    "The shortest war in history lasted 38 minutes — between Britain and Zanzibar in 1896.",
    "A jiffy is an actual unit of time — 1/100th of a second.",
    "Cows have best friends and get stressed when separated.",
    "The average person walks about 100,000 miles in a lifetime — that's circling the Earth 4 times.",
    "Sea otters hold hands while sleeping so they don't drift apart.",
    "The total weight of all ants on Earth roughly equals the total weight of all humans.",
    "Venus is the only planet that spins clockwise.",
    "A bolt of lightning is five times hotter than the surface of the sun.",
    "Scotland's national animal is the unicorn.",
    "The average cloud weighs about 1.1 million pounds.",
    "Sharks are older than trees. Sharks have been around for 400 million years, trees for 350 million.",
    "An astronaut's footprint on the Moon could last for 100 million years.",
    "The human nose can detect over 1 trillion different scents.",
    "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
    "Oxford University is older than the Aztec Empire.",
    "A day on Venus is longer than a year on Venus.",
    "There are more stars in the universe than grains of sand on all of Earth's beaches.",
    "Butterflies taste with their feet.",
    "The Eiffel Tower can grow up to 6 inches taller in summer due to thermal expansion of the iron.",
    "A single strand of spaghetti is called a 'spaghetto'.",
    "Humans share about 60% of their DNA with bananas.",
    "The heart of a blue whale is so large a small child could swim through its arteries.",
    "Nintendo was founded in 1889 as a playing card company.",
    "There are more trees on Earth than stars in the Milky Way.",
    "Glaciers and ice sheets hold about 69% of the world's freshwater.",
    "The dot over the letters 'i' and 'j' is called a 'tittle'.",
    "It rains diamonds on Saturn and Jupiter.",
    "A sneeze travels at about 100 miles per hour.",
    "The longest English word without a vowel is 'rhythms'.",
    "Koalas sleep up to 22 hours a day.",
    "The Great Wall of China is not actually visible from space with the naked eye.",
    "Peanuts are not nuts — they're legumes.",
    "A photon of light takes about 8 minutes to travel from the Sun to Earth.",
    "The average human body contains enough iron to make a 3-inch nail.",
    "Pigeons can do math. They can learn abstract numerical rules.",
    "Greenland sharks can live for over 400 years.",
    "The strongest muscle in the human body, relative to its size, is the tongue.",
    "A cockroach can live for a week without its head before dying of dehydration.",
    "The surface area of Russia is larger than the surface area of Pluto.",
    "An ostrich's eye is bigger than its brain.",
    "If you fold a piece of paper 42 times, it would reach the Moon.",
    "There are more possible moves in a game of Go than atoms in the visible universe.",
    "The inventor of the fire hydrant is unknown because the patent was destroyed in a fire.",
    "Hot water freezes faster than cold water — this is called the Mpemba effect.",
    "Sloths can hold their breath longer than dolphins — up to 40 minutes.",
    "The average cumulonimbus cloud weighs about 1.1 million pounds.",
    "Astronauts grow up to 2 inches taller in space because of reduced gravity on the spine.",
    "A newborn kangaroo is about the size of a lima bean.",
    "The fingerprints of koalas are virtually indistinguishable from human fingerprints.",
    "There are more bacteria in your mouth than there are people on Earth.",
    "Dolphins have names for each other and respond when called.",
    "The speed of a computer mouse is measured in 'Mickeys'.",
    "Honey bees can recognize human faces.",
    "A teaspoon of neutron star material weighs about 6 billion tons.",
    "The longest hiccuping spree lasted 68 years.",
    "Alaska is simultaneously the most northern, western, and eastern state in the U.S.",
    "Avocados are poisonous to birds.",
    "Babies have about 300 bones, but adults only have 206 — many fuse together as you grow.",
    "Vending machines are statistically more dangerous than sharks.",
    "The inventor of the microwave oven received only $2 for his discovery.",
    "Crows can remember human faces and hold grudges.",
    "The average person produces enough saliva in a lifetime to fill two swimming pools.",
    "A group of porcupines is called a 'prickle'.",
    "Maple syrup was once used as a medicine.",
    "Saturn would float in water because its density is lower than water's.",
    "There are about 10 quintillion insects alive on Earth at any given time.",
    "The color orange was named after the fruit, not the other way around.",
    "A hummingbird's heart beats over 1,200 times per minute.",
    "The chance of being dealt a royal flush in poker is 1 in 649,740.",
    "There's a basketball court on the top floor of the U.S. Supreme Court building.",
    "Cats have over 20 vocalizations, including the meow, which is mostly used to communicate with humans.",
    "The Amazon rainforest produces about 20% of the world's oxygen.",
    "Elephants are the only animals that can't jump.",
    "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
    "The longest place name in the world is 85 letters long and is in New Zealand.",
    "A single Google search uses about the same amount of energy it takes to turn on a 60W light bulb for 17 seconds.",
    "Polar bear fur is not white — it's transparent. It only appears white because it reflects light.",
    "Humans and giraffes have the same number of neck vertebrae: seven.",
    "The world's oldest known joke is a Sumerian fart joke from 1900 BC.",
    "Octopuses have a separate brain in each of their eight arms.",
    "You can hear a blue whale's heartbeat from over 2 miles away.",
    "Pluto hasn't completed a full orbit around the Sun since it was discovered in 1930.",
    "A group of owls is called a 'parliament'.",
    "Water can boil and freeze at the same time — it's called the 'triple point'.",
    "The total length of all the blood vessels in the human body is about 60,000 miles.",
    "Approximately 7% of all humans who have ever lived are alive today.",
    "A single lightning bolt can heat the surrounding air to about 30,000 Kelvin — five times hotter than the Sun's surface.",
    "A colony of bats can eat over 1 million mosquitoes per hour.",
    "The Hawaiian alphabet has only 13 letters.",
    "Your body produces about 25 million new cells each second.",
    "The longest recorded flight of a chicken is 13 seconds.",
    "There are more possible arrangements of a deck of cards than atoms on Earth.",
    "A day on Mercury lasts about 59 Earth days.",
    "Rats laugh when they're tickled."
];

let quoteInterval;
let quoteIndex = 0;
function startFunnyQuotes() {
    const elQuote = document.getElementById('funny-quote');
    if (!elQuote) return;

    // Shuffle the array for each loading session
    const shuffled = [...LOADING_QUOTES].sort(() => Math.random() - 0.5);
    quoteIndex = 0;

    const showQuote = () => {
        elQuote.style.opacity = '0';
        setTimeout(() => {
            elQuote.textContent = shuffled[quoteIndex % shuffled.length];
            elQuote.style.opacity = '1';
            quoteIndex++;
        }, 500);
    };

    showQuote();
    quoteInterval = setInterval(showQuote, 5000);
}

function stopFunnyQuotes() {
    clearInterval(quoteInterval);
}

// ------ API GENERATION ------
async function checkGenerationLimit() {
    if (!window.supabaseClient) return true; // allow if not signed in (anon usage)
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return true;

    const { data: profile } = await window.supabaseClient
        .from('user_profiles')
        .select('plan, generation_count, generation_reset_at')
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (!profile) return true; // no profile row yet — allow

    // Premium users: unlimited
    if (profile.plan === 'premium') return true;

    // Monthly reset check
    const resetAt = new Date(profile.generation_reset_at);
    const now = new Date();
    const monthDiff = (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());
    if (monthDiff >= 1) {
        await window.supabaseClient.from('user_profiles')
            .update({ generation_count: 0, generation_reset_at: now.toISOString() })
            .eq('user_id', session.user.id);
        return true;
    }

    // Free tier: 5 generations/month
    if (profile.generation_count >= 5) return false;
    return true;
}

async function incrementGenerationCount() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    // Read current count, increment, write back
    const { data: profile } = await window.supabaseClient
        .from('user_profiles')
        .select('generation_count')
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (profile) {
        await window.supabaseClient.from('user_profiles')
            .update({ generation_count: (profile.generation_count || 0) + 1 })
            .eq('user_id', session.user.id);
    }
}

function showUpgradeModal() {
    // Remove existing modal if any
    document.getElementById('upgrade-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgrade-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div style="background:var(--panel-bg);border:1px solid var(--panel-border);border-radius:16px;padding:2rem;max-width:420px;width:90%;text-align:center;">
            <i class="fa-solid fa-crown" style="font-size:2.5rem;color:#f59e0b;margin-bottom:1rem;display:block;"></i>
            <h2 style="margin:0 0 0.75rem;font-size:1.3rem;color:var(--text-primary);">Free Limit Reached</h2>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.5rem;line-height:1.6;">
                You've used your 5 free generations this month.<br>
                Upgrade to Premium for <strong>unlimited</strong> generations.
            </p>
            <button class="btn primary-btn" onclick="createCheckout()" style="width:100%;margin-bottom:0.75rem;min-height:48px;">
                <i class="fa-solid fa-bolt"></i> Upgrade to Premium
            </button>
            <button class="btn ghost-btn" onclick="this.closest('#upgrade-modal-overlay').remove()" style="width:100%;min-height:44px;">
                Maybe Later
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function createCheckout() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) { alert('Please sign in first.'); return; }

    try {
        const { data, error } = await window.supabaseClient.functions.invoke('create-checkout', {
            body: {
                userId: session.user.id,
                email: session.user.email,
                returnUrl: window.location.origin + '/app.html'
            }
        });
        if (error) throw error;
        if (data?.url) window.location.href = data.url;
    } catch (e) {
        console.error('Checkout error:', e);
        alert('Unable to start checkout. Please try again.');
    }
}

async function processGeneration() {
    // Generation limit gate
    const allowed = await checkGenerationLimit();
    if (!allowed) {
        showUpgradeModal();
        return;
    }

    el.generationControl.classList.add('hidden');
    if (el.loadingOverlay) {
        el.loadingOverlay.classList.remove('hidden');
        const title = document.getElementById('loading-title');
        const estimate = document.getElementById('loading-estimate');
        if (title) title.textContent = "";
        if (estimate) estimate.textContent = "This takes about 10-15 seconds. High-quality AI takes time!";
        startFunnyQuotes();
    }

    const extraSkillsStr = state.selectedMissingSkills.length > 0
        ? `\n    CRITICAL MISSING SKILLS TO WEAVE IN: The user possesses the following skills not explicitly in their resume, but needed for this job. WEAVE THEM NATURALLY into the bullet points: ${state.selectedMissingSkills.join(', ')}\n`
        : '';

    const systemPrompt = `You are an elite Executive Career Coach and Expert ATS Resume Writer.

    STRATEGIC DIRECTION TO FOLLOW: ${state.userPreferences || "General enhancement"}
    ${extraSkillsStr}
    Generate ALL of the following in a single response:

BLOCK 1 — Resume HTML:
- Rewrite the resume to match the job description with strong ATS-optimized keywords.
- Every bullet starts with an action verb. Preserve all metrics.
- Clean semantic HTML only (h1, h2, ul, li, strong). No full HTML document wrapper.

BLOCK 2 — Metadata JSON:
- {"applicantName": string, "targetCompany": string, "matchScore": number (0-100), "missingKeywords": [string], "companyPrimaryColor": string (hex code of the target company's main brand color, default to #1a1a2e if unknown)}

${state.userPreferences ? `USER PREFERENCES (STRICTLY FOLLOW):\n${state.userPreferences}\n` : ''}

OUTPUT FORMAT: Exactly 2 fenced code blocks in order. NO other text.
\`\`\`html  ← Resume
\`\`\`json  ← Metadata`;

    const userPrompt = `Today's Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nBase Resume:\n${state.resumeText}\n\nTarget Job Description:\n${state.jobText}`;

    try {
        const { data, error } = await withTimeout(
            supabaseClient.functions.invoke('gemini-proxy', {
                body: {
                    model: state.model,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                }
            }),
            90000 // 90 second timeout for main generation
        );

        if (error) throw new Error(error.message || 'Generation proxy error.');
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const reason = data?.error?.message
                || data?.promptFeedback?.blockReason
                || data?.candidates?.[0]?.finishReason
                || 'No response from AI model. Please try again.';
            throw new Error(reason);
        }

        const content = data.candidates[0].content.parts[0].text;
        await parseAndRedirect(content);

    } catch (error) {
        const isTimeout = error.message.includes('timed out');
        const errorMsg = isTimeout
            ? 'Generation took too long. This can happen with complex resumes.'
            : error.message;
        const retryHtml = `<button class="btn small-btn primary-btn" onclick="processGeneration()" style="margin-top: 0.75rem;"><i class="fa-solid fa-rotate-right"></i> Retry</button>`;

        el.genStatus && (el.genStatus.innerHTML = `<span class="error-text"><i class="fa-solid fa-triangle-exclamation"></i> ${errorMsg}</span>${retryHtml}`);
    } finally {
        // Always hide loading overlay so user isn't stuck
        if (el.loadingOverlay) {
            el.loadingOverlay.classList.add('hidden');
            stopFunnyQuotes();
        }
        el.generationControl.classList.remove('hidden');
    }
}

async function parseAndRedirect(content) {
    const pattern = /```(?:html|json|text)?\n([\s\S]*?)```/g;
    const matches = [];
    let m;
    while ((m = pattern.exec(content)) !== null) matches.push(m[1].trim());

    const resumeHtml = matches[0] || '';
    let meta = {};

    try { meta = JSON.parse(matches[1] || '{}'); } catch (e) { }

    if (meta.applicantName) state.applicantName = meta.applicantName;
    if (meta.targetCompany) state.targetCompany = meta.targetCompany;

    const payload = {
        resumeHtml,
        coverHtml: null,     // Generated on demand when tab is clicked
        interviewQa: null,   // Generated on demand when tab is clicked
        emailText: null,     // Generated on demand when tab is clicked
        applicantName: meta.applicantName || '',
        targetCompany: meta.targetCompany || '',
        matchScore: meta.matchScore || null,
        missingKeywords: meta.missingKeywords || [],
        companyPrimaryColor: meta.companyPrimaryColor || '#1a1a2e',
        resumeText: state.resumeText,
        jobText: state.jobText
    };
    sessionStorage.setItem('tms_outputs', JSON.stringify(payload));

    // Increment generation count for free tier tracking
    incrementGenerationCount();

    window.location.href = 'results.html';
}

function renderMatchScore(score) {
    const scoreContainer = document.getElementById('match-score-container');
    if (!scoreContainer) return;

    scoreContainer.innerHTML = `
        <div class="score-circle">
            <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="circle" stroke-dasharray="${score}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" class="percentage">${score}%</text>
            </svg>
        </div>
        <div class="score-label">ATS Compatibility Score</div>
    `;
    scoreContainer.classList.remove('hidden');
}

function renderKeywords(keywords) {
    const keywordContainer = document.getElementById('missing-keywords-container');
    if (!keywordContainer) return;

    keywordContainer.innerHTML = `
        <h4><i class="fa-solid fa-triangle-exclamation"></i> Critical Skills to Consider</h4>
        <div class="keyword-badges">
            ${keywords.map(kw => `<span class="keyword-badge">${kw}</span>`).join('')}
        </div>
    `;
    keywordContainer.classList.remove('hidden');
}

function updateWelcomeMessage() {
    const welcomeEl = document.getElementById('welcome-message');
    if (!welcomeEl) return;
    welcomeEl.textContent = 'Hello, Steven';
}

const ALL_THEMES = [
    'theme-executive', 'theme-modern-tech', 'theme-creative',
    'theme-minimal', 'theme-bold', 'theme-warm', 'theme-sharp'
];

function applyTemplateTheme(theme) {
    // If random, pick a different theme from the current one
    if (theme === 'random') {
        const currentTheme = ALL_THEMES.find(t => el.resumeOut && el.resumeOut.classList.contains(t)) || 'theme-executive';
        const others = ALL_THEMES.filter(t => t !== currentTheme);
        theme = others[Math.floor(Math.random() * others.length)];
        // Update active button to the chosen theme
        el.templateBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-theme') === theme);
        });
    }

    // Apply to resume output
    if (el.resumeOut) {
        el.resumeOut.classList.remove(...ALL_THEMES);
        el.resumeOut.classList.add(theme);
    }
    // Apply to cover output too for consistency
    if (el.coverOut) {
        el.coverOut.classList.remove(...ALL_THEMES);
        el.coverOut.classList.add(theme);
    }
}

async function processRefinement() {
    const prompt = el.refinePrompt.value.trim();
    if (!prompt) return;

    const isResume = document.getElementById('resume-tab').classList.contains('active');
    const targetTextarea = isResume ? el.resumeOut : el.coverOut;
    const currentText = targetTextarea.innerHTML || targetTextarea.innerText;

    if (!currentText.trim()) return;

    // Show chat area if hidden
    if (el.chatMessages) el.chatMessages.classList.remove('hidden');

    // Add user message to UI
    appendChatMessage('user', prompt);
    el.refinePrompt.value = '';

    el.loadingOverlay.classList.remove('hidden');
    el.loadingOverlay.querySelector('h3').textContent = 'Refining...';

    // Prepare history for AI
    const systemPrompt = `You are an elite Executive Career Coach. Refine the provided document based on the user's feedback. 
    CURRENT DOCUMENT CONTENT:
    ${currentText}
    
    Output ONLY THE RAW REFINED HTML. NO markdown backticks, NO "Here is your refined document", NO other chat. Just the <h1>, <p>, <ul> etc.`;

    // Map local history to Google format
    const contents = state.chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // Add the latest prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: {
                model: state.model,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: contents,
                generationConfig: { temperature: 0.7 }
            }
        });

        if (error) throw new Error(error.message);
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error(data?.error?.message || 'No response from AI model. Try again.');
        }

        let aiText = data.candidates[0].content.parts[0].text;

        // Clean up any stray markdown
        aiText = aiText.replace(/```(html)?|```/g, '').trim();

        // Update UI
        targetTextarea.innerHTML = aiText;

        // Update History
        state.chatHistory.push({ role: 'user', content: prompt });
        state.chatHistory.push({ role: 'model', content: "Document refined successfully." });

        appendChatMessage('assistant', "Refined your document. How does it look?");

    } catch (error) {
        appendChatMessage('assistant', "Sorry, I hit an error: " + error.message);
    } finally {
        el.loadingOverlay.classList.add('hidden');
        el.loadingOverlay.querySelector('h3').textContent = 'Crafting narrative...';
        el.loadingOverlay.querySelector('p').textContent = 'Analyzing ATS keywords and reformatting.';
    }
}

function appendChatMessage(role, text) {
    if (!el.chatMessages) return;

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-bubble');
    msgDiv.style.padding = '0.6rem 0.8rem';
    msgDiv.style.borderRadius = '12px';
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.fontSize = '0.85rem';
    msgDiv.style.lineHeight = '1.4';

    if (role === 'user') {
        msgDiv.style.background = 'var(--accent-color)';
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.color = 'white';
        msgDiv.style.boxShadow = '0 2px 8px var(--accent-glow)';
    } else {
        msgDiv.style.background = 'rgba(255, 255, 255, 0.05)';
        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.border = '1px solid var(--panel-border)';
        msgDiv.style.color = 'var(--text-primary)';
    }

    msgDiv.textContent = text;
    el.chatMessages.appendChild(msgDiv);
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

function handleSavePreferences() {
    const prefs = el.prefsInput.value.trim();
    state.userPreferences = prefs;
    localStorage.setItem(PREFS_STORAGE, prefs);
    el.prefsModal.style.display = 'none';
}
// ───────────────────────────────────────────────
// FEATURE 1: Interview Question Generator
// ───────────────────────────────────────────────
async function generateInterviewQuestions() {
    if (!state.resumeText || !state.jobText) return;

    el.interviewOutput.innerHTML = '<div class="empty-tab-placeholder"><div class="spinner" style="width:32px;height:32px;"></div><p>Generating questions...</p></div>';
    el.genInterviewBtn.disabled = true;

    const systemPrompt = `You are an expert interview coach. Based on the candidate's resume and the job description, generate exactly 8 highly relevant interview questions and ideal answer frameworks.

Output a JSON array like this (ONLY the JSON, no markdown, no extra text):
[
  { "question": "Tell me about...", "answer": "A strong answer would highlight..." },
  ...
]`;

    const userPrompt = `Resume:\n${state.resumeText}\n\nJob Description:\n${state.jobText}`;

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: {
                model: state.model,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: { temperature: 0.7 }
            }
        });
        if (error) throw new Error(error.message);
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error(data?.error?.message || 'No response from AI model. Try again.');
        }

        let raw = data.candidates[0].content.parts[0].text.trim();
        raw = raw.replace(/```json|```/g, '').trim();
        const qas = JSON.parse(raw);

        el.interviewOutput.innerHTML = qas.map(qa => `
            <div class="qa-item">
                <div class="qa-question">${qa.question}</div>
                <div class="qa-answer">${qa.answer}</div>
            </div>
        `).join('');
    } catch (e) {
        el.interviewOutput.innerHTML = `<p class="error-text">Error generating questions: ${e.message}</p>`;
    } finally {
        el.genInterviewBtn.disabled = false;
    }
}

// ───────────────────────────────────────────────
// FEATURE 2: Introduction Email Draft Generator
// ───────────────────────────────────────────────
async function generateEmailDraft() {
    if (!state.resumeText || !state.jobText) return;

    el.emailOut.innerHTML = '';
    el.genEmailBtn.disabled = true;
    el.emailOut.dataset.placeholder = 'Generating email...';

    const company = state.targetCompany || 'the company';
    const systemPrompt = `You are an expert career coach specializing in direct outreach. Write a concise, compelling introduction email to the hiring manager at ${company}.
- Maximum 150 words.
- Subject line first (prefix with "Subject: ").
- Warm but professional tone.
- Reference 1-2 specific achievements from the resume.
- End with a clear, low-pressure call to action.
Output ONLY the email text (no HTML, no markdown, just plain text).`;

    const userPrompt = `Resume:\n${state.resumeText}\n\nJob Description:\n${state.jobText}`;

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: {
                model: state.model,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: { temperature: 0.8 }
            }
        });
        if (error) throw new Error(error.message);
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error(data?.error?.message || 'No response from AI model. Try again.');
        }

        const text = data.candidates[0].content.parts[0].text.trim();
        // Render as styled plain text
        el.emailOut.innerHTML = text.split('\n').map(line =>
            line.startsWith('Subject:') ? `<strong style="color:var(--accent-color);">${line}</strong>` : `<p style="margin:0.4rem 0;">${line || '&nbsp;'}</p>`
        ).join('');
    } catch (e) {
        el.emailOut.innerHTML = `<p class="error-text">Error: ${e.message}</p>`;
    } finally {
        el.genEmailBtn.disabled = false;
    }
}

// ───────────────────────────────────────────────
// FEATURE 3: LinkedIn About Section Generator
// ───────────────────────────────────────────────
async function generateLinkedInAbout() {
    if (!state.resumeText) return;

    el.linkedinOutput.innerHTML = '';
    el.linkedinOutput.dataset.placeholder = 'Generating your LinkedIn About section...';

    const systemPrompt = `You are a professional LinkedIn profile writer. Based on the resume, write a compelling LinkedIn About section.
- Exactly 280-320 words.
- First-person voice.
- Start with a hook (not "I am a...").
- 3-4 short paragraphs.
- End with what you're looking for or open to.
Output ONLY the plain text (no HTML, no markdown, no quotes).`;

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: {
                model: state.model,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: `Resume:\n${state.resumeText}` }] }],
                generationConfig: { temperature: 0.75 }
            }
        });
        if (error) throw new Error(error.message);
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error(data?.error?.message || 'No response from AI model. Try again.');
        }

        const text = data.candidates[0].content.parts[0].text.trim();
        el.linkedinOutput.innerHTML = text.split('\n\n').map(p => `<p style="margin-bottom:0.9rem;">${p}</p>`).join('');
    } catch (e) {
        el.linkedinOutput.innerHTML = `<p class="error-text">Error: ${e.message}</p>`;
    }
}

// ───────────────────────────────────────────────
// FEATURE 4: Live Word Count & Page Estimate
// ───────────────────────────────────────────────
function countWords(el) {
    return (el.innerText || el.textContent || '').trim().split(/\s+/).filter(Boolean).length;
}

function updateWordCount(outputEl, wordSpan, pageSpan) {
    if (!outputEl || !wordSpan || !pageSpan) return;
    const words = countWords(outputEl);
    const pages = Math.max(1, Math.ceil(words / 350));
    wordSpan.innerHTML = `<i class="fa-solid fa-align-left"></i> ${words.toLocaleString()} words`;
    pageSpan.innerHTML = `<i class="fa-regular fa-file"></i> ~${pages} page${pages !== 1 ? 's' : ''}`;
}

function initWordCountObserver() {
    const targets = [
        { out: el.resumeOut, wordEl: el.resumeWordCount, pageEl: el.resumePageEst },
        { out: el.coverOut, wordEl: el.coverWordCount, pageEl: el.coverPageEst }
    ];
    targets.forEach(({ out, wordEl, pageEl }) => {
        if (!out) return;
        const observer = new MutationObserver(() => updateWordCount(out, wordEl, pageEl));
        observer.observe(out, { childList: true, subtree: true, characterData: true });
        out.addEventListener('input', () => updateWordCount(out, wordEl, pageEl));
    });
}

// ───────────────────────────────────────────────
// FEATURE 5: Share via Link
// ───────────────────────────────────────────────
function handleShare() {
    const resumeHtml = el.resumeOut ? el.resumeOut.innerHTML : '';
    const coverHtml = el.coverOut ? el.coverOut.innerHTML : '';
    if (!resumeHtml && !coverHtml) return;

    try {
        const payload = JSON.stringify({ r: resumeHtml, c: coverHtml });
        const encoded = btoa(unescape(encodeURIComponent(payload)));
        const url = `${location.origin}${location.pathname}#share=${encoded}`;
        navigator.clipboard.writeText(url).then(() => showShareToast());
    } catch (e) {
        console.error('Share failed:', e);
    }
}

function showShareToast() {
    if (!el.shareToast) return;
    el.shareToast.classList.remove('hidden');
    setTimeout(() => el.shareToast.classList.add('hidden'), 3000);
}

// Load shared content from URL hash on page load
function loadSharedContent() {
    const hash = location.hash;
    if (!hash.startsWith('#share=')) return;
    try {
        const encoded = hash.replace('#share=', '');
        const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        if (payload.r && el.resumeOut) {
            // Jump to results view
            el.generationControl && el.generationControl.classList.add('hidden');
            el.resultsView && el.resultsView.classList.remove('hidden');
            el.resumeOut.innerHTML = payload.r;
            if (el.coverOut && payload.c) el.coverOut.innerHTML = payload.c;
            // Navigate to step 3
            goToStep(3);
        }
    } catch (e) {
        // Invalid hash, ignore
    }
}

// ───────────────────────────────────────────────
// NEW: MISSING SKILLS EXTRACTION (Phase 4)
// ───────────────────────────────────────────────
async function extractMissingSkills() {
    const currentKey = `${state.resumeText.length}_${state.jobText.length}`;
    if (state.lastMissingSkillsKey === currentKey) return; // Already extracted for this content

    state.lastMissingSkillsKey = currentKey;
    state.selectedMissingSkills = [];

    if (!el.missingSkillsContainer) return;

    el.missingSkillsContainer.style.display = 'block';
    el.missingSkillsLoading.style.display = 'block';
    el.missingSkillsList.style.display = 'none';
    el.missingSkillsList.innerHTML = '';
    el.missingSkillsError.style.display = 'none';

    const systemPrompt = `You are an expert technical recruiter analyzing a resume against a job description.
Identify exactly 5 to 10 important "hard skills" or specific keywords present in the Job Description that are MISSING from the Resume.
Return ONLY a valid JSON array of strings, with absolutely no markdown formatting or backticks. Example: ["AWS", "Kubernetes", "B2B Sales"]`;
    const userPrompt = `Resume:\n${state.resumeText}\n\nJob Description:\n${state.jobText}`;

    try {
        // Ensure supabaseClient is available
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized. Please refresh the page.');
        }

        const { data, error } = await withTimeout(
            window.supabaseClient.functions.invoke('gemini-proxy', {
                body: {
                    model: 'gemini-3-flash-preview',
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    generationConfig: { temperature: 0.1 }
                }
            }),
            30000 // 30 second timeout for skills extraction
        );

        if (error) throw new Error(error.message);
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error(data?.error?.message || 'No response from AI model');
        }

        let text = data.candidates[0].content.parts[0].text.trim();
        // Fallback: strip markdown formatting if the model still wrapped it
        text = text.replace(/```json\n?|```/g, '').trim();

        const missingSkills = JSON.parse(text);

        if (!Array.isArray(missingSkills) || missingSkills.length === 0) {
            el.missingSkillsLoading.style.display = 'none';
            el.missingSkillsError.textContent = "No significant missing skills found.";
            el.missingSkillsError.style.display = 'block';
            return;
        }

        renderMissingSkills(missingSkills);

    } catch (e) {
        console.error("Skills extraction error:", e);
        el.missingSkillsLoading.style.display = 'none';
        el.missingSkillsError.textContent = "Could not analyze gap: " + e.message;
        el.missingSkillsError.style.display = 'block';
    }
}

function renderMissingSkills(skills) {
    el.missingSkillsLoading.style.display = 'none';
    el.missingSkillsList.style.display = 'flex';
    el.missingSkillsList.innerHTML = '';

    skills.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'keyword-badge skill-pill';
        pill.innerHTML = `<i class="fa-solid fa-plus" style="margin-right:4px;"></i> ${skill}`;
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', () => {
            const index = state.selectedMissingSkills.indexOf(skill);
            if (index > -1) {
                state.selectedMissingSkills.splice(index, 1);
                pill.style.background = '';
                pill.style.borderColor = '';
                pill.style.color = '';
                pill.innerHTML = `<i class="fa-solid fa-plus" style="margin-right:4px;"></i> ${skill}`;
            } else {
                state.selectedMissingSkills.push(skill);
                pill.style.background = 'rgba(16, 185, 129, 0.15)';
                pill.style.borderColor = 'var(--success-color)';
                pill.style.color = 'var(--success-color)';
                pill.innerHTML = `<i class="fa-solid fa-check" style="margin-right:4px;"></i> ${skill}`;
            }
        });

        el.missingSkillsList.appendChild(pill);
    });
}

// Hook it into init reliably
function runInit() {
    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
} else {
    runInit();
}
