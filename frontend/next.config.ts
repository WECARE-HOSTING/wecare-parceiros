import type { NextConfig } from "next";

const apiBase =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ??
  "http://localhost:18790";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/r/:code",
        destination: `${apiBase}/r/:code`,
      },
    ];
  },
};

export default nextConfig;
