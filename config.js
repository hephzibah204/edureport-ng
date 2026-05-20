window.ReportSheet_CONFIG = {
  // If apiBaseUrl is empty, the app will try to use the current origin
  apiBaseUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://127.0.0.1:3011/api"
    : (window.location.origin + "/api"),
  demoMode: false
};
