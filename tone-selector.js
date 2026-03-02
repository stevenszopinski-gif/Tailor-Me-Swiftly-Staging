/**
 * Tone Selector for AI Outputs (Sprint 2.5)
 * Adds a tone dropdown/chips before AI generation.
 * Stores preference in localStorage.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'tms_tone_preference';
    var TONES = [
        { id: 'professional', label: 'Professional', prompt: 'Use a professional, polished tone.' },
        { id: 'casual', label: 'Casual', prompt: 'Use a friendly, conversational tone.' },
        { id: 'confident', label: 'Confident', prompt: 'Use a confident, assertive tone that showcases achievements boldly.' },
        { id: 'creative', label: 'Creative', prompt: 'Use a creative, engaging tone with vivid language.' }
    ];

    window.getTonePreference = function () {
        return localStorage.getItem(STORAGE_KEY) || 'professional';
    };

    window.getTonePrompt = function () {
        var id = window.getTonePreference();
        var tone = TONES.find(function (t) { return t.id === id; });
        return tone ? tone.prompt : TONES[0].prompt;
    };

    /**
     * Render tone selector chips into a container element.
     * @param {string|HTMLElement} containerOrSelector
     */
    window.renderToneSelector = function (containerOrSelector) {
        var container = typeof containerOrSelector === 'string'
            ? document.querySelector(containerOrSelector)
            : containerOrSelector;
        if (!container) return;

        var current = window.getTonePreference();
        var html = '<div class="tone-selector">';
        TONES.forEach(function (t) {
            html += '<button class="tone-chip' + (t.id === current ? ' active' : '') + '" data-tone="' + t.id + '">' + t.label + '</button>';
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.tone-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                var tone = this.getAttribute('data-tone');
                localStorage.setItem(STORAGE_KEY, tone);
                container.querySelectorAll('.tone-chip').forEach(function (c) { c.classList.remove('active'); });
                this.classList.add('active');
                if (typeof window.trackEvent === 'function') {
                    window.trackEvent('settings', 'tone_change', tone);
                }
            });
        });
    };
})();
