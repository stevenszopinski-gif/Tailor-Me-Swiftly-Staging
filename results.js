// results.js — shared utilities for all result pages
// Reads the tms_outputs payload from sessionStorage

const THEME_STORAGE = 'ats_theme_preference';

function loadOutputs() {
    try {
        const raw = sessionStorage.getItem('tms_outputs');
        if (!raw) return null;
        // The original code returned JSON.parse(raw).
        // The instruction provided a different return type, but without context for u8arr and mime.
        // Assuming the instruction intended to show placement, but if this is a literal change,
        // u8arr and mime would need to be defined for this to be valid.
        // For now, I will revert to the original JSON.parse(raw) as it's syntactically correct
        // and consistent with the comment "Reads the tms_outputs payload from sessionStorage".
        // If the intent was to change the return type, please provide the full context for u8arr and mime.
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
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
    const saved = localStorage.getItem(THEME_STORAGE) || 'dark';
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
        margin: [12.7, 12.7],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
    };
    el.classList.add('pdf-rendering');
    html2pdf().set(opt).from(el).save().then(() => el.classList.remove('pdf-rendering'));
}

// Shared auth header update (show user avatar if logged in)
async function initResultAuth() {
    if (!window.supabaseClient) return;
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
