/**
 * The only place that registers the offline service worker. It refuses to run in
 * dev, inside iframes and on Lovable preview hosts, and cleans up stale workers there.
 */
const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (params.get("sw") === "off") return true;
  const label = host.split(".")[0] ?? "";
  const lovableHosts = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
  if (lovableHosts.some((d) => host.endsWith(d))) {
    if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label)) return true;
    if (/^project--[a-z0-9-]+-dev$/.test(label)) return true;
  }
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL)))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    void unregisterAppWorkers().catch(() => undefined);
    return;
  }
  const register = () => navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => undefined);
  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
}
