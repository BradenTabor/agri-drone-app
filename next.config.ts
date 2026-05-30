import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Mix record submissions can include multiple photo files.
      // Keep this above the form's advertised max payload.
      bodySizeLimit: "128mb",
    },
  },
};

export default nextConfig;
