// TailorMeSwiftly Extension — Auto-Fill Content Script
// Injects a floating button on Workday/Greenhouse application pages
(function () {
  'use strict';

  var SUPABASE_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';
  var AUTH_STORAGE_KEY = 'tms_auth';

  // ---- Site-specific selectors ----

  var SELECTORS = {
    workday: {
      firstName: [
        '[data-automation-id="firstName"]',
        '[data-automation-id="legalNameSection_firstName"]',
        'input[aria-label*="First Name" i]',
      ],
      lastName: [
        '[data-automation-id="lastName"]',
        '[data-automation-id="legalNameSection_lastName"]',
        'input[aria-label*="Last Name" i]',
      ],
      email: [
        '[data-automation-id="email"]',
        'input[aria-label*="Email" i]',
        'input[type="email"]',
      ],
      phone: [
        '[data-automation-id="phone"]',
        'input[aria-label*="Phone" i]',
        'input[type="tel"]',
      ],
      address: [
        '[data-automation-id="addressSection_addressLine1"]',
        'input[aria-label*="Address" i]',
      ],
      city: [
        '[data-automation-id="addressSection_city"]',
        'input[aria-label*="City" i]',
      ],
      linkedin: [
        'input[aria-label*="LinkedIn" i]',
        'input[placeholder*="linkedin" i]',
      ],
    },
    greenhouse: {
      firstName: ['#first_name', 'input[name="first_name"]'],
      lastName: ['#last_name', 'input[name="last_name"]'],
      email: ['#email', 'input[name="email"]', 'input[type="email"]'],
      phone: ['#phone', 'input[name="phone"]', 'input[type="tel"]'],
      linkedin: [
        'input[name*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
        '#job_application_answers_attributes_0_text_value',
      ],
      location: ['input[name*="location" i]'],
    },
  };

  // ---- Helpers ----

  function detectSite() {
    var host = window.location.hostname;
    if (host.indexOf('workday') !== -1 || host.indexOf('myworkdayjobs') !== -1) return 'workday';
    if (host.indexOf('greenhouse') !== -1) return 'greenhouse';
    return null;
  }

  function findInput(selectorList) {
    for (var i = 0; i < selectorList.length; i++) {
      var el = document.querySelector(selectorList[i]);
      if (el) return el;
    }
    return null;
  }

  function setInputValue(el, value) {
    if (!el || !value) return;

    // Set native value (works with React/Angular controlled inputs)
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(el, value);

    // Dispatch events to trigger framework change handlers
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // ---- Auth (simplified — reads from extension storage) ----

  async function getToken() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(AUTH_STORAGE_KEY, function (result) {
        var auth = result[AUTH_STORAGE_KEY];
        if (auth && auth.access_token && auth.expires_at > Date.now()) {
          resolve(auth.access_token);
        } else {
          resolve(null);
        }
      });
    });
  }

  // ---- Fetch user profile data ----

  async function fetchProfileData() {
    var token = await getToken();
    if (!token) throw new Error('Please log in to the TMS extension first.');

    var resp = await fetch(SUPABASE_URL + '/functions/v1/user-profile-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({}),
    });

    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  }

  // ---- Fill form ----

  function fillForm(site, profileData) {
    var selectors = SELECTORS[site];
    if (!selectors) return 0;

    var personal = profileData.personal || {};
    var filled = 0;

    var mappings = [
      { field: 'firstName', value: personal.firstName },
      { field: 'lastName', value: personal.lastName },
      { field: 'email', value: personal.email },
      { field: 'phone', value: personal.phone },
      { field: 'linkedin', value: personal.linkedIn },
      { field: 'address', value: personal.address },
      { field: 'city', value: personal.city },
      { field: 'location', value: personal.location },
    ];

    mappings.forEach(function (m) {
      if (selectors[m.field] && m.value) {
        var input = findInput(selectors[m.field]);
        if (input && !input.value) {
          setInputValue(input, m.value);
          filled++;
        }
      }
    });

    return filled;
  }

  // ---- Floating button ----

  function injectButton(site) {
    if (document.getElementById('tms-autofill-btn')) return;

    var container = document.createElement('div');
    container.id = 'tms-autofill-btn';
    container.innerHTML =
      '<div style="' +
      'position:fixed;bottom:24px;right:24px;z-index:99999;' +
      'background:linear-gradient(135deg,#10b981,#059669);' +
      'color:#fff;padding:12px 20px;border-radius:8px;' +
      'cursor:pointer;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.3);' +
      'display:flex;align-items:center;gap:8px;' +
      'transition:transform 0.2s,box-shadow 0.2s;' +
      '">' +
      '<span style="font-size:18px;">&#9889;</span> TMS Auto-Fill' +
      '</div>';

    var btn = container.firstElementChild;
    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
    });

    btn.addEventListener('click', async function () {
      btn.innerHTML = '<span style="font-size:18px;">&#8987;</span> Filling...';
      btn.style.pointerEvents = 'none';

      try {
        var profileData = await fetchProfileData();
        var count = fillForm(site, profileData);

        if (count > 0) {
          btn.innerHTML = '<span style="font-size:18px;">&#9989;</span> Filled ' + count + ' fields';
          btn.style.background = '#059669';
        } else {
          btn.innerHTML = '<span style="font-size:18px;">&#10060;</span> No empty fields found';
          btn.style.background = '#f59e0b';
        }
      } catch (e) {
        btn.innerHTML = '<span style="font-size:18px;">&#10060;</span> ' + (e.message || 'Failed');
        btn.style.background = '#ef4444';
      }

      // Reset button after 3 seconds
      setTimeout(function () {
        btn.innerHTML = '<span style="font-size:18px;">&#9889;</span> TMS Auto-Fill';
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        btn.style.pointerEvents = 'auto';
      }, 3000);
    });

    document.body.appendChild(container);
  }

  // ---- Init ----

  var site = detectSite();
  if (site) {
    // Wait a bit for the page to fully render
    setTimeout(function () { injectButton(site); }, 2000);

    // Also watch for SPA navigation (Workday is an SPA)
    var observer = new MutationObserver(function () {
      if (!document.getElementById('tms-autofill-btn')) {
        injectButton(site);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
