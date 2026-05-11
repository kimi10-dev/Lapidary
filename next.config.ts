import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "100.*.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
    "*.ts.net",
  ],
};

export default nextConfig;
