import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable compression to prevent SSE response buffering
  compress: false,
  // Allow server-side code to access files outside the project directory
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
