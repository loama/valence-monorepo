import type { NextConfig } from "next";

const requestedBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";
const normalizedAssetPrefix =
  requestedBasePath === "" || requestedBasePath === "/"
    ? undefined
    : requestedBasePath;

const nextConfig: NextConfig = {
  assetPrefix: normalizedAssetPrefix
};

export default nextConfig;
