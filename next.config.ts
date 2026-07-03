import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a minimal server bundle for Docker deployment
  output: "standalone",
};

export default nextConfig;
