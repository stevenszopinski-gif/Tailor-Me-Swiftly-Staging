/**
 * Command Palette — Cmd+K / Ctrl+K quick actions.
 * Fuzzy match against registered actions.
 */
(function () {
    'use strict';

    var P = window.TMS_PATH_PREFIX || '';

    var actions = [
        { label: 'Go to Dashboard', icon: 'fa-compass', action: function () { window.location.href = P + 'dashboard.html'; } },
        { label: 'New Resume Tailoring', icon: 'fa-file-lines', action: function () { window.location.href = P + 'app.html'; } },
        { label: 'News Briefing', icon: 'fa-newspaper', action: function () { window.location.href = P + 'news/briefing.html'; } },
        { label: 'Cover Letter', icon: 'fa-envelope', action: function () { window.location.href = P + 'cover-letter.html'; } },
        { label: 'Interview Prep', icon: 'fa-comments', action: function () { window.location.href = P + 'interview-prep.html'; } },
        { label: 'Application History', icon: 'fa-clock-rotate-left', action: function () { window.location.href = P + 'history.html'; } },
        { label: 'Account Settings', icon: 'fa-user-gear', action: function () { window.location.href = P + 'account.html'; } },
        { label: 'Toggle Dark Mode', icon: 'fa-moon', action: function () {
            var theme = document.body.getAttribute('data-theme');
            var next = theme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem('tms_theme_preference', next);
        }},
        { label: 'Pricing', icon: 'fa-tag', action: function () { window.location.href = P + 'pricing.html'; } },
        { label: 'Help Center', icon: 'fa-circle-question', action: function () { window.location.href = P + 'help.html'; } },
        { label: 'Release Notes', icon: 'fa-bullhorn', action: function () { window.location.href = P + 'updates.html'; } },
        { label: 'Salary Negotiator', icon: 'fa-money-bill-trend-up', action: function () { window.location.href = P + 'salary-negotiator.html'; } },
        { label: 'Outreach Messages', icon: 'fa-paper-plane', action: function () { window.location.href = P + 'outreach.html'; } },
        { label: 'Career Pivot', icon: 'fa-route', action: function () { window.location.href = P + 'career-pivot.html'; } },
        { label: 'Shadow Jobs Practice', icon: 'fa-ghost', action: function () { window.location.href = P + 'shadow-jobs.html'; } },
        { label: 'Blog', icon: 'fa-blog', action: function () { window.location.href = P + 'blog.html'; } }
    ];

    var isOpen = false;
    var selectedIndex = 0;
    var filteredActions = actions;

    document.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (isOpen) { close(); } else { open(); }
        }
        if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            close();
        }
    });

    function open() {
        isOpen = true;
        selectedIndex = 0;
        filteredActions = actions.slice();

        var overlay = document.createElement('div');
        overlay.className = 'command-palette-overlay';
        overlay.id = 'command-palette-overlay';
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        var palette = document.createElement('div');
        palette.className = 'command-palette';

        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type a command...';
        input.addEventListener('input', function () { filter(this.value); });
        input.addEventListener('keydown', handleKeydown);

        var results = document.createElement('div');
        results.className = 'command-palette-results';
        results.id = 'command-palette-results';

        palette.appendChild(input);
        palette.appendChild(results);
        overlay.appendChild(palette);
        document.body.appendChild(overlay);

        renderResults();
        input.focus();

        if (typeof window.trackEvent === 'function') {
            window.trackEvent('navigation', 'command_palette_open');
        }
    }

    function close() {
        isOpen = false;
        var el = document.getElementById('command-palette-overlay');
        if (el) el.remove();
    }

    function filter(query) {
        var q = query.toLowerCase().trim();
        if (!q) {
            filteredActions = actions.slice();
        } else {
            filteredActions = actions.filter(function (a) {
                return a.label.toLowerCase().indexOf(q) !== -1;
            });
        }
        selectedIndex = 0;
        renderResults();
    }

    function renderResults() {
        var container = document.getElementById('command-palette-results');
        if (!container) return;

        container.innerHTML = filteredActions.map(function (a, i) {
            return '<div class="command-palette-item' + (i === selectedIndex ? ' selected' : '') + '" data-index="' + i + '">' +
                '<i class="fa-solid ' + a.icon + '"></i>' +
                '<span>' + a.label + '</span>' +
                '</div>';
        }).join('');

        // Click handlers
        container.querySelectorAll('.command-palette-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var idx = parseInt(this.getAttribute('data-index'));
                execute(idx);
            });
        });
    }

    function handleKeydown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, filteredActions.length - 1);
            renderResults();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            renderResults();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            execute(selectedIndex);
        }
    }

    function execute(index) {
        if (filteredActions[index]) {
            close();
            filteredActions[index].action();
        }
    }
})();
