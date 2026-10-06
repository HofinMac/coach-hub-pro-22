/** Production address of the app; change here when a custom domain goes live. */
export const PRODUCTION_APP_URL = "https://coach-hub-pro-22.vercel.app";

/**
 * Base URL for links that leave the current tab (invites, e-mail confirmation,
 * password reset). Vercel previews are behind Vercel login and Lovable previews
 * are temporary, so those always point to production; local dev keeps its origin.
 */
export function publicAppUrl() {
  const { hostname, origin } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1" ? origin : PRODUCTION_APP_URL;
}
