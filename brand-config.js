/**
 * Brand Configuration for TailorMeSwiftly Multi-Product Platform
 *
 * Detects the current product area from the URL path and configures
 * branding (name, colors, icons, navigation) so shared scripts
 * (auth.js, components.js) behave correctly across all products.
 *
 * Products:
 *   /news/*   → Tailor The News  (blue)
 *   /learn/*  → Tailor My Learning (purple, placeholder)
 *   /*        → Tailor My Application (green, default)
 *
 * Load BEFORE auth.js and components.js:
 *   <script src="brand-config.js"></script>
 *   <script src="auth.js"></script>
 *   <script src="components.js"></script>
 */
(function () {
    const path = window.location.pathname;
    const P = window.TMS_PATH_PREFIX || '';

    const products = {
        applications: {
            id: 'tms',
            name: 'Tailor My Application',
            shortName: 'Applications',
            tagline: 'AI Resume Tailoring',
            primaryColor: '#10b981',
            primaryHover: '#059669',
            accentColor: '#34d399',
            accentGlow: 'rgba(16, 185, 129, 0.5)',
            icon: 'fa-clipboard',
            basePath: '',
            homePath: 'dashboard.html?product=apps',
            appPath: 'app.html'
        },
        learn: {
            id: 'learn',
            name: 'Tailor My Learning',
            shortName: 'Learning',
            tagline: 'AI-Powered Skill Building',
            primaryColor: '#8b5cf6',
            primaryHover: '#7c3aed',
            accentColor: '#a78bfa',
            accentGlow: 'rgba(139, 92, 246, 0.5)',
            icon: 'fa-graduation-cap',
            basePath: 'learn/',
            homePath: 'learn/index.html',
            appPath: 'learn/index.html'
        },
        news: {
            id: 'ttn',
            name: 'Tailor The News',
            shortName: 'News',
            tagline: 'Your AI News Briefing',
            primaryColor: '#3b82f6',
            primaryHover: '#2563eb',
            accentColor: '#60a5fa',
            accentGlow: 'rgba(59, 130, 246, 0.5)',
            icon: 'fa-newspaper',
            basePath: 'news/',
            homePath: 'news/briefing.html',
            appPath: 'news/briefing.html'
        }
    };

    // Detect active product from URL path
    function detectProduct() {
        if (path.includes('/news/')) return products.news;
        if (path.includes('/learn/')) return products.learn;
        return products.applications;
    }

    // Allow explicit override (for staging / dev)
    const overrideId = window.TMS_BRAND_OVERRIDE;
    let activeProduct;
    if (overrideId) {
        activeProduct = Object.values(products).find(p => p.id === overrideId) || detectProduct();
    } else {
        activeProduct = detectProduct();
    }

    // Unified nav items (avatar dropdown) — same for all products
    const navItems = [
        { href: P + 'account.html', icon: 'fa-user-gear', label: 'Account' },
        { href: P + 'dashboard.html', icon: 'fa-compass', label: 'Dashboard' },
        { href: P + 'updates.html', icon: 'fa-bullhorn', label: 'Release Notes' },
        { href: P + 'help.html', icon: 'fa-circle-question', label: 'Help Center' },
        { href: P + 'blog.html', icon: 'fa-newspaper', label: 'Blog' }
    ];

    const footerLinks = [
        { href: P + 'pricing.html', label: 'Pricing' },
        { href: P + 'blog.html', label: 'Blog' },
        { href: P + 'help.html', label: 'Help' },
        { href: P + 'terms.html', label: 'Terms & Conditions' },
        { href: P + 'privacy.html', label: 'Privacy Policy' },
        { href: P + 'security.html', label: 'Security Policy' }
    ];

    // Expose on window for auth.js, components.js, billing.js
    window.TMS_BRAND = {
        id: activeProduct.id,
        name: 'TailorMeSwiftly',
        domain: 'tailormeswiftly.com',
        tagline: activeProduct.tagline,
        primaryColor: activeProduct.primaryColor,
        primaryHover: activeProduct.primaryHover,
        accentColor: activeProduct.accentColor,
        accentGlow: activeProduct.accentGlow,
        icon: activeProduct.icon,
        logo: '/logo.png',
        homePath: activeProduct.homePath,
        appPath: activeProduct.appPath,
        themeStorageKey: 'tms_theme_preference',
        navItems: navItems,
        footerLinks: footerLinks,
        // New multi-product fields
        activeProduct: activeProduct,
        products: products
    };

    // Apply CSS variable overrides for non-TMS products
    if (activeProduct.id !== 'tms') {
        const s = document.documentElement.style;
        s.setProperty('--primary-color', activeProduct.primaryColor);
        s.setProperty('--primary-hover', activeProduct.primaryHover);
        s.setProperty('--accent-color', activeProduct.accentColor);
        s.setProperty('--accent-glow', activeProduct.accentGlow);
    }
})();
