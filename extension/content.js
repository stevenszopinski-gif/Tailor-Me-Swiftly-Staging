// TailorMeSwiftly Content Script v2
(function () {
    'use strict';
    function extractJobData() {
        var host = window.location.hostname;
        var data = { title: '', company: '', description: '', url: window.location.href, source: host };

        if (host.indexOf('linkedin.com') !== -1) {
            var t = document.querySelector('.jobs-unified-top-card__job-title, .top-card-layout__title, h1');
            var c = document.querySelector('.jobs-unified-top-card__company-name, .topcard__org-name-link');
            var d = document.querySelector('.jobs-description__content, .show-more-less-html__markup, #job-details');
            data.title = t ? t.textContent.trim() : '';
            data.company = c ? c.textContent.trim() : '';
            data.description = d ? d.innerText.trim() : '';
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

        // Fallback: try generic selectors
        if (!data.description) {
            var generic = document.querySelector('[class*="description"], article, main');
            if (generic) data.description = generic.innerText.trim().substring(0, 5000);
        }
        if (!data.title) data.title = document.title.split(' - ')[0].split(' | ')[0].trim();

        data.title = data.title.trim();
        data.company = data.company.trim();
        data.description = data.description.trim();
        return data;
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'extract') {
            var data = extractJobData();
            // Save to storage and update badge
            chrome.storage.local.get('tms_captures', function (result) {
                var captures = result.tms_captures || [];
                captures.unshift({ ...data, captured_at: new Date().toISOString() });
                // Keep last 50 captures
                if (captures.length > 50) captures = captures.slice(0, 50);
                chrome.storage.local.set({ tms_job_data: data, tms_captures: captures }, function () {
                    chrome.runtime.sendMessage({ action: 'update_badge', count: captures.length });
                    sendResponse(data);
                });
            });
            return true;
        }
    });
})();
