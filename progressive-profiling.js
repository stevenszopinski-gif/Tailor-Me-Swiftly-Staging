/**
 * Progressive Profiling (Sprint 7.4)
 * After 3+ sessions, prompts user for additional profile info.
 * Tracks feature usage and personalizes AI outputs.
 */
(function () {
    'use strict';

    var SESSION_KEY = 'tms_session_count';
    var PROFILED_KEY = 'tms_profiling_done';
    var PROFILE_DATA_KEY = 'tms_profile_data';

    // Increment session count
    var sessions = parseInt(localStorage.getItem(SESSION_KEY) || '0') + 1;
    localStorage.setItem(SESSION_KEY, String(sessions));

    /**
     * Show profiling prompt if user has 3+ sessions and hasn't been profiled.
     * @param {HTMLElement} container - Where to insert the prompt
     */
    window.checkProgressiveProfiling = function (container) {
        if (!container) return;
        if (sessions < 3) return;
        if (localStorage.getItem(PROFILED_KEY)) return;

        var existing = localStorage.getItem(PROFILE_DATA_KEY);
        if (existing) { localStorage.setItem(PROFILED_KEY, '1'); return; }

        var prompt = document.createElement('div');
        prompt.className = 'profile-prompt fade-in-up';
        prompt.innerHTML =
            '<h4><i class="fa-solid fa-wand-magic-sparkles"></i> Personalize Your Experience</h4>' +
            '<p>Help us tailor AI outputs to your needs.</p>' +
            '<div style="display:grid;gap:0.75rem;">' +
            '<input type="text" id="pp-target-role" placeholder="Target role (e.g. Senior Product Manager)" style="padding:0.5rem;border:var(--brutal-border);border-radius:var(--brutal-radius);background:var(--input-bg);color:var(--text-primary);">' +
            '<select id="pp-experience" style="padding:0.5rem;border:var(--brutal-border);border-radius:var(--brutal-radius);background:var(--input-bg);color:var(--text-primary);">' +
            '<option value="">Experience level...</option>' +
            '<option value="entry">Entry Level (0-2 years)</option>' +
            '<option value="mid">Mid Level (3-5 years)</option>' +
            '<option value="senior">Senior (6-10 years)</option>' +
            '<option value="lead">Lead/Principal (10+ years)</option>' +
            '<option value="exec">Executive</option>' +
            '</select>' +
            '<input type="text" id="pp-location" placeholder="Location (e.g. San Francisco, CA)" style="padding:0.5rem;border:var(--brutal-border);border-radius:var(--brutal-radius);background:var(--input-bg);color:var(--text-primary);">' +
            '</div>' +
            '<div style="display:flex;gap:0.5rem;margin-top:1rem;justify-content:flex-end;">' +
            '<button class="btn ghost-btn" onclick="this.closest(\'.profile-prompt\').remove();localStorage.setItem(\'' + PROFILED_KEY + '\',\'1\');">Skip</button>' +
            '<button class="btn primary-btn" onclick="window._saveProfile(this)">Save</button>' +
            '</div>';

        container.prepend(prompt);
    };

    window._saveProfile = function (btn) {
        var role = document.getElementById('pp-target-role').value.trim();
        var experience = document.getElementById('pp-experience').value;
        var location = document.getElementById('pp-location').value.trim();

        var data = {};
        if (role) data.targetRole = role;
        if (experience) data.experienceLevel = experience;
        if (location) data.location = location;

        if (Object.keys(data).length > 0) {
            localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(data));

            // Sync to Supabase
            if (window.supabaseClient) {
                window.supabaseClient.auth.getUser().then(function (res) {
                    if (res.data.user) {
                        window.supabaseClient.from('user_profiles').update({
                            progressive_profile: data
                        }).eq('user_id', res.data.user.id);
                    }
                });
            }
        }

        localStorage.setItem(PROFILED_KEY, '1');
        btn.closest('.profile-prompt').remove();

        if (typeof window.trackEvent === 'function') {
            window.trackEvent('profiling', 'completed', null, data);
        }
    };

    /**
     * Get the user's progressive profile data for AI prompts.
     */
    window.getProfileContext = function () {
        try {
            var data = JSON.parse(localStorage.getItem(PROFILE_DATA_KEY));
            if (!data) return '';
            var parts = [];
            if (data.targetRole) parts.push('Target role: ' + data.targetRole);
            if (data.experienceLevel) parts.push('Experience: ' + data.experienceLevel);
            if (data.location) parts.push('Location: ' + data.location);
            return parts.join('. ') + '.';
        } catch (e) { return ''; }
    };
})();
