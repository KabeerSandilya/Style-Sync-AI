import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The backend lives in a sibling workspace package as TypeScript source;
  // Next.js must transpile it rather than treat it as a prebuilt dependency.
  transpilePackages: ["@style-sync/backend"],
  serverExternalPackages: ["@imgly/background-removal-node", "onnxruntime-node"],
};

export default nextConfig;
