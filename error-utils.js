/**
 * error-utils.js — Client-side error monitoring for TailorMeSwiftly
 * Buffers errors and batch-flushes to Supabase every 10s or on page unload.
 * Include after auth.js on every page.
 */
(function () {
    'use strict';

    const ERROR_BUFFER = [];
    const FLUSH_INTERVAL_MS = 10000;
    const MAX_BUFFER_SIZE = 20;

    function getUser() {
        try {
            const raw = localStorage.getItem('sb-ohtdrboxcjmimpeqkgny-auth-token');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.user?.id || parsed?.currentSession?.user?.id || null;
        } catch { return null; }
    }

    function pushError(message, stack, metadata) {
        if (ERROR_BUFFER.length >= MAX_BUFFER_SIZE) return;
        ERROR_BUFFER.push({
            user_id: getUser(),
            error_message: String(message).slice(0, 2000),
            error_stack: stack ? String(stack).slice(0, 4000) : null,
            page_url: location.pathname + location.search,
            metadata: metadata || {},
            created_at: new Date().toISOString()
        });
    }

    async function flushErrors() {
        if (!ERROR_BUFFER.length || !window.supabaseClient) return;
        const batch = ERROR_BUFFER.splice(0, ERROR_BUFFER.length);
        try {
            await window.supabaseClient.from('error_logs').insert(batch);
        } catch {
            // Silently fail — don't create error loops
        }
    }

    // Global error handlers
    window.addEventListener('error', function (e) {
        pushError(
            e.message || 'Unknown error',
            e.error?.stack || `${e.filename}:${e.lineno}:${e.colno}`,
            { type: 'uncaught' }
        );
    });

    window.addEventListener('unhandledrejection', function (e) {
        const reason = e.reason;
        pushError(
            reason?.message || String(reason),
            reason?.stack || null,
            { type: 'unhandled_rejection' }
        );
    });

    // Manual logging API
    window.logError = function (message, metadata) {
        pushError(message, new Error().stack, { type: 'manual', ...metadata });
    };

    // Periodic flush
    setInterval(flushErrors, FLUSH_INTERVAL_MS);

    // Flush on page unload
    window.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') flushErrors();
    });
    window.addEventListener('pagehide', flushErrors);
})();
