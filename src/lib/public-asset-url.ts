function normalizePrefix(prefix: string) {
  return String(prefix || "").replace(/\/+$/, "");
}

function normalizePath(pathname: string) {
  const trimmed = String(pathname || "").trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const PUBLIC_ASSET_PREFIX = normalizePrefix(
  process.env.NEXT_PUBLIC_PUBLIC_ASSET_PREFIX || process.env.CDN_ASSET_PREFIX || "",
);

export function publicAssetUrl(pathname: string): string {
  const path = normalizePath(pathname);
  if (!PUBLIC_ASSET_PREFIX) return path;
  return `${PUBLIC_ASSET_PREFIX}${path}`;
}
