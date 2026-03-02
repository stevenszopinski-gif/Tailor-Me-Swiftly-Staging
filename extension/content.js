// TailorMeSwiftly Content Script
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
        }
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
            chrome.storage.local.set({ tms_job_data: data }, function () { sendResponse(data); });
            return true;
        }
    });
})();
