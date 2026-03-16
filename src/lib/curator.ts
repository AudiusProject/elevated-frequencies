const SUBDOMAIN = (import.meta.env.VITE_CURATOR_SUBDOMAIN ?? "curator").trim().toLowerCase();

const CURATOR_PATH = "/curator";

function getHostname(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname;
}

function getPathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

/** True when the app is on the curator subdomain OR the /curator path (e.g. your-app.vercel.app/curator). */
export function isCuratorApp(): boolean {
  const host = getHostname();
  const path = getPathname();
  const subdomainMatch =
    host === "curator.localhost" || host.startsWith(`${SUBDOMAIN}.`);
  const pathMatch = path === CURATOR_PATH || path.startsWith(`${CURATOR_PATH}/`);
  return subdomainMatch || pathMatch;
}

/** Base path for curator routes when using path-based curator (e.g. /curator). Empty when using subdomain. */
export function getCuratorBasename(): string {
  const path = getPathname();
  if (path === CURATOR_PATH || path.startsWith(`${CURATOR_PATH}/`)) {
    return CURATOR_PATH;
  }
  return "";
}

/** Shared secret for curator API access (sent in X-Curator-Key). Only set when using curator subdomain. */
export function getCuratorKey(): string {
  return import.meta.env.VITE_CURATOR_KEY ?? "";
}
