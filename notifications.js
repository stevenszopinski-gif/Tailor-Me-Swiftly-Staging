/**
 * Stale Application Nudges (Sprint 2.3) & Time Saved Counter (Sprint 3.2)
 * Shows reminders for applications older than 7 days without follow-up.
 * Also calculates and displays time saved.
 */
(function () {
    'use strict';

    var DISMISSED_KEY = 'tms_dismissed_nudges';
    var TIME_PER_ACTION = {
        resume: 30,      // minutes
        'cover-letter': 20,
        briefing: 15,
        interview: 25,
        outreach: 15,
        other: 10
    };

    /**
     * Check for stale applications and show nudge banners.
     * @param {HTMLElement} container - Where to insert nudge banners
     */
    window.checkStaleApps = async function (container) {
        if (!container || !window.supabaseClient) return;

        try {
            var { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            var sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
            var { data: staleApps } = await window.supabaseClient
                .from('generations')
                .select('id, target_company, created_at, interview_meta')
                .eq('user_id', user.id)
                .lt('created_at', sevenDaysAgo)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!staleApps || staleApps.length === 0) return;

            var dismissed = [];
            try { dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch (e) { /* ignore */ }

            staleApps.forEach(function (app) {
                if (dismissed.indexOf(app.id) !== -1) return;
                if (app.interview_meta && app.interview_meta.follow_ups && app.interview_meta.follow_ups.length > 0) return;

                var daysAgo = Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86400000);
                var company = app.target_company || 'an application';

                var nudge = document.createElement('div');
                nudge.className = 'nudge-banner fade-in-up';
                nudge.innerHTML = '<i class="fa-solid fa-bell" style="color:var(--warning-color);"></i>' +
                    '<span>You applied to <strong>' + company + '</strong> ' + daysAgo + ' days ago — time to follow up?</span>' +
                    '<span class="nudge-dismiss" data-id="' + app.id + '" title="Dismiss"><i class="fa-solid fa-xmark"></i></span>';

                nudge.querySelector('.nudge-dismiss').addEventListener('click', function () {
                    var id = this.getAttribute('data-id');
                    dismissed.push(id);
                    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
                    nudge.remove();
                });

                container.prepend(nudge);
            });
        } catch (e) {
            console.warn('[Nudges] Error:', e.message);
        }
    };

    /**
     * Calculate and display time saved.
     * @param {HTMLElement} container - Where to show the counter
     */
    window.showTimeSaved = async function (container) {
        if (!container || !window.supabaseClient) return;

        try {
            var { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            var { count } = await window.supabaseClient
                .from('generations')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);

            var { count: briefingCount } = await window.supabaseClient
                .from('daily_briefings')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);

            var totalMinutes = (count || 0) * TIME_PER_ACTION.resume + (briefingCount || 0) * TIME_PER_ACTION.briefing;
            if (totalMinutes < 5) return;

            var hours = (totalMinutes / 60).toFixed(1);
            var display = totalMinutes >= 60 ? hours + ' hours' : totalMinutes + ' min';

            container.innerHTML = '<div class="time-saved"><i class="fa-solid fa-clock"></i> ~' + display + ' saved with TailorMeSwiftly</div>';

            // Animate the number
            _animateCounter(container.querySelector('.time-saved'), totalMinutes);
        } catch (e) {
            console.warn('[TimeSaved] Error:', e.message);
        }
    };

    function _animateCounter(el, target) {
        if (!el) return;
        var hours = target / 60;
        var display = target >= 60 ? hours.toFixed(1) + ' hours' : target + ' min';
        var current = 0;
        var step = Math.max(1, Math.floor(target / 30));
        var interval = setInterval(function () {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            var d = current >= 60 ? (current / 60).toFixed(1) + ' hours' : current + ' min';
            el.innerHTML = '<i class="fa-solid fa-clock"></i> ~' + d + ' saved with TailorMeSwiftly';
        }, 30);
    }
})();
