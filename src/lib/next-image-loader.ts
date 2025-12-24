import type { ImageLoaderProps } from "next/image";

// import { publicAssetUrl } from "./public-asset-url";

function isAbsoluteUrl(src: string) {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(src);
}

function isSpecialScheme(src: string) {
  return /^(data:|blob:)/i.test(src);
}

function appendQuery(
  url: string,
  params: Record<string, string | number | undefined>,
) {
  const [beforeHash, hash = ""] = url.split("#");
  const [base, query = ""] = beforeHash.split("?");

  const searchParams = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (!searchParams.has(key)) searchParams.set(key, String(value));
  }

  const qs = searchParams.toString();
  const withQuery = qs ? `${base}?${qs}` : base;
  return hash ? `${withQuery}#${hash}` : withQuery;
}

export default function publicAssetImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!src) return src;

  if (isSpecialScheme(src)) return src;

  const resolved = isAbsoluteUrl(src) ? src : src;

  return appendQuery(resolved, {
    w: width,
    q: quality,
  });
}
