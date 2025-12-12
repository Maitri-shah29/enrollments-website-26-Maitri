import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  assetPrefix: process.env.CDN_ASSET_PREFIX,
};

export default nextConfig;
