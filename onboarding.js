/**
 * Onboarding Tour — first-time user walkthrough.
 * Shows step-by-step tooltip overlay highlighting key features.
 * Checks localStorage flag 'tms_onboarded'.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'tms_onboarded';
    if (localStorage.getItem(STORAGE_KEY)) return;

    var steps = [
        {
            selector: '.app-grid-btn',
            title: 'Product Switcher',
            text: 'Switch between Applications, News, and Learning tools from this menu.',
            position: 'bottom'
        },
        {
            selector: '.maker-mark',
            title: 'Your Dashboard',
            text: 'Click the logo anytime to return to your dashboard with all your applications.',
            position: 'bottom'
        },
        {
            selector: '.avatar-btn, #avatar-btn',
            title: 'Your Account',
            text: 'Access settings, history, and account preferences from your profile menu.',
            position: 'bottom-end'
        }
    ];

    // Only run on dashboard or main pages
    var path = window.location.pathname;
    if (path.indexOf('login') !== -1 || path.indexOf('signup') !== -1) return;

    var currentStep = 0;
    var overlay = null;
    var tooltip = null;

    function start() {
        // Wait for auth-ready so UI elements exist
        setTimeout(function () {
            // Filter steps to only those with visible elements
            steps = steps.filter(function (s) {
                var el = document.querySelector(s.selector);
                return el && el.offsetParent !== null;
            });
            if (steps.length === 0) {
                localStorage.setItem(STORAGE_KEY, '1');
                return;
            }
            showStep(0);
        }, 2000);
    }

    function showStep(index) {
        currentStep = index;
        cleanup();

        if (index >= steps.length) {
            localStorage.setItem(STORAGE_KEY, '1');
            return;
        }

        var step = steps[index];
        var target = document.querySelector(step.selector);
        if (!target) {
            showStep(index + 1);
            return;
        }

        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.addEventListener('click', dismiss);
        document.body.appendChild(overlay);

        // Create spotlight
        var rect = target.getBoundingClientRect();
        var spotlight = document.createElement('div');
        spotlight.className = 'onboarding-spotlight';
        spotlight.style.top = (rect.top - 6) + 'px';
        spotlight.style.left = (rect.left - 6) + 'px';
        spotlight.style.width = (rect.width + 12) + 'px';
        spotlight.style.height = (rect.height + 12) + 'px';
        document.body.appendChild(spotlight);

        // Create tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';

        // Progress dots
        var dotsHtml = '<div class="onboarding-progress">';
        for (var i = 0; i < steps.length; i++) {
            dotsHtml += '<span class="dot' + (i === index ? ' active' : '') + '"></span>';
        }
        dotsHtml += '</div>';

        tooltip.innerHTML = dotsHtml +
            '<h4>' + step.title + '</h4>' +
            '<p>' + step.text + '</p>' +
            '<div class="onboarding-actions">' +
            '<button class="btn ghost-btn" onclick="window._onboardingDismiss()">Skip</button>' +
            '<button class="btn primary-btn" onclick="window._onboardingNext()">' +
            (index < steps.length - 1 ? 'Next' : 'Done') +
            '</button></div>';

        // Position tooltip
        tooltip.style.top = (rect.bottom + 12) + 'px';
        tooltip.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - 340)) + 'px';

        document.body.appendChild(tooltip);
    }

    function cleanup() {
        if (overlay) { overlay.remove(); overlay = null; }
        var sp = document.querySelector('.onboarding-spotlight');
        if (sp) sp.remove();
        if (tooltip) { tooltip.remove(); tooltip = null; }
    }

    function dismiss() {
        cleanup();
        localStorage.setItem(STORAGE_KEY, '1');
    }

    window._onboardingDismiss = dismiss;
    window._onboardingNext = function () {
        showStep(currentStep + 1);
    };

    // Start after DOM is ready and auth has initialized
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
