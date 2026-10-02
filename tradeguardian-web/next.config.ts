import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RainbowKit's Base Account connector pulls in @coinbase/cdp-sdk during SSR,
  // which has optional @x402/* imports the bundler can't resolve. Loading it
  // from node_modules at runtime instead skips bundling those imports.
  serverExternalPackages: ["@coinbase/cdp-sdk"],
};

export default nextConfig;
