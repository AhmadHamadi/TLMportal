import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack/Next root to this app so the marketing-site lockfile in the
  // parent folder is not picked up.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
