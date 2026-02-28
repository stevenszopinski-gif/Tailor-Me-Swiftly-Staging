/**
 * Brand Configuration for GAG Multi-Domain Platform
 *
 * Detects the current domain and configures branding (name, colors, icons,
 * navigation) so shared scripts (auth.js, components.js) behave correctly
 * on both TailorMeSwiftly.com and TailorTheNews.com.
 *
 * Load BEFORE auth.js and components.js:
 *   <script src="brand-config.js"></script>
 *   <script src="auth.js"></script>
 *   <script src="components.js"></script>
 */
(function () {
    const host = window.location.hostname;

    const brands = {
        'tailorthenews.com': {
            id: 'ttn',
            name: 'TailorTheNews',
            domain: 'tailorthenews.com',
            tagline: 'Your AI News Briefing',
            primaryColor: '#3b82f6',
            primaryHover: '#2563eb',
            accentColor: '#60a5fa',
            accentGlow: 'rgba(59, 130, 246, 0.5)',
            icon: 'fa-newspaper',
            logo: '/logo.png',
            homePath: 'feed.html',
            appPath: 'briefing.html',
            themeStorageKey: 'ttn_theme_preference',
            navItems: [
                { href: 'account.html', icon: 'fa-user-gear', label: 'Account' },
                { href: 'feed.html', icon: 'fa-newspaper', label: 'My Briefings' },
                { href: 'briefing.html', icon: 'fa-wand-magic-sparkles', label: 'New Briefing' },
                { href: 'pricing.html', icon: 'fa-tags', label: 'Pricing' }
            ],
            footerLinks: [
                { href: 'pricing.html', label: 'Pricing' },
                { href: 'terms.html', label: 'Terms & Conditions' },
                { href: 'privacy.html', label: 'Privacy Policy' }
            ]
        },
        'tailormeswiftly.com': {
            id: 'tms',
            name: 'TailorMeSwiftly',
            domain: 'tailormeswiftly.com',
            tagline: 'AI Resume Tailoring',
            primaryColor: '#10b981',
            primaryHover: '#059669',
            accentColor: '#34d399',
            accentGlow: 'rgba(16, 185, 129, 0.5)',
            icon: 'fa-clipboard',
            logo: '/logo.png',
            homePath: 'dashboard.html',
            appPath: 'app.html',
            themeStorageKey: 'ats_theme_preference',
            navItems: [
                { href: 'account.html', icon: 'fa-user-gear', label: 'Account' },
                { href: 'dashboard.html', icon: 'fa-compass', label: 'Dashboard' },
                { href: 'updates.html', icon: 'fa-bullhorn', label: 'Release Notes' },
                { href: 'help.html', icon: 'fa-circle-question', label: 'Help Center' },
                { href: 'blog.html', icon: 'fa-newspaper', label: 'Blog' }
            ],
            footerLinks: [
                { href: 'pricing.html', label: 'Pricing' },
                { href: 'blog.html', label: 'Blog' },
                { href: 'help.html', label: 'Help' },
                { href: 'terms.html', label: 'Terms & Conditions' },
                { href: 'privacy.html', label: 'Privacy Policy' },
                { href: 'security.html', label: 'Security Policy' }
            ]
        }
    };

    // Allow explicit override via script tag (for local dev / staging)
    const overrideId = window.TMS_BRAND_OVERRIDE;
    if (overrideId && brands[Object.keys(brands).find(k => brands[k].id === overrideId)]) {
        window.TMS_BRAND = brands[Object.keys(brands).find(k => brands[k].id === overrideId)];
    } else {
        window.TMS_BRAND = brands[host] || brands['tailormeswiftly.com'];
    }

    // Apply CSS variable overrides for non-TMS brands
    if (window.TMS_BRAND.id !== 'tms') {
        const s = document.documentElement.style;
        s.setProperty('--primary-color', window.TMS_BRAND.primaryColor);
        s.setProperty('--primary-hover', window.TMS_BRAND.primaryHover);
        s.setProperty('--accent-color', window.TMS_BRAND.accentColor);
        s.setProperty('--accent-glow', window.TMS_BRAND.accentGlow);
    }
})();
