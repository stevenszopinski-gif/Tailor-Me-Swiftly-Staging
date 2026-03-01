// auth.js
// Handles Supabase initialization and authentication state

// Wrap everything in error handling
(function () {
    const SUPABASE_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';

    // Global alert interceptor to suppress rogue "Invalid JWT" alerts from Supabase internals
    const _originalAlert = window.alert;
    window.alert = function (msg) {
        if (msg && /^invalid jwt/i.test(String(msg).trim())) {
            console.warn('[Global Alert Catch] Suppressed JWT alert:', msg);
            return; // Just suppress — do NOT sign out
        }
        return _originalAlert.apply(this, arguments);
    };

    window.supabaseClient = null;

    function initSupabaseClient() {
        try {
            if (!window.supabase) {
                return false;
            }

            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    autoRefreshToken: false,  // Disable — refresh fails with sb_publishable_ key and corrupts session
                    persistSession: true
                }
            });
            if (!client) return false;

            window.supabaseClient = client;
            console.log("[Auth] Supabase client ready");

            // Monkey-patch functions.invoke to use direct fetch with user's JWT
            // The sb_publishable_ key is incompatible with Edge Functions gateway
            const EDGE_BASE = SUPABASE_URL + '/functions/v1';
            client.functions.invoke = async function (fnName, opts) {
                const { data: { session } } = await client.auth.getSession();
                if (!session) throw new Error('Not authenticated');
                const resp = await fetch(EDGE_BASE + '/' + fnName, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + session.access_token
                    },
                    body: JSON.stringify(opts?.body || {})
                });
                const json = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    const errMsg = json?.message || json?.error?.message || json?.error || 'Edge function error (' + resp.status + ')';
                    return { data: null, error: { message: errMsg } };
                }
                return { data: json, error: null };
            };

            // Dispatch auth-ready event
            document.dispatchEvent(new Event('auth-ready'));

            // Set up auth listener
            setTimeout(() => setupAuthStateListener(), 100);
            return true;
        } catch (e) {
            console.error("[Auth] Error:", e.message);
            return false;
        }
    }

    function waitForInit() {
        if (initSupabaseClient()) return;

        let count = 0;
        const timer = setInterval(() => {
            if (initSupabaseClient()) {
                clearInterval(timer);
            } else if (++count > 100) {
                clearInterval(timer);
                console.error("[Auth] Initialization timeout");
            }
        }, 100);
    }

    // Delay to let everything load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(waitForInit, 500));
    } else {
        setTimeout(waitForInit, 500);
    }

    window.initAuthUI_ready = false;
    window.initAuthUI = function () {
        if (window.initAuthUI_ready) return;
        window.initAuthUI_ready = true;

        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', signInWithGoogle);
        }

        // Use event delegation for logout button since it may be recreated by components.js
        document.body.addEventListener('click', function (e) {
            if (e.target.closest('#logout-btn')) {
                window.signOut();
            }
        });

        // Email auth setup
        const emailLoginBtn = document.getElementById('email-login-btn');
        const emailSignupBtn = document.getElementById('email-signup-btn');

        if (emailLoginBtn) {
            emailLoginBtn.addEventListener('click', handleEmailLogin);
        }
        if (emailSignupBtn) {
            emailSignupBtn.addEventListener('click', handleEmailSignup);
        }
    };

    function showToast(msg, isError) {
        let toast = document.getElementById('tms-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'tms-toast';
            toast.style.cssText = 'position:fixed;top:1rem;left:50%;transform:translateX(-50%);padding:0.75rem 1.5rem;border-radius:12px;font-size:0.9rem;z-index:99999;transition:opacity 0.3s;max-width:90%;text-align:center;font-family:Outfit,sans-serif;';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.background = isError ? '#ef4444' : (window.TMS_BRAND?.primaryColor || '#10b981');
        toast.style.color = '#fff';
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
    }

    window.signInWithGoogle = async function () {
        if (!window.supabaseClient) {
            showToast("Authentication not ready. Please refresh the page.", true);
            return;
        }

        try {
            const P = window.TMS_PATH_PREFIX || '';
            const home = P + (window.TMS_BRAND?.homePath || 'dashboard.html');
            const { error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: new URL(home, window.location.href).href
                }
            });

            if (error) showToast("Login error: " + error.message, true);
        } catch (e) {
            showToast("Error: " + e.message, true);
        }
    };

    window.signOut = async function () {
        if (!window.supabaseClient) return;

        try {
            window._signingOut = true;
            localStorage.removeItem('tms_last_gen_id');
            sessionStorage.removeItem('tms_outputs');
            await window.supabaseClient.auth.signOut({ scope: 'global' });
            const P = window.TMS_PATH_PREFIX || '';
            window.location.href = P + 'index.html';
        } catch (e) {
            console.error("Sign out error:", e.message);
            window._signingOut = false;
        }
    };

    window.handleEmailLogin = async function () {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');

        if (!window.supabaseClient || !emailInput || !passwordInput) {
            showToast("Not ready yet. Please wait a moment.", true);
            return;
        }

        try {
            const { error } = await window.supabaseClient.auth.signInWithPassword({
                email: emailInput.value,
                password: passwordInput.value
            });

            if (error) {
                document.getElementById('auth-error-message').textContent = error.message;
                document.getElementById('auth-error-message').style.display = 'block';
            }
        } catch (e) {
            document.getElementById('auth-error-message').textContent = e.message;
            document.getElementById('auth-error-message').style.display = 'block';
        }
    };

    window.handleEmailSignup = async function () {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');

        if (!window.supabaseClient || !emailInput || !passwordInput) {
            showToast("Not ready yet. Please wait a moment.", true);
            return;
        }

        try {
            const { error } = await window.supabaseClient.auth.signUp({
                email: emailInput.value,
                password: passwordInput.value
            });

            if (error) {
                document.getElementById('auth-error-message').textContent = error.message;
                document.getElementById('auth-error-message').style.display = 'block';
            } else {
                const msgEl = document.getElementById('auth-error-message');
                msgEl.innerHTML = "<strong>Check your email!</strong> We sent a confirmation link to <strong>" + emailInput.value + "</strong>. Click it to activate your account.";
                msgEl.style.color = "var(--success-color)";
                msgEl.style.display = 'block';
            }
        } catch (e) {
            document.getElementById('auth-error-message').textContent = e.message;
            document.getElementById('auth-error-message').style.display = 'block';
        }
    };

    function setupAuthStateListener() {
        if (!window.supabaseClient) {
            setTimeout(setupAuthStateListener, 200);
            return;
        }

        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            // Don't auto-redirect back after an explicit sign-out
            if (window._signingOut) return;

            // Only act on explicit auth events — ignore failed token refreshes
            // that would falsely log the user out
            if (event === 'TOKEN_REFRESHED' && !session) return;

            const path = window.location.pathname;
            const isApp = path.includes('app.html');
            const isLoginSignup = path.includes('login.html') || path.includes('signup.html');

            const P = window.TMS_PATH_PREFIX || '';
            const _home = P + (window.TMS_BRAND?.homePath || 'dashboard.html');
            if (session && isLoginSignup && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                window.location.href = _home;
            } else if (!session && event === 'SIGNED_OUT') {
                // Only redirect/update UI on explicit sign-out
                if (isApp) {
                    window.location.href = P + 'index.html';
                } else {
                    updateUIForLoggedOut();
                }
            } else if (session) {
                updateUIForUser(session.user);
            }
        });
    }


    window.isPremiumUser = false;

    async function checkPremiumStatus(userId) {
        if (!window.supabaseClient) return false;
        try {
            const { data, error } = await window.supabaseClient
                .from('user_profiles')
                .select('plan')
                .eq('user_id', userId)
                .maybeSingle();

            if (data && data.plan === 'premium') {
                window.isPremiumUser = true;
                return true;
            }
        } catch (e) {
            console.error("[Auth] Premium check failed:", e);
        }
        window.isPremiumUser = false;
        return false;
    }

    window.showUpgradeModal = function (featureName = "this premium feature") {
        let modal = document.getElementById('upgrade-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'upgrade-modal';
            modal.className = 'confirm-overlay'; // Reusing confirmation overlay styles
            modal.innerHTML = `
                <div class="confirm-box">
                    <div class="upgrade-modal-icon"><i class="fa-solid fa-crown"></i></div>
                    <h3>Unlock Premium Access</h3>
                    <p>Upgrade to ${window.TMS_BRAND?.name || 'TailorMeSwiftly'} Premium to access <strong>${featureName}</strong> and all premium features.</p>
                    <div class="confirm-actions">
                        <button class="confirm-cancel" onclick="document.getElementById('upgrade-modal').remove()">Maybe Later</button>
                        <a href="account.html" class="plan-btn gold" style="text-decoration:none; display:flex; align-items:center; justify-content:center; flex:1; border-radius:10px; font-weight:600;">Upgrade Now</a>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    };

    function updateUIForUser(user) {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile');
        const userAvatar = document.getElementById('user-avatar');

        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';

        if (userAvatar && user.user_metadata?.avatar_url) {
            userAvatar.src = user.user_metadata.avatar_url;
        } else if (userAvatar) {
            userAvatar.src = 'https://ui-avatars.com/api/?background=random&name=' + encodeURIComponent(user.email);
        }

        const firstName = (user.user_metadata?.full_name || user.email || '').split(/[\s@]/)[0];

        const greeting = document.getElementById('user-greeting');
        if (greeting) {
            greeting.textContent = `Hi, ${firstName}`;
        }

        const welcome = document.getElementById('welcome-message');
        if (welcome && firstName) {
            welcome.textContent = `Hello, ${firstName}`;
        }

        // Check premium status
        checkPremiumStatus(user.id);

        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.style.opacity = '1';
            dropZone.style.pointerEvents = 'auto';
        }

        // Update landing page CTAs for logged-in users
        document.querySelectorAll('.hp-hero-cta').forEach(btn => {
            btn.href = 'dashboard.html';
            btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Get Started';
        });
    }

    function updateUIForLoggedOut() {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile');

        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';

        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.style.opacity = '0.5';
            dropZone.style.pointerEvents = 'none';
        }

        // Revert landing page CTAs for logged-out users
        document.querySelectorAll('.hp-hero-cta').forEach(btn => {
            btn.href = 'login.html';
            btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Get Started For Free';
        });
    }

    window.updateUIForUser = updateUIForUser;
    window.updateUIForLoggedOut = updateUIForLoggedOut;

    // --- Global Theme Logic --- //
    window.initTheme = function () {
        const THEME_STORAGE = window.TMS_BRAND?.themeStorageKey || 'ats_theme_preference';
        const savedTheme = localStorage.getItem(THEME_STORAGE) || 'light';

        document.body.setAttribute('data-theme', savedTheme);

        const themeToggleBtns = document.querySelectorAll('.theme-btn');

        function updateThemeIcons(theme) {
            themeToggleBtns.forEach(btn => {
                btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i> Theme' : '<i class="fa-solid fa-sun"></i> Theme';
            });
        }

        updateThemeIcons(savedTheme);

        themeToggleBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const currentTheme = document.body.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.body.setAttribute('data-theme', newTheme);
                localStorage.setItem(THEME_STORAGE, newTheme);
                updateThemeIcons(newTheme);
            });
        });
    };

    // --- Analytics --- //
    window.trackPageView = async function () {
        if (!window.supabaseClient) return;
        try {
            const path = window.location.pathname;
            const { data: { user } } = await window.supabaseClient.auth.getUser();

            await window.supabaseClient.from('analytics_events').insert([
                {
                    event_type: 'page_view',
                    page_path: path,
                    user_id: user ? user.id : null,
                    metadata: {
                        user_agent: navigator.userAgent,
                        referrer: document.referrer || 'direct'
                    }
                }
            ]);
        } catch (e) {
            console.warn("Analytics tracking skipped.");
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.initAuthUI();
            window.initTheme();
            window.trackPageView();
        });
    } else {
        window.initAuthUI();
        window.initTheme();
        window.trackPageView();
    }
})();
