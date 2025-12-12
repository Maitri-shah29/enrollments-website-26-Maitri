#!/usr/bin/env node

require("dotenv").config();

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const {
  promises: { readdir, stat },
} = fs;

function getEnv(name, { required = false, defaultValue } = {}) {
  const value = process.env[name];
  if (value != null && value !== "") return value;
  if (defaultValue != null) return defaultValue;
  if (required) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return "";
}

function shouldRunUpload() {
  if ((process.env.R2_UPLOAD_ON_BUILD || "").toLowerCase() === "true") {
    return true;
  }

  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production";
  }

  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV === "production";
  }

  return false;
}

function parseR2Token(token) {
  const trimmed = String(token || "").trim();
  if (!trimmed) return null;

  if (
    !trimmed.includes(":") &&
    !trimmed.includes(",") &&
    !trimmed.includes("|")
  ) {
    return null;
  }

  const separator = [":", ",", "|"]
    .map((sep) => ({ sep, idx: trimmed.indexOf(sep) }))
    .filter((x) => x.idx > 0)
    .sort((a, b) => a.idx - b.idx)[0]?.sep;

  if (!separator) {
    return null;
  }

  const [accessKeyId, secretAccessKey] = trimmed
    .split(separator)
    .map((s) => s.trim());

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accessKeyId, secretAccessKey };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set();
  const values = new Map();

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token.startsWith("--")) continue;

    const [rawKey, inlineValue] = token.split("=");
    const key = rawKey.slice(2);

    if (inlineValue != null) {
      values.set(key, inlineValue);
      continue;
    }

    const next = args[i + 1];
    if (next != null && !next.startsWith("--")) {
      values.set(key, next);
      i += 1;
      continue;
    }

    flags.add(key);
  }

  return { flags, values };
}

function normalizeKey(key) {
  return key.replaceAll("\\\\", "/");
}

function joinKey(...parts) {
  const joined = parts.filter(Boolean).join("/").replaceAll("//", "/");
  return normalizeKey(joined).replace(/^\/+/, "");
}

function encodePathPreservingSlashes(inputPath) {
  return inputPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function awsEncodeRfc3986(value) {
  // encodeURIComponent doesn't encode: ! ' ( ) *
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function awsCanonicalUri(pathname) {
  return pathname
    .split("/")
    .map((segment) => awsEncodeRfc3986(decodeURIComponent(segment)))
    .join("/");
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(key, data, encoding) {
  return crypto.createHmac("sha256", key).update(data).digest(encoding);
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(amzDate) {
  return amzDate.slice(0, 8);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".mjs":
      return "application/javascript; charset=utf-8";
    case ".cjs":
      return "application/javascript; charset=utf-8";
    case ".map":
      return "application/json; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".ttf":
      return "font/ttf";
    case ".otf":
      return "font/otf";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

function looksHashed(fileName) {
  return /[._-][a-f0-9]{8,}[._-]/i.test(fileName);
}

function cacheControlForKey(key) {
  if (key.startsWith("_next/static/")) {
    return "public, max-age=31536000, immutable";
  }

  const baseName = path.posix.basename(key);
  if (looksHashed(baseName)) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=86400";
}

function buildCanonicalQuery(query) {
  const entries = Object.entries(query || {})
    .filter(([, value]) => value != null)
    .map(([key, value]) => [
      encodeURIComponent(key),
      encodeURIComponent(String(value)),
    ])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return entries.map(([k, v]) => `${k}=${v}`).join("&");
}

function signRequest({
  method,
  url,
  region,
  accessKeyId,
  secretAccessKey,
  headers,
  query,
  payloadHash,
  canonicalUriOverride,
}) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(amzDate);
  const service = "s3";

  const requestUrl = new URL(url);
  const canonicalUri = awsCanonicalUri(
    canonicalUriOverride != null ? canonicalUriOverride : requestUrl.pathname,
  );
  const canonicalQueryString = buildCanonicalQuery(query);

  const mergedHeaders = {
    ...headers,
    host: requestUrl.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  const sortedHeaderKeys = Object.keys(mergedHeaders)
    .map((k) => k.toLowerCase())
    .sort();

  const canonicalHeaders = sortedHeaderKeys
    .map((k) => {
      const rawValue = mergedHeaders[k] ?? mergedHeaders[k.toLowerCase()];
      const value = String(rawValue).trim().replace(/\s+/g, " ");
      return `${k}:${value}\n`;
    })
    .join("");

  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign, "hex");

  const authorization =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...mergedHeaders,
    authorization,
  };
}

async function fetchWithRetry(url, init, { maxRetries = 5 } = {}) {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, init);
    if (
      res.status < 500 &&
      res.status !== 429 &&
      res.status !== 408 &&
      res.status !== 425
    ) {
      return res;
    }

    attempt += 1;
    if (attempt > maxRetries) return res;

    const waitMs = Math.min(10_000, 400 * 2 ** (attempt - 1));
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

async function walkFiles(rootDir) {
  const out = [];
  const root = path.resolve(rootDir);

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      out.push(full);
    }
  }

  await walk(root);
  return out;
}

function createPool(concurrency) {
  let active = 0;
  const queue = [];

  const runNext = () => {
    if (active >= concurrency) return;
    const item = queue.shift();
    if (!item) return;
    active += 1;
    item()
      .catch(() => {})
      .finally(() => {
        active -= 1;
        runNext();
      });
  };

  return {
    run(task) {
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            resolve(await task());
          } catch (err) {
            reject(err);
          }
        });
        runNext();
      });
    },
    async drain() {
      while (queue.length > 0 || active > 0) {
        await new Promise((r) => setTimeout(r, 50));
      }
    },
  };
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parseListObjectsV2(xml) {
  const keys = [];
  const keyMatches = xml.matchAll(/<Key>([^<]+)<\/Key>/g);
  for (const match of keyMatches) keys.push(match[1]);

  const isTruncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
  const nextTokenMatch = xml.match(
    /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
  );
  const nextToken = nextTokenMatch ? nextTokenMatch[1] : null;

  return { keys, isTruncated, nextToken };
}

