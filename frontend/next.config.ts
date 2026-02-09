import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backHost = process.env.BACK_HOST || "back";
    const backPort = process.env.BACK_HTTP_PORT || "3000";
    return [
      {
        source: "/public/:path*",
        destination: `http://${backHost}:${backPort}/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
