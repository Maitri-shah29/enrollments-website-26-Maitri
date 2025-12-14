import type { NextConfig } from "next";

const cdnAssetPrefix = process.env.CDN_ASSET_PREFIX;
const publicAssetPrefix =
  process.env.NEXT_PUBLIC_PUBLIC_ASSET_PREFIX ||
  process.env.NEXT_PUBLIC_CDN_ASSET_PREFIX ||
  cdnAssetPrefix ||
  "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  assetPrefix: cdnAssetPrefix,
  env: {
    NEXT_PUBLIC_PUBLIC_ASSET_PREFIX: publicAssetPrefix,
  },
  // images: {
  //   loader: "custom",
  //   loaderFile: "./src/lib/next-image-loader.ts",
  // },
};

export default nextConfig;
