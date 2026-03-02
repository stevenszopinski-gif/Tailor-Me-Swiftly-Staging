/**
 * TailorMeSwiftly Chrome Extension - Popup Logic
 *
 * Handles capture button clicks, displays extracted data,
 * and provides "Open in TMS" functionality.
 */

(function () {
    'use strict';

    const TMS_BASE_URL = 'https://tailormeswiftly.com';

    const captureBtn = document.getElementById('capture-btn');
    const statusArea = document.getElementById('status-area');
    const openTmsBtn = document.getElementById('open-tms-btn');

    let capturedData = null;

    // ── Utility ──

    function setStatus(text, isData) {
        statusArea.textContent = text;
        statusArea.classList.toggle('has-data', !!isData);
    }

    function setStatusHTML(html) {
        statusArea.innerHTML = html;
        statusArea.classList.add('has-data');
    }

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    // ── Capture Flow ──

    captureBtn.addEventListener('click', function () {
        captureBtn.disabled = true;
        captureBtn.textContent = 'Capturing...';
        setStatus('Extracting job details from page...');

        // Send message to the content script in the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs || tabs.length === 0) {
                setStatus('No active tab found. Please navigate to a job posting.');
                captureBtn.disabled = false;
                captureBtn.textContent = 'Capture Job Description';
                return;
            }

            const tab = tabs[0];

            // Check if we're on a supported site
            const url = tab.url || '';
            const isSupported = /linkedin\.com\/jobs|indeed\.com|greenhouse\.io|lever\.co/.test(url);

            if (!isSupported) {
                setStatus('This page is not a supported job board.\n\nNavigate to a job posting on LinkedIn, Indeed, Greenhouse, or Lever and try again.');
                captureBtn.disabled = false;
                captureBtn.textContent = 'Capture Job Description';
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: 'extract' }, function (response) {
                captureBtn.disabled = false;
                captureBtn.textContent = 'Capture Job Description';

                if (chrome.runtime.lastError) {
                    setStatus('Could not connect to page.\n\nTry refreshing the job posting page and clicking Capture again.');
                    return;
                }

                if (!response) {
                    setStatus('No response from page. Please refresh and try again.');
                    return;
                }

                if (!response.success) {
                    setStatus('Extraction failed: ' + (response.error || 'Unknown error') + '\n\nMake sure you are on a job posting page.');
                    return;
                }

                // Success
                capturedData = response;

                setStatusHTML(
                    '<span class="status-label">Captured Successfully</span>' +
                    '<strong>Title:</strong> ' + escapeHTML(response.title || 'N/A') + '\n' +
                    '<strong>Company:</strong> ' + escapeHTML(response.company || 'N/A') + '\n' +
                    '<strong>Board:</strong> ' + escapeHTML(response.board) + '\n' +
                    '<strong>Description:</strong> ' + escapeHTML(truncate(response.description, 200))
                );

                openTmsBtn.disabled = false;
            });
        });
    });

    // ── Open in TMS ──

    openTmsBtn.addEventListener('click', function () {
        if (!capturedData) return;

        // Build URL with job data as query params
        const params = new URLSearchParams();

        if (capturedData.title) {
            params.set('job_title', capturedData.title);
        }
        if (capturedData.company) {
            params.set('company', capturedData.company);
        }
        if (capturedData.description) {
            // URL-encode the description (truncate to avoid URL length limits)
            params.set('job_description', capturedData.description.substring(0, 4000));
        }
        if (capturedData.url) {
            params.set('source_url', capturedData.url);
        }

        const tmsUrl = TMS_BASE_URL + '/app.html?' + params.toString();

        chrome.tabs.create({ url: tmsUrl });
    });

    // ── Load Any Previously Captured Data ──

    chrome.storage.local.get('tms_captured_job', function (result) {
        if (result.tms_captured_job && result.tms_captured_job.success) {
            capturedData = result.tms_captured_job;

            const age = Date.now() - new Date(capturedData.capturedAt).getTime();
            const isRecent = age < 30 * 60 * 1000; // 30 minutes

            if (isRecent) {
                setStatusHTML(
                    '<span class="status-label">Last Capture (still available)</span>' +
                    '<strong>Title:</strong> ' + escapeHTML(capturedData.title || 'N/A') + '\n' +
                    '<strong>Company:</strong> ' + escapeHTML(capturedData.company || 'N/A') + '\n' +
                    '<strong>Board:</strong> ' + escapeHTML(capturedData.board)
                );
                openTmsBtn.disabled = false;
            }
        }
    });

    // ── HTML Escaping ──

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
