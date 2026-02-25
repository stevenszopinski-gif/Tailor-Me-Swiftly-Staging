// auth.js
// Handles Supabase initialization and authentication state

// Wrap everything in error handling
(function() {
    const SUPABASE_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';

    window.supabaseClient = null;

    function initSupabaseClient() {
        try {
            if (!window.supabase) {
                return false;
            }

            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            if (!client) return false;

            window.supabaseClient = client;
            console.log("[Auth] Supabase client ready");

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
    window.initAuthUI = function() {
        if (window.initAuthUI_ready) return;
        window.initAuthUI_ready = true;

        const googleBtn = document.getElementById('google-login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (googleBtn) {
            googleBtn.addEventListener('click', signInWithGoogle);
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', signOut);
        }

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

    window.signInWithGoogle = async function() {
        if (!window.supabaseClient) {
            alert("Authentication not ready. Please refresh the page.");
            return;
        }

        try {
            const { error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: new URL('app.html', window.location.href).href
                }
            });

            if (error) alert("Login error: " + error.message);
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    window.signOut = async function() {
        if (!window.supabaseClient) return;

        try {
            window._signingOut = true;
            await window.supabaseClient.auth.signOut({ scope: 'global' });
            window.location.href = 'index.html';
        } catch (e) {
            console.error("Sign out error:", e.message);
            window._signingOut = false;
        }
    };

    window.handleEmailLogin = async function() {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');

        if (!window.supabaseClient || !emailInput || !passwordInput) {
            alert("Not ready yet");
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

    window.handleEmailSignup = async function() {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');

        if (!window.supabaseClient || !emailInput || !passwordInput) {
            alert("Not ready yet");
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

            const path = window.location.pathname;
            const isApp = path.includes('app.html');
            const isLoginSignup = path.includes('login.html') || path.includes('signup.html');
            const isLanding = path.includes('index.html') || path === '/';

            if (session && isLoginSignup && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                // Only redirect from login/signup pages — let landing page stay accessible
                window.location.href = 'app.html';
            } else if (session && isLanding) {
                // Logged-in user on landing page — update UI but don't redirect
                updateUIForUser(session.user);
            } else if (!session && isApp) {
                window.location.href = 'index.html';
            } else if (session) {
                updateUIForUser(session.user);
            } else {
                updateUIForLoggedOut();
            }
        });
    }

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

        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.style.opacity = '1';
            dropZone.style.pointerEvents = 'auto';
        }

        // Update landing page CTAs for logged-in users
        document.querySelectorAll('.hp-hero-cta').forEach(btn => {
            btn.href = 'app.html';
            btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Go to App';
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
    window.initTheme = function() {
        const THEME_STORAGE = 'ats_theme_preference';
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
    window.trackPageView = async function() {
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
