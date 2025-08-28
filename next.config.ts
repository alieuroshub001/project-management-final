import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Skip ESLint checks during `next build` (both local + Vercel)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
