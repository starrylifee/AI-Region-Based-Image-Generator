// Lightweight client-side config for local/static hosting.
// Edit this file to set the API key or API URL for local testing.
// For production, prefer injecting env vars during build and avoid committing real API keys.

window.__ENV__ = window.__ENV__ || {
  // Put your API key here for local testing (NOT recommended for public hosting)
  API_KEY: "",
  // Optionally override the full endpoint (includes model). If empty, default will be used by the app.
  API_URL: ""
};

(function bootstrapRemoteEnv() {
  if (typeof window === 'undefined') {
    return;
  }

  function mergeEnv(data = {}) {
    const next = { ...window.__ENV__ };
    if (typeof data.API_KEY === 'string' && data.API_KEY.trim()) {
      next.API_KEY = data.API_KEY.trim();
    }
    if (typeof data.API_URL === 'string' && data.API_URL.trim()) {
      next.API_URL = data.API_URL.trim();
    }
    window.__ENV__ = next;
    return next;
  }

  function emitLoaded(env) {
    try {
      window.dispatchEvent(new CustomEvent('envLoaded', { detail: env }));
    } catch (err) {
      console.warn('envLoaded event dispatch failed:', err);
    }
    return env;
  }

  const isHttpContext = /^https?:/.test(window.location?.protocol || '');
  const shouldFetch = typeof fetch === 'function' && isHttpContext;

  if (!shouldFetch) {
    window.__ENV_PROMISE = Promise.resolve(mergeEnv({})).then(emitLoaded);
    return;
  }

  const fetchPromise = fetch('/api/env', { method: 'GET', cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(new Error(`Failed to load remote env (${response.status})`));
      }
      return response.json();
    })
    .then((data) => mergeEnv(data))
    .catch((error) => {
      console.warn('Remote env fetch failed. Falling back to local config.', error);
      return mergeEnv({});
    })
    .then(emitLoaded);

  window.__ENV_PROMISE = fetchPromise;
})();