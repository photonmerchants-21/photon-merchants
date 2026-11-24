import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev client/HMR is origin-locked; 127.0.0.1 ≠ localhost without this.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.100.24",
    "*.trycloudflare.com",
  ],
  async rewrites() {
    const backend = (process.env.MEDUSA_BACKEND_URL || "http://127.0.0.1:9000").replace(/\/$/, "");
    return [{ source: "/medusa/:path*", destination: `${backend}/:path*` }];
  },
  async redirects() {
    return [
      ["beddings", "bedroom-bedding"],
      ["kitchenware", "kitchen-dining"],
      ["electronics", "tech-electronics"],
    ].map(([from, to]) => ({
      source: `/category/${from}`,
      destination: `/category/${to}`,
      permanent: true,
    }));
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
    ],
  },
};

export default nextConfig;