async function main() {
  if (!shouldRunUpload()) {
    console.log(
      "Skipping R2 upload (not production). Set R2_UPLOAD_ON_BUILD=true to force.",
    );
    return;
  }

  const { flags, values } = parseArgs(process.argv);

  const bucket = getEnv("R2_BUCKET", { required: true });
  const accountId = getEnv("R2_ACCOUNT_ID", { required: false });

  const tokenCreds = parseR2Token(getEnv("R2_TOKEN"));
  const accessKeyId =
    getEnv("R2_ACCESS_KEY_ID", { required: false }) || tokenCreds?.accessKeyId;
  const secretAccessKey =
    getEnv("R2_SECRET_ACCESS_KEY", { required: false }) ||
    tokenCreds?.secretAccessKey;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY (recommended) or R2_TOKEN.",
    );
  }

  const region = getEnv("R2_REGION", { defaultValue: "auto" });

  const derivedEndpoint = accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : "";

  const endpoint = getEnv("R2_ENDPOINT", {
    defaultValue: derivedEndpoint,
  }).replace(/\/+$/, "");

  if (!endpoint) {
    throw new Error(
      "Missing R2 endpoint. Set R2_ENDPOINT (recommended) or R2_ACCOUNT_ID to derive it.",
    );
  }

  const prefix = normalizeKey(
    values.get("prefix") || getEnv("R2_PREFIX") || "",
  );
  const concurrency = Number(values.get("concurrency") || "8");
  const dryRun = flags.has("dry-run");
  const prune = flags.has("prune");
  const skipExisting = flags.has("skip-existing");

  const includePublic =
    flags.has("public") || flags.has("all") || !flags.has("next-static");
  const includeNextStatic =
    flags.has("next-static") || flags.has("all") || !flags.has("public");

  const signingPayloadMaxBytes = Number(
    getEnv("R2_SIGNING_PAYLOAD_MAX_BYTES", { defaultValue: "1048576" }),
  );

  const roots = [];
  if (includePublic && fs.existsSync(path.resolve("public"))) {
    roots.push({ localDir: "public", remotePrefix: "" });
  }
  if (includeNextStatic && fs.existsSync(path.resolve(".next/static"))) {
    roots.push({ localDir: ".next/static", remotePrefix: "_next/static" });
  }

  if (roots.length === 0) {
    throw new Error(
      "Nothing to upload: expected ./public and/or ./.next/static to exist.",
    );
  }

  const pool = createPool(Math.max(1, concurrency));

  const localKeySet = new Set();
  const uploadTasks = [];

  for (const root of roots) {
    const absoluteRoot = path.resolve(root.localDir);
    const files = await walkFiles(absoluteRoot);

    for (const filePath of files) {
      const rel = path
        .relative(absoluteRoot, filePath)
        .split(path.sep)
        .join("/");
      const key = joinKey(prefix, root.remotePrefix, rel);
      localKeySet.add(key);

      uploadTasks.push({ filePath, key });
    }
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  async function headObject(key) {
    const rawPath = `/${bucket}/${key}`;
    const keyPath = encodePathPreservingSlashes(rawPath);
    const url = `${endpoint}${keyPath}`;
    const headers = signRequest({
      method: "HEAD",
      url,
      region,
      accessKeyId,
      secretAccessKey,
      headers: {},
      query: {},
      payloadHash: "UNSIGNED-PAYLOAD",
      canonicalUriOverride: rawPath,
    });

    const res = await fetchWithRetry(url, { method: "HEAD", headers });
    return res;
  }

  async function putObject({ filePath, key }) {
    const fileStats = await stat(filePath);
    const contentType = getMimeType(filePath);
    const cacheControl = cacheControlForKey(key);

    if (skipExisting) {
      const headRes = await headObject(key);
      if (headRes.ok) {
        const remoteLen = Number(headRes.headers.get("content-length") || "-1");
        if (remoteLen === fileStats.size) {
          skipped += 1;
          return;
        }
      }
    }

    const rawPath = `/${bucket}/${key}`;
    const keyPath = encodePathPreservingSlashes(rawPath);
    const url = `${endpoint}${keyPath}`;

    let body;
    let payloadHash;

    if (fileStats.size <= signingPayloadMaxBytes) {
      const buf = await fs.promises.readFile(filePath);
      body = buf;
      payloadHash = sha256Hex(buf);
    } else {
      body = fs.createReadStream(filePath);
      payloadHash = "UNSIGNED-PAYLOAD";
    }

    const baseHeaders = {
      "cache-control": cacheControl,
      "content-type": contentType,
      "content-length": String(fileStats.size),
    };

    const signedHeaders = signRequest({
      method: "PUT",
      url,
      region,
      accessKeyId,
      secretAccessKey,
      headers: baseHeaders,
      query: {},
      payloadHash,
      canonicalUriOverride: rawPath,
    });

    if (dryRun) {
      uploaded += 1;
      return;
    }

    const res = await fetchWithRetry(url, {
      method: "PUT",
      headers: signedHeaders,
      body,
      ...(Buffer.isBuffer(body) ? {} : { duplex: "half" }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `PUT failed (${res.status}) for ${key}: ${text.slice(0, 500)}`,
      );
    }

    uploaded += 1;
  }

  async function listKeysWithPrefix(prefixValue) {
    const out = [];
    let continuationToken = null;

    while (true) {
      const query = {
        "list-type": 2,
        prefix: prefixValue,
        ...(continuationToken
          ? { "continuation-token": continuationToken }
          : {}),
      };

      const url = `${endpoint}/${bucket}`;
      const payloadHash = sha256Hex("");
      const headers = signRequest({
        method: "GET",
        url,
        region,
        accessKeyId,
        secretAccessKey,
        headers: {},
        query,
        payloadHash,
      });

      const res = await fetchWithRetry(`${url}?${buildCanonicalQuery(query)}`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `ListObjectsV2 failed (${res.status}) for prefix=${prefixValue}: ${text.slice(0, 500)}`,
        );
      }

      const xml = await res.text();
      const parsed = parseListObjectsV2(xml);
      out.push(...parsed.keys);

      if (!parsed.isTruncated || !parsed.nextToken) break;
      continuationToken = parsed.nextToken;
    }

    return out;
  }

  async function deleteKeys(keys) {
    if (keys.length === 0) return;
    if (dryRun) return;

    const itemsXml = keys
      .map((k) => `<Object><Key>${xmlEscape(k)}</Key></Object>`)
      .join("");
    const body = `<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>true</Quiet>${itemsXml}</Delete>`;
    const payloadHash = sha256Hex(body);

    const url = `${endpoint}/${bucket}?delete=`;
    const headers = signRequest({
      method: "POST",
      url,
      region,
      accessKeyId,
      secretAccessKey,
      headers: {
        "content-type": "application/xml",
      },
      query: { delete: "" },
      payloadHash,
    });

    const res = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `DeleteObjects failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }
  }

  console.log(
    `R2 upload starting: ${uploadTasks.length} files, concurrency=${concurrency}, dryRun=${dryRun}`,
  );
  console.log(
    `Bucket=${bucket} Endpoint=${endpoint} Prefix=${prefix || "(none)"}`,
  );

  for (const task of uploadTasks) {
    pool
      .run(async () => {
        await putObject(task);
      })
      .catch((err) => {
        failed += 1;
        const rel = path.relative(process.cwd(), task.filePath);
        console.error(`Upload failed: ${task.key} (${rel})`);
        console.error(err?.stack || String(err));
      });
  }

  await pool.drain();

  if (prune) {
    console.log("Prune enabled: listing remote keys...");
    const remotePrefixes = roots.map((r) => joinKey(prefix, r.remotePrefix));
    const remoteKeys = [];
    for (const p of remotePrefixes) {
      const asPrefix = p ? `${p.replace(/\/+$/, "")}/` : "";
      remoteKeys.push(...(await listKeysWithPrefix(asPrefix)));
    }

    const toDelete = remoteKeys.filter((k) => !localKeySet.has(k));
    console.log(
      `Prune: remote=${remoteKeys.length} local=${localKeySet.size} delete=${toDelete.length}`,
    );

    const batchSize = 1000;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await deleteKeys(batch);
    }
  }

  console.log(
    `Done. uploaded=${uploaded} skipped=${skipped} failed=${failed}${dryRun ? " (dry-run)" : ""}`,
  );

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
