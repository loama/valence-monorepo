import type { NextConfig } from "next";

const requestedBasePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin";
const normalizedBasePath =
  requestedBasePath === "" || requestedBasePath === "/"
    ? undefined
    : requestedBasePath;

const nextConfig: NextConfig = {
  basePath: normalizedBasePath
};

export default nextConfig;
