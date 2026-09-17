import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure public images and assets are bundled with serverless API functions
  outputFileTracingIncludes: {
    '/api/**/*': ['./public/**/*'],
  },
};

export default nextConfig;
