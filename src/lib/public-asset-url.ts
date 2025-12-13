function normalizePrefix(prefix: string) {
  return String(prefix || "").replace(/\/+$/, "");
}

function normalizePath(pathname: string) {
  const trimmed = String(pathname || "").trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const DEFAULT_PUBLIC_ASSET_PREFIX = "https://assets.acmvit.in/ocs";
const DEV_PUBLIC_ASSET_PREFIX = "http://localhost:3000";

function getPublicAssetPrefix() {
  const clientPrefix = process.env.NEXT_PUBLIC_PUBLIC_ASSET_PREFIX;
  if (clientPrefix) return normalizePrefix(clientPrefix);

  if (typeof window === "undefined") {
    const serverPrefix = process.env.CDN_ASSET_PREFIX;
    if (serverPrefix) return normalizePrefix(serverPrefix);
  }

  if (process.env.NODE_ENV === "development") {
    return normalizePrefix(DEV_PUBLIC_ASSET_PREFIX);
  }

  return normalizePrefix(DEFAULT_PUBLIC_ASSET_PREFIX);
}

export function publicAssetUrl(pathname: string): string {
  const path = normalizePath(pathname);
  const prefix = getPublicAssetPrefix();
  if (!prefix) return path;
  return `${prefix}${path}`;
}
