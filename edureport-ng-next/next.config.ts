import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Proxy to wrangler pages dev running on port 8788 locally
        destination: 'http://127.0.0.1:8788/api/:path*',
      },
    ];
  },
};

export default nextConfig;
