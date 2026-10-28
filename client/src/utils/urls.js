const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

// Use VITE_APP_URL when the frontend has its own production domain. Otherwise,
// use the origin that served the page, which works for the Render single-service
// deployment and for local development.
export const getAppOrigin = () => {
  const configuredOrigin = import.meta.env.VITE_APP_URL;
  if (configuredOrigin) return trimTrailingSlash(configuredOrigin);
  return window.location.origin;
};

// The API is same-origin by default, but can be hosted separately by setting
// VITE_API_URL to an absolute URL such as https://api.example.com/api.
export const getApiOrigin = () => {
  const configuredApi = import.meta.env.VITE_API_URL || '/api';
  return trimTrailingSlash(configuredApi);
};

export const getShortUrl = (shortCode) =>
  `${getAppOrigin()}/${encodeURIComponent(shortCode)}`;
