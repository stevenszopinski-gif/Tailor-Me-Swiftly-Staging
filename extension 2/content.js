// TailorMeSwiftly Content Script v2
(function () {
    // If we are injecting into the TMS web app directly via the Tailor Now button
    if (window.location.hostname.indexOf('tailormeswiftly.com') !== -1 && window.location.search.includes('ext_load=true')) {
        chrome.storage.local.get('tms_job_data', function (result) {
            if (result.tms_job_data) {
                // Write directly to the page's localStorage so app.js can read it
                localStorage.setItem('tms_ext_payload', JSON.stringify(result.tms_job_data));

                // Dispatch a custom event — does NOT require unsafe-inline and is CSP-safe
                window.dispatchEvent(new CustomEvent('tms_ext_payload_ready'));
            }
        });
        return; // Don't run the extraction logic on our own app
    }

    function extractJobData() {
        var host = window.location.hostname;
        var data = { title: '', company: '', description: '', url: window.location.href, source: host };

        if (host.indexOf('linkedin.com') !== -1) {
            // LinkedIn job detail panel selectors (search results, recommendations, and direct view)
            var t = document.querySelector(
                '.job-details-jobs-unified-top-card__job-title a, ' +
                '.job-details-jobs-unified-top-card__job-title, ' +
                '.jobs-unified-top-card__job-title a, ' +
                '.jobs-unified-top-card__job-title, ' +
                '.t-24.job-details-jobs-unified-top-card__job-title, ' +
                '.top-card-layout__title, ' +
                '.topcard__title, ' +
                'h1.t-24, h1.t-20, ' +
                'h2.t-24'
            );
            var c = document.querySelector(
                '.job-details-jobs-unified-top-card__company-name a, ' +
                '.job-details-jobs-unified-top-card__company-name, ' +
                '.jobs-unified-top-card__company-name a, ' +
                '.jobs-unified-top-card__company-name, ' +
                '.job-details-jobs-unified-top-card__primary-description-container a, ' +
                '.topcard__org-name-link, ' +
                '.top-card-layout__second-subline a'
            );
            // Try multiple description containers — LinkedIn changes these often
            // Also target the right-side detail panel on search/collections pages
            var descSelectors = [
                '#job-details',
                '.jobs-search__job-details #job-details',
                '.jobs-description-content__text',
                '.jobs-description__content',
                '.jobs-description__content--condensed',
                '.show-more-less-html__markup',
                '.jobs-box__html-content',
                '.jobs-search__job-details .show-more-less-html__markup',
                '[class*="jobs-description"]',
                '.scaffold-layout__detail [class*="description"]',
            ];
            var d = null;
            for (var di = 0; di < descSelectors.length; di++) {
                var candidate = document.querySelector(descSelectors[di]);
                if (candidate && candidate.innerText.trim().length > 100) {
                    d = candidate;
                    break;
                }
            }
            data.title = t ? t.textContent.trim() : '';
            data.company = c ? c.textContent.trim() : '';
            data.description = d ? d.innerText.trim() : '';

            // On search/collections pages, use currentJobId for a direct job link
            var jobIdMatch = window.location.search.match(/currentJobId=(\d+)/);
            if (jobIdMatch) {
                data.url = 'https://www.linkedin.com/jobs/view/' + jobIdMatch[1] + '/';
            }
        } else if (host.indexOf('indeed.com') !== -1) {
            data.title = (document.querySelector('.jobsearch-JobInfoHeader-title, h1') || {}).textContent || '';
            data.company = (document.querySelector('[data-testid="inlineHeader-companyName"]') || {}).textContent || '';
            data.description = (document.querySelector('#jobDescriptionText') || {}).innerText || '';
        } else if (host.indexOf('greenhouse.io') !== -1) {
            data.title = (document.querySelector('.app-title, h1') || {}).textContent || '';
            data.description = (document.querySelector('#content .body, #content') || {}).innerText || '';
        } else if (host.indexOf('lever.co') !== -1) {
            data.title = (document.querySelector('.posting-headline h2, h2') || {}).textContent || '';
            data.description = (document.querySelector('.posting-page .content') || {}).innerText || '';
        } else if (host.indexOf('glassdoor.com') !== -1) {
            data.title = (document.querySelector('[data-test="jobTitle"]') || {}).textContent || '';
            data.company = (document.querySelector('[data-test="employerName"]') || {}).textContent || '';
            data.description = (document.querySelector('.jobDescriptionContent, #JobDescriptionContainer') || {}).innerText || '';
        } else if (host.indexOf('workday') !== -1 || host.indexOf('myworkdayjobs') !== -1) {
            data.title = (document.querySelector('[data-automation-id="jobPostingHeader"], h2') || {}).textContent || '';
            data.description = (document.querySelector('[data-automation-id="jobPostingDescription"]') || {}).innerText || '';
            data.company = (document.querySelector('[data-automation-id="company"]') || {}).textContent || '';
        } else if (host.indexOf('icims.com') !== -1) {
            data.title = (document.querySelector('.iCIMS_Header h1, h1') || {}).textContent || '';
            data.description = (document.querySelector('.iCIMS_JobContent, .iCIMS_InfoMsg_Job') || {}).innerText || '';
        } else if (host.indexOf('smartrecruiters.com') !== -1) {
            data.title = (document.querySelector('h1.job-title, h1') || {}).textContent || '';
            data.company = (document.querySelector('.company-name') || {}).textContent || '';
            data.description = (document.querySelector('.job-description, .job-sections') || {}).innerText || '';
        } else if (host.indexOf('bamboohr.com') !== -1) {
            data.title = (document.querySelector('.ResAts__JobPostingHeader h2, h2') || {}).textContent || '';
            data.description = (document.querySelector('.BambooRichText, .ResAts__JobDescription') || {}).innerText || '';
        } else if (host.indexOf('ashbyhq.com') !== -1) {
            data.title = (document.querySelector('h1') || {}).textContent || '';
            data.description = (document.querySelector('[class*="jobDescription"], [class*="posting-"]') || {}).innerText || '';
        } else if (host.indexOf('wellfound.com') !== -1) {
            data.title = (document.querySelector('h1') || {}).textContent || '';
            data.company = (document.querySelector('[class*="companyName"]') || {}).textContent || '';
            data.description = (document.querySelector('[class*="description"], [class*="jobDescription"]') || {}).innerText || '';
        }

        // Fallback: try generic selectors, finding the one with the most text
        if (!data.description) {
            var generics = document.querySelectorAll('[id*="job"], [class*="jobDescription"], [class*="job-description"], [class*="description"], article, main, .posting-requirements, .job-details');
            var bestText = '';
            for (var i = 0; i < generics.length; i++) {
                var text = (generics[i].innerText || '').trim();
                // We want the most substantial block of text (likely the JD)
                if (text.length > bestText.length && text.length < 25000) {
                    bestText = text;
                }
            }
            if (bestText.length > 150) {
                data.description = bestText.substring(0, 10000);
            }
        }

        // Nuclear Fallback: only for unknown sites — skip for known job boards
        // where grabbing body text produces feed/navigation garbage
        var knownJobBoards = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'greenhouse.io', 'lever.co', 'workday', 'myworkdayjobs', 'icims.com', 'smartrecruiters.com', 'bamboohr.com', 'ashbyhq.com', 'wellfound.com'];
        var isKnownBoard = knownJobBoards.some(function (b) { return host.indexOf(b) !== -1; });
        if (!data.description && document.body && !isKnownBoard) {
            var bodyText = document.body.innerText.trim();
            if (bodyText.length > 200) {
                data.description = bodyText.substring(0, 10000);
            }
        }
        if (!data.title) data.title = document.title.split(' - ')[0].split(' | ')[0].trim();

        data.title = data.title.trim();
        data.company = data.company.trim();
        data.description = data.description.trim();
        return data;
    }

    function saveAndRespond(data, sendResponse) {
        chrome.storage.local.get('tms_captures', function (result) {
            var captures = result.tms_captures || [];
            captures.unshift({ ...data, captured_at: new Date().toISOString() });
            if (captures.length > 50) captures = captures.slice(0, 50);
            chrome.storage.local.set({ tms_job_data: data, tms_captures: captures }, function () {
                chrome.runtime.sendMessage({ action: 'update_badge', count: captures.length });
                sendResponse(data);
            });
        });
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'extract') {
            var data = extractJobData();

            // LinkedIn split-view: right panel loads async when a job is clicked.
            // If we didn't find a description, wait for it to render and retry.
            if (!data.description && window.location.hostname.indexOf('linkedin.com') !== -1) {
                var retries = 0;
                var maxRetries = 3;
                var retryInterval = setInterval(function () {
                    retries++;
                    var retryData = extractJobData();
                    if (retryData.description || retries >= maxRetries) {
                        clearInterval(retryInterval);
                        saveAndRespond(retryData.description ? retryData : data, sendResponse);
                    }
                }, 800);
            } else {
                saveAndRespond(data, sendResponse);
            }
            return true; // keep message channel open for async response
        }
    });
})();
