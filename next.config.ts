import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move the dev indicator off `bottom-left`: it overlaps the dashboard
  // sidebar's footer (Settings + collapse toggle) there.
  devIndicators: { position: "bottom-right" },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.devtunnels.ms"],
    },
  },
};

export default nextConfig;
