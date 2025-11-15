// Lightweight client-side config for local/static hosting.
// Edit this file to set the API key or API URL for local testing.
// For production, prefer injecting env vars during build and avoid committing real API keys.

window.__ENV__ = window.__ENV__ || {
  // Put your API key here for local testing (NOT recommended for public hosting)
  API_KEY: "",
  // Optionally override the full endpoint (includes model). If empty, default will be used by the app.
  API_URL: ""
};
