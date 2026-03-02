/**
 * Client-side Router for SEO-friendly URLs (Sprint 0.4)
 * Provides clean URLs using history.pushState with GitHub Pages 404.html redirect.
 */
(function () {
    'use strict';

    var ROUTE_MAP = {
        '/dashboard': '/dashboard.html',
        '/app': '/app.html',
        '/results': '/results.html',
        '/news': '/news/briefing.html',
        '/briefing': '/news/briefing.html',
        '/history': '/history.html',
        '/account': '/account.html',
        '/pricing': '/pricing.html',
        '/help': '/help.html',
        '/blog': '/blog.html',
        '/updates': '/updates.html',
        '/login': '/login.html',
        '/signup': '/signup.html',
        '/salary-map': '/tools/salary-map.html',
        '/career-paths': '/tools/career-paths.html',
        '/career-dna': '/tools/career-dna.html',
        '/templates': '/templates/gallery.html',
        '/stories': '/community/stories.html',
        '/skill-trees': '/learn/skill-trees.html',
        '/shadow-jobs': '/shadow-jobs.html'
    };

    // Expose for use in navigation
    window.TMS_ROUTES = ROUTE_MAP;

    /**
     * Navigate to a clean URL path.
     * @param {string} path - Clean path like '/dashboard'
     */
    window.navigateTo = function (path) {
        var real = ROUTE_MAP[path];
        if (real) {
            window.location.href = real;
        } else {
            window.location.href = path;
        }
    };

    // Handle 404.html redirects from GitHub Pages
    // GitHub Pages serves 404.html for unknown paths; we check if the path maps to a real page
    var path = window.location.pathname.replace(/\/$/, '');
    if (ROUTE_MAP[path] && !window.location.pathname.endsWith('.html')) {
        // Redirect to the actual HTML file
        window.location.replace(ROUTE_MAP[path] + window.location.search + window.location.hash);
    }
})();
