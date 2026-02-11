import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backHost = process.env.BACK_HOST || "back";
    const backPort = process.env.BACK_HTTP_PORT || "3000";
    const backUrl = `http://${backHost}:${backPort}`;
    return [
      {
        source: "/api/:path*",
        destination: `${backUrl}/api/:path*`,
      },
      {
        source: "/public/:path*",
        destination: `${backUrl}/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
