// TailorMeSwiftly Extension — Supabase Auth Module
// Lightweight REST-based auth (no SDK dependency)
(function () {
  'use strict';

  var SUPABASE_URL = 'https://gwmpdgjvcjzndbloctla.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Kor1B60TEAKofYE75aW7Ow_WL0cPOa8';
  var AUTH_STORAGE_KEY = 'tms_auth';

  // ---- Token storage ----

  function getStoredAuth() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(AUTH_STORAGE_KEY, function (result) {
        resolve(result[AUTH_STORAGE_KEY] || null);
      });
    });
  }

  function storeAuth(authData) {
    return new Promise(function (resolve) {
      var obj = {};
      obj[AUTH_STORAGE_KEY] = authData;
      chrome.storage.local.set(obj, resolve);
    });
  }

  function clearAuth() {
    return new Promise(function (resolve) {
      chrome.storage.local.remove(AUTH_STORAGE_KEY, resolve);
    });
  }

  // ---- Auth methods ----

  async function signIn(email, password) {
    var resp = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    var data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error_description || data.msg || 'Login failed');
    }

    var authData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      user: data.user,
    };
    await storeAuth(authData);
    return authData;
  }

  async function refreshToken(refreshTk) {
    var resp = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshTk }),
    });

    var data = await resp.json();
    if (!resp.ok) {
      await clearAuth();
      throw new Error('Session expired. Please log in again.');
    }

    var authData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      user: data.user,
    };
    await storeAuth(authData);
    return authData;
  }

  async function getAccessToken() {
    var auth = await getStoredAuth();
    if (!auth) return null;

    // Check expiry (30s buffer)
    if (auth.expires_at < Date.now() + 30000) {
      try {
        auth = await refreshToken(auth.refresh_token);
      } catch (e) {
        console.error('[tms-ext] Token refresh failed:', e);
        return null;
      }
    }

    return auth.access_token;
  }

  async function getUser() {
    var auth = await getStoredAuth();
    return auth ? auth.user : null;
  }

  async function isAuthenticated() {
    var token = await getAccessToken();
    return !!token;
  }

  async function signInWithGoogle() {
    var redirectUrl = chrome.identity.getRedirectURL();
    var authUrl = SUPABASE_URL + '/auth/v1/authorize?' +
      'provider=google' +
      '&redirect_to=' + encodeURIComponent(redirectUrl) +
      '&flowType=implicit';

    return new Promise(function (resolve, reject) {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        async function (callbackUrl) {
          if (chrome.runtime.lastError || !callbackUrl) {
            reject(new Error(chrome.runtime.lastError?.message || 'Google sign-in was cancelled.'));
            return;
          }

          try {
            // Supabase returns tokens in the URL fragment: #access_token=...&refresh_token=...
            var hashStr = callbackUrl.split('#')[1];
            if (!hashStr) {
              reject(new Error('No auth data returned from Google sign-in.'));
              return;
            }

            var params = new URLSearchParams(hashStr);
            var accessToken = params.get('access_token');
            var refreshTk = params.get('refresh_token');
            var expiresIn = parseInt(params.get('expires_in') || '3600', 10);

            if (!accessToken) {
              reject(new Error('No access token returned.'));
              return;
            }

            // Fetch user profile with the token
            var userResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
              headers: {
                'Authorization': 'Bearer ' + accessToken,
                'apikey': SUPABASE_KEY,
              },
            });
            var userData = await userResp.json();

            var authData = {
              access_token: accessToken,
              refresh_token: refreshTk,
              expires_at: Date.now() + (expiresIn * 1000),
              user: userData,
            };
            await storeAuth(authData);
            resolve(authData);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  async function signOut() {
    var token = await getAccessToken();
    if (token) {
      // Best-effort server-side logout
      try {
        await fetch(SUPABASE_URL + '/auth/v1/logout', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'apikey': SUPABASE_KEY,
          },
        });
      } catch (e) { /* ignore */ }
    }
    await clearAuth();
  }

  // Expose globally for popup.js and api-client.js
  window.TmsAuth = {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_KEY: SUPABASE_KEY,
    signIn: signIn,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    getAccessToken: getAccessToken,
    getUser: getUser,
    isAuthenticated: isAuthenticated,
  };
})();
