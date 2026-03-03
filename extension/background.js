// TailorMeSwiftly Background Service Worker
// Manages badge count and capture history

chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'update_badge') {
        var count = request.count || 0;
        chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
});

// Initialize badge on install/startup
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.get('tms_captures', function (result) {
        var count = (result.tms_captures || []).length;
        if (count > 0) {
            chrome.action.setBadgeText({ text: String(count) });
            chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
        }
    });
});
