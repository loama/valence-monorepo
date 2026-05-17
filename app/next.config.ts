import type { NextConfig } from "next";

const requestedBasePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "/app";
const normalizedAssetPrefix =
  requestedBasePath === "" || requestedBasePath === "/"
    ? undefined
    : requestedBasePath;

const nextConfig: NextConfig = {
  assetPrefix: normalizedAssetPrefix,
  images: {
    unoptimized: true
  },
  output: "export"
};

export default nextConfig;
