// Next.js config for La Mancha teacher dashboard
// Using webpack for dev due to Turbopack stability issues in Next.js 16
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// 1. Initialize the PWA wrapper
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",     // Points to your service worker entry point
  swDest: "public/sw.js", // Where the built service worker will live
  disable: process.env.NODE_ENV === "development", // Disable in dev to avoid caching headaches
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Your Webpack usage is implicit here since you aren't using the --turbo flag
};

// 2. Wrap the config
export default withSerwist(nextConfig);
