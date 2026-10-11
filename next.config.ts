import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure public images and assets are bundled with serverless API functions
  outputFileTracingIncludes: {
    '/api/**/*': ['./public/**/*'],
  },
  // Admin can paste external image URLs (imgur) and uploads live on Vercel Blob
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imgur.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
