/**
 * TailorMeSwiftly Analytics Module
 * Lightweight event tracker using Supabase analytics_events table.
 * Extends auth.js trackPageView with full event tracking.
 */
(function () {
    'use strict';

    const EVENT_QUEUE = [];
    let _flushing = false;

    /**
     * Track a custom event.
     * @param {string} category - Event category (e.g. 'resume', 'briefing', 'navigation')
     * @param {string} action - Event action (e.g. 'generate', 'download', 'click')
     * @param {string} [label] - Optional label (e.g. tool name, button id)
     * @param {object} [metadata] - Optional extra data
     */
    window.trackEvent = function (category, action, label, metadata) {
        if (!category || !action) return;

        const event = {
            event_type: category + ':' + action,
            page_path: window.location.pathname,
            metadata: Object.assign({
                category: category,
                action: action,
                label: label || null,
                url: window.location.href,
                timestamp: new Date().toISOString()
            }, metadata || {})
        };

        EVENT_QUEUE.push(event);
        _flushQueue();
    };

    async function _flushQueue() {
        if (_flushing || EVENT_QUEUE.length === 0) return;
        if (!window.supabaseClient) return;

        _flushing = true;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const batch = EVENT_QUEUE.splice(0, EVENT_QUEUE.length);
            const rows = batch.map(function (evt) {
                evt.user_id = user ? user.id : null;
                evt.metadata.user_agent = navigator.userAgent;
                return evt;
            });

            await window.supabaseClient.from('analytics_events').insert(rows);
        } catch (e) {
            // Silent fail — analytics should never block UX
            console.warn('[Analytics] flush error:', e.message);
        }
        _flushing = false;
    }

    /**
     * Track time spent on page (fires on visibilitychange or beforeunload).
     */
    let _pageStart = Date.now();
    function _trackTimeOnPage() {
        var seconds = Math.round((Date.now() - _pageStart) / 1000);
        if (seconds > 2) {
            window.trackEvent('engagement', 'time_on_page', window.location.pathname, {
                seconds: seconds
            });
        }
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') _trackTimeOnPage();
    });
    window.addEventListener('beforeunload', _trackTimeOnPage);

    /**
     * Auto-track outbound link clicks.
     */
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href && href.startsWith('http') && !href.includes(window.location.host)) {
            window.trackEvent('navigation', 'outbound_click', href);
        }
    });

})();
