import type { NextConfig } from "next";

const requestedBasePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "/app";
const normalizedBasePath =
  requestedBasePath === "" || requestedBasePath === "/"
    ? undefined
    : requestedBasePath;

const nextConfig: NextConfig = {
  basePath: normalizedBasePath,
  images: {
    unoptimized: process.env.CAPACITOR_EXPORT === "true"
  },
  output: process.env.CAPACITOR_EXPORT === "true" ? "export" : undefined
};

export default nextConfig;
