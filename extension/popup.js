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
            if (chrome.runtime.lastError) { status.textContent = 'Not on a supported job board. Try LinkedIn, Indeed, Greenhouse, or Lever.'; return; }
            if (response && response.description) {
                status.className = 'status has-data';
                status.textContent = (response.title ? response.title + ' at ' + response.company + '\n\n' : '') + response.description.substring(0, 500) + (response.description.length > 500 ? '...' : '');
                document.getElementById('open-btn').style.display = 'block';
            } else { status.textContent = 'No job description found. Navigate to a specific job listing.'; }
        });
    });
});
document.getElementById('open-btn').addEventListener('click', function () {
    chrome.storage.local.get('tms_job_data', function (result) {
        var data = result.tms_job_data;
        if (!data) return;
        var params = new URLSearchParams();
        if (data.title) params.set('title', data.title);
        if (data.company) params.set('company', data.company);
        if (data.url) params.set('jobUrl', data.url);
        if (data.description) params.set('jd', data.description.substring(0, 3000));
        chrome.tabs.create({ url: 'https://tailormeswiftly.com/app.html?' + params.toString() });
    });
});
