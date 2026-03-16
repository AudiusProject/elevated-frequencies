const SUBDOMAIN = (import.meta.env.VITE_CURATOR_SUBDOMAIN ?? "curator").trim().toLowerCase();

function getHostname(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname;
}

/** True when the app is opened on the curator subdomain (e.g. curator.localhost or curator.yourdomain.com). */
export function isCuratorApp(): boolean {
  const host = getHostname();
  if (!host) return false;
  return host === "curator.localhost" || host.startsWith(`${SUBDOMAIN}.`);
}

/** Shared secret for curator API access (sent in X-Curator-Key). Only set when using curator subdomain. */
export function getCuratorKey(): string {
  return import.meta.env.VITE_CURATOR_KEY ?? "";
}
