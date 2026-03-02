/**
 * TailorMeSwiftly Chrome Extension - Content Script
 *
 * Runs on supported job boards to extract job title, company, and description.
 * Stores extracted data in chrome.storage.local and messages the popup.
 *
 * Supported boards:
 *   - LinkedIn Jobs
 *   - Indeed
 *   - Greenhouse
 *   - Lever
 */

(function () {
    'use strict';

    // ── Board Detection ──

    const hostname = window.location.hostname;

    function detectBoard() {
        if (hostname.includes('linkedin.com')) return 'linkedin';
        if (hostname.includes('indeed.com')) return 'indeed';
        if (hostname.includes('greenhouse.io')) return 'greenhouse';
        if (hostname.includes('lever.co')) return 'lever';
        return null;
    }

    // ── Extraction Helpers ──

    function getTextContent(selector) {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
    }

    function getInnerHTML(selector) {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
    }

    // ── Board-Specific Extractors ──

    function extractLinkedIn() {
        const title = getTextContent('.jobs-unified-top-card__job-title, .top-card-layout__title, h1.t-24') ||
                      getTextContent('h1');
        const company = getTextContent('.jobs-unified-top-card__company-name a, .topcard__org-name-link, .top-card-layout__second-subline a') ||
                        getTextContent('.jobs-unified-top-card__company-name');
        const description = getInnerHTML('.jobs-description__content .jobs-box__html-content, .jobs-description-content__text, .show-more-less-html__markup') ||
                            getInnerHTML('.jobs-description__content') ||
                            getInnerHTML('.description__text');
        return { title, company, description };
    }

    function extractIndeed() {
        const title = getTextContent('.jobsearch-JobInfoHeader-title, h1.icl-u-xs-mb--xs, h1[data-testid="jobsearch-JobInfoHeader-title"]') ||
                      getTextContent('h1');
        const company = getTextContent('[data-company-name] a, .icl-u-lg-mr--sm, [data-testid="inlineHeader-companyName"] a') ||
                        getTextContent('[data-company-name]');
        const description = getInnerHTML('#jobDescriptionText') ||
                            getInnerHTML('.jobsearch-JobComponent-description') ||
                            getInnerHTML('#jobDescription');
        return { title, company, description };
    }

    function extractGreenhouse() {
        const title = getTextContent('.app-title, #header .company-name + h1, h1.heading') ||
                      getTextContent('h1');
        const company = getTextContent('.company-name, #header .company-name') ||
                        '';
        const description = getInnerHTML('#content .body, #content .content, .job__description') ||
                            getInnerHTML('#content') ||
                            getInnerHTML('.job-post-content');
        return { title, company, description };
    }

    function extractLever() {
        const title = getTextContent('.posting-headline h2, .section-header h1') ||
                      getTextContent('h2');
        const company = getTextContent('.posting-headline .company-header-name, .main-header-logo a') ||
                        '';
        // Lever descriptions are often in multiple .section-wrapper blocks
        const sections = document.querySelectorAll('.posting-page .section-wrapper .section, .content .section');
        let description = '';
        if (sections.length > 0) {
            sections.forEach(function (sec) {
                description += sec.innerText.trim() + '\n\n';
            });
            description = description.trim();
        }
        if (!description) {
            description = getInnerHTML('.content') || getInnerHTML('.posting-page');
        }
        return { title, company, description };
    }

    // ── Main Extraction ──

    function extractJobData() {
        const board = detectBoard();
        if (!board) {
            return { success: false, board: null, error: 'Unsupported job board' };
        }

        let data;
        switch (board) {
            case 'linkedin':    data = extractLinkedIn(); break;
            case 'indeed':      data = extractIndeed(); break;
            case 'greenhouse':  data = extractGreenhouse(); break;
            case 'lever':       data = extractLever(); break;
            default:            return { success: false, board: board, error: 'No extractor for ' + board };
        }

        // Truncate very long descriptions to 8000 chars to keep storage manageable
        if (data.description && data.description.length > 8000) {
            data.description = data.description.substring(0, 8000) + '\n\n[Truncated]';
        }

        return {
            success: true,
            board: board,
            title: data.title || '',
            company: data.company || '',
            description: data.description || '',
            url: window.location.href,
            capturedAt: new Date().toISOString()
        };
    }

    // ── Message Listener (from popup) ──

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action === 'extract') {
            const result = extractJobData();

            if (result.success) {
                // Store in chrome.storage.local for persistence
                chrome.storage.local.set({ tms_captured_job: result }, function () {
                    sendResponse(result);
                });
            } else {
                sendResponse(result);
            }

            // Return true to indicate async response
            return true;
        }

        if (message.action === 'detect') {
            const board = detectBoard();
            sendResponse({ board: board, url: window.location.href });
            return false;
        }
    });

    // ── Auto-detect on load ──
    // Notify storage that a supported page is loaded (so popup can show status)
    const board = detectBoard();
    if (board) {
        chrome.storage.local.set({ tms_current_board: board });
    }
})();
