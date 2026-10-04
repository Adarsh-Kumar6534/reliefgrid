import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for minimal Docker container size
  output: "standalone",
};

export default nextConfig;
