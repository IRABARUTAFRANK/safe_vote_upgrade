import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // Security: Disable X-Powered-By header
  poweredByHeader: false,
  
  // Security: Enable strict mode
  reactStrictMode: true,
  
  // Security: Compress responses
  compress: true,
  
  // Security headers are handled in middleware.ts
};

export default nextConfig;
