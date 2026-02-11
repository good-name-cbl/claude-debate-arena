import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable compression to prevent SSE response buffering
  compress: false,
};

export default nextConfig;
