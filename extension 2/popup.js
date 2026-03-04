// TailorMeSwiftly Extension — Popup Logic v3
// Depends on supabase-auth.js (TmsAuth) and api-client.js (TmsApi)
(function () {
  'use strict';

  var capturedData = null;
  var isAuthenticated = false;

  // ---- DOM refs ----
  var loginSection = document.getElementById('auth-login');
  var userBar = document.getElementById('auth-user');
  var userEmail = document.getElementById('user-email');
  var captureBtn = document.getElementById('capture-btn');
  var status = document.getElementById('status');
  var actionButtons = document.getElementById('action-buttons');
  var saveBtn = document.getElementById('save-btn');
  var tailorBtn = document.getElementById('tailor-btn');
  var bgGenerateBtn = document.getElementById('bg-generate-btn');
  var openBtn = document.getElementById('open-btn');
  var historyEl = document.getElementById('capture-history');

  // ---- Auth UI ----

  async function initAuth() {
    try {
      var authed = await TmsAuth.isAuthenticated();
      isAuthenticated = authed;
      if (authed) {
        var user = await TmsAuth.getUser();
        showLoggedIn(user);
      } else {
        showLoggedOut();
      }
    } catch (e) {
      showLoggedOut();
    }
  }

  function showLoggedIn(user) {
    loginSection.style.display = 'none';
    userBar.style.display = 'flex';
    userEmail.textContent = (user && user.email) || 'Signed in';
  }

  function showLoggedOut() {
    loginSection.style.display = 'block';
    userBar.style.display = 'none';
  }

  // Login handler
  document.getElementById('login-btn').addEventListener('click', async function () {
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    var errorEl = document.getElementById('login-error');

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password.';
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';
    this.disabled = true;
    this.textContent = 'Signing in...';

    try {
      var authData = await TmsAuth.signIn(email, password);
      isAuthenticated = true;
      showLoggedIn(authData.user);
    } catch (e) {
      errorEl.textContent = e.message || 'Login failed.';
      errorEl.style.display = 'block';
    } finally {
      this.disabled = false;
      this.textContent = 'Sign In';
    }
  });

  // Sign out handler
  document.getElementById('sign-out-btn').addEventListener('click', async function () {
    await TmsAuth.signOut();
    isAuthenticated = false;
    showLoggedOut();
    actionButtons.style.display = 'none';
    bgGenerateBtn.style.display = 'none';
  });

  // Google sign-in handler
  document.getElementById('google-btn').addEventListener('click', async function () {
    var errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';
    this.disabled = true;
    this.textContent = 'Signing in...';

    try {
      var authData = await TmsAuth.signInWithGoogle();
      isAuthenticated = true;
      showLoggedIn(authData.user);
    } catch (e) {
      errorEl.textContent = e.message || 'Google sign-in failed.';
      errorEl.style.display = 'block';
    } finally {
      this.disabled = false;
      this.innerHTML = '<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google';
    }
  });

  // Allow Enter key to submit login
  document.getElementById('login-password').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('login-btn').click();
  });

  // ---- Capture ----

  captureBtn.addEventListener('click', function () {
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
    status.textContent = 'Extracting job data...';
    status.className = 'status';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) {
        status.textContent = 'No active tab found.';
        captureBtn.disabled = false;
        captureBtn.textContent = 'Capture Job Description';
        return;
      }

      var tabId = tabs[0].id;

      function handleResponse(response) {
        captureBtn.disabled = false;
        captureBtn.textContent = 'Capture Job Description';

        if (response && response.description) {
          capturedData = response;
          status.className = 'status has-data';
          status.textContent = (response.title ? response.title + (response.company ? ' at ' + response.company : '') + '\n\n' : '') +
            response.description.substring(0, 500) + (response.description.length > 500 ? '...' : '');

          if (isAuthenticated) {
            actionButtons.style.display = 'block';
            openBtn.style.display = 'none';
          } else {
            actionButtons.style.display = 'none';
            openBtn.style.display = 'block';
          }
        } else {
          var isLinkedIn = response && response.source && response.source.indexOf('linkedin') !== -1;
          status.textContent = isLinkedIn
            ? 'No job description found. Click into a specific job posting first — feed and search pages don\'t have a single JD to capture.'
            : 'No job description found. Navigate to a specific job listing.';
        }
      }

      chrome.tabs.sendMessage(tabId, { action: 'extract' }, function (response) {
        if (chrome.runtime.lastError) {
          // Content script not injected yet — inject it on-demand, then retry
          chrome.scripting.executeScript(
            { target: { tabId: tabId }, files: ['content.js'] },
            function () {
              if (chrome.runtime.lastError) {
                captureBtn.disabled = false;
                captureBtn.textContent = 'Capture Job Description';
                status.textContent = 'Not on a supported job board. Try LinkedIn, Indeed, Greenhouse, Lever, Workday, or more.';
                return;
              }
              // Retry after injection
              chrome.tabs.sendMessage(tabId, { action: 'extract' }, function (retryResponse) {
                if (chrome.runtime.lastError || !retryResponse) {
                  captureBtn.disabled = false;
                  captureBtn.textContent = 'Capture Job Description';
                  status.textContent = 'No job description found. Try refreshing the page.';
                  return;
                }
                handleResponse(retryResponse);
              });
            }
          );
          return;
        }

        handleResponse(response);
        return; // skip the duplicate handler below
      });
      return; // early return — the rest is handled above
    });
  });

  // ---- Save to Job Tracker ----

  saveBtn.addEventListener('click', async function () {
    if (!capturedData || !isAuthenticated) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      var saved = await TmsApi.saveJobToKanban(capturedData);
      status.className = 'status success';
      status.textContent = 'Saved to Job Tracker!\n' +
        (capturedData.title || 'Job') + ' at ' + (capturedData.company || 'Unknown') +
        '\nStatus: Saved';
      saveBtn.textContent = 'Saved!';
      saveBtn.disabled = true;

      // Show background generation option
      bgGenerateBtn.style.display = 'block';
      bgGenerateBtn.dataset.jobAppId = saved.id;

      // Update badge count
      chrome.runtime.sendMessage({ action: 'update_badge_increment' });
    } catch (e) {
      status.className = 'status error';
      status.textContent = 'Failed to save: ' + (e.message || 'Unknown error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save to Tracker';
    }
  });

  // ---- Tailor Now (opens web app) ----

  tailorBtn.addEventListener('click', function () {
    if (!capturedData) return;
    openInTMS(capturedData);
  });

  // Legacy open button (for non-authenticated users)
  openBtn.addEventListener('click', function () {
    if (capturedData) {
      openInTMS(capturedData);
    } else {
      chrome.storage.local.get('tms_job_data', function (result) {
        if (result.tms_job_data) openInTMS(result.tms_job_data);
      });
    }
  });

  function openInTMS(data) {
    var params = new URLSearchParams();
    if (data.title) params.set('title', data.title);
    if (data.company) params.set('company', data.company);
    if (data.url) params.set('jobUrl', data.url);
    if (data.description) params.set('jd', data.description.substring(0, 3000));
    params.set('source', 'extension');
    chrome.tabs.create({ url: 'https://tailormeswiftly.com/app/tailor?' + params.toString() });
  }

  // ---- Background Generation ----

  bgGenerateBtn.addEventListener('click', async function () {
    if (!capturedData || !isAuthenticated) return;

    bgGenerateBtn.disabled = true;
    bgGenerateBtn.textContent = 'Starting generation...';

    try {
      var profile = await TmsApi.getDefaultResumeProfile();
      if (!profile || !profile.resume_text) {
        status.className = 'status error';
        status.textContent = 'No default resume profile found. Please create one in the app first.';
        bgGenerateBtn.disabled = false;
        bgGenerateBtn.textContent = 'Generate in Background';
        return;
      }

      // Send to background script for processing
      chrome.runtime.sendMessage({
        action: 'generate_resume',
        jobDescription: capturedData.description,
        resumeText: profile.resume_text,
        jobAppId: bgGenerateBtn.dataset.jobAppId,
        jobTitle: capturedData.title,
        company: capturedData.company,
      });

      bgGenerateBtn.textContent = 'Generating... (check notifications)';
      status.className = 'status';
      status.textContent = 'Resume generation started in background.\nYou\'ll get a notification when it\'s ready.';
    } catch (e) {
      status.className = 'status error';
      status.textContent = 'Failed: ' + (e.message || 'Unknown error');
      bgGenerateBtn.disabled = false;
      bgGenerateBtn.textContent = 'Generate in Background';
    }
  });

  // ---- Capture History ----

  chrome.storage.local.get('tms_captures', function (result) {
    var captures = result.tms_captures || [];
    if (captures.length > 0 && historyEl) {
      historyEl.innerHTML = '<div class="history-label">Recent captures (' + captures.length + ')</div>';
      captures.slice(0, 5).forEach(function (c) {
        var item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = (c.title || 'Unknown') + (c.company ? ' — ' + c.company : '');
        item.title = c.description ? c.description.substring(0, 200) : '';
        item.addEventListener('click', function () {
          capturedData = c;
          chrome.storage.local.set({ tms_job_data: c });
          status.className = 'status has-data';
          status.textContent = (c.title || '') + (c.company ? ' at ' + c.company : '') + '\n\n' +
            (c.description || '').substring(0, 500);
          if (isAuthenticated) {
            actionButtons.style.display = 'block';
            openBtn.style.display = 'none';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save to Tracker';
            bgGenerateBtn.style.display = 'none';
          } else {
            actionButtons.style.display = 'none';
            openBtn.style.display = 'block';
          }
        });
        historyEl.appendChild(item);
      });
      historyEl.style.display = 'block';
    }
  });

  // ---- Init ----
  initAuth();
})();
