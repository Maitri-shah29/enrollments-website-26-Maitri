import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
    viewTransition: true,
  },
  reactCompiler: true,
  cacheComponents: true,
};

export default nextConfig;
