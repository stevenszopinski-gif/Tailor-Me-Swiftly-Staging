/**
 * Streaks & Daily Login Badges (Sprint 3.1)
 * Tracks daily login streaks and awards badges at milestones.
 * Uses localStorage for fast reads, syncs to Supabase profile.
 */
(function () {
    'use strict';

    var STREAK_KEY = 'tms_streak';
    var BADGES = [
        { days: 3, label: 'Getting Started', icon: 'fa-seedling' },
        { days: 7, label: 'Week Warrior', icon: 'fa-fire' },
        { days: 14, label: 'Dedicated', icon: 'fa-medal' },
        { days: 30, label: 'Monthly Master', icon: 'fa-trophy' },
        { days: 100, label: 'Centurion', icon: 'fa-crown' }
    ];

    window.initStreaks = function () {
        var stored = null;
        try { stored = JSON.parse(localStorage.getItem(STREAK_KEY)); } catch (e) { /* ignore */ }

        var today = new Date().toISOString().split('T')[0];
        var yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (!stored) {
            stored = { current: 1, longest: 1, lastDate: today, badges: [] };
        } else if (stored.lastDate === today) {
            // Already counted today
        } else if (stored.lastDate === yesterday) {
            stored.current++;
            if (stored.current > stored.longest) stored.longest = stored.current;
        } else {
            // Streak broken
            stored.current = 1;
        }
        stored.lastDate = today;

        // Award badges
        BADGES.forEach(function (b) {
            if (stored.current >= b.days && stored.badges.indexOf(b.days) === -1) {
                stored.badges.push(b.days);
                _showBadgeToast(b);
            }
        });

        localStorage.setItem(STREAK_KEY, JSON.stringify(stored));
        _renderStreakBadge(stored);
        _syncToSupabase(stored);
    };

    function _renderStreakBadge(data) {
        // Insert streak badge into header
        var header = document.querySelector('.app-header');
        if (!header) return;

        var existing = document.getElementById('streak-display');
        if (existing) existing.remove();

        if (data.current >= 2) {
            var badge = document.createElement('span');
            badge.id = 'streak-display';
            badge.className = 'streak-badge';
            badge.innerHTML = '<i class="fa-solid fa-fire"></i> ' + data.current + ' day streak';
            badge.title = 'Longest: ' + data.longest + ' days';

            // Insert before avatar or at end
            var avatar = header.querySelector('.avatar-btn, #avatar-btn, .header-actions');
            if (avatar) {
                avatar.parentNode.insertBefore(badge, avatar);
            } else {
                header.appendChild(badge);
            }
        }
    }

    function _showBadgeToast(badge) {
        var toast = document.createElement('div');
        toast.className = 'fade-in-up';
        toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:var(--panel-bg);border:2px solid var(--warning-color);border-radius:var(--radius-lg);padding:1rem 1.5rem;z-index:9999;box-shadow:var(--brutal-shadow-hover);display:flex;align-items:center;gap:0.75rem;font-size:0.9rem;';
        toast.innerHTML = '<i class="fa-solid ' + badge.icon + '" style="font-size:1.5rem;color:var(--warning-color);"></i>' +
            '<div><strong>' + badge.label + '</strong><br><span style="font-size:0.8rem;color:var(--text-secondary);">' + badge.days + '-day streak unlocked!</span></div>';
        document.body.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 4000);
    }

    async function _syncToSupabase(data) {
        if (!window.supabaseClient) return;
        try {
            var { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;
            await window.supabaseClient.from('user_profiles').update({
                streak_data: data
            }).eq('id', user.id);
        } catch (e) {
            // Silent fail
        }
    }

    // Auto-init after auth ready
    document.addEventListener('auth-ready', function () { window.initStreaks(); });
    // Fallback if auth-ready already fired
    if (window.supabaseClient) {
        setTimeout(function () { window.initStreaks(); }, 1000);
    }
})();
