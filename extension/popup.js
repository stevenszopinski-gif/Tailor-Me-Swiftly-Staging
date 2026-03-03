// Load recent captures on popup open
chrome.storage.local.get('tms_captures', function (result) {
    var captures = result.tms_captures || [];
    var historyEl = document.getElementById('capture-history');
    if (captures.length > 0 && historyEl) {
        historyEl.innerHTML = '<div class="history-label">Recent captures (' + captures.length + ')</div>';
        captures.slice(0, 5).forEach(function (c) {
            var item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = (c.title || 'Unknown') + (c.company ? ' — ' + c.company : '');
            item.title = c.description ? c.description.substring(0, 200) : '';
            item.addEventListener('click', function () {
                chrome.storage.local.set({ tms_job_data: c });
                openInTMS(c);
            });
            historyEl.appendChild(item);
        });
        historyEl.style.display = 'block';
    }
});

document.getElementById('capture-btn').addEventListener('click', function () {
    var btn = this;
    var status = document.getElementById('status');
    btn.disabled = true;
    btn.textContent = 'Capturing...';
    status.textContent = 'Extracting job data...';
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]) { status.textContent = 'No active tab found.'; btn.disabled = false; btn.textContent = 'Capture Job Description'; return; }
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extract' }, function (response) {
            btn.disabled = false;
            btn.textContent = 'Capture Job Description';
            if (chrome.runtime.lastError) { status.textContent = 'Not on a supported job board. Try LinkedIn, Indeed, Greenhouse, Lever, Workday, or more.'; return; }
            if (response && response.description) {
                status.className = 'status has-data';
                status.textContent = (response.title ? response.title + (response.company ? ' at ' + response.company : '') + '\n\n' : '') + response.description.substring(0, 500) + (response.description.length > 500 ? '...' : '');
                document.getElementById('open-btn').style.display = 'block';
            } else { status.textContent = 'No job description found. Navigate to a specific job listing.'; }
        });
    });
});

function openInTMS(data) {
    var params = new URLSearchParams();
    if (data.title) params.set('title', data.title);
    if (data.company) params.set('company', data.company);
    if (data.url) params.set('jobUrl', data.url);
    if (data.description) params.set('jd', data.description.substring(0, 3000));
    params.set('source', 'extension');
    // Use new React SPA route
    chrome.tabs.create({ url: 'https://tailormeswiftly.com/app?' + params.toString() });
}

document.getElementById('open-btn').addEventListener('click', function () {
    chrome.storage.local.get('tms_job_data', function (result) {
        if (result.tms_job_data) openInTMS(result.tms_job_data);
    });
});
