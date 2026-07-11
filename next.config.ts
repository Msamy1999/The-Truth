import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Load msedge-tts from node_modules at runtime instead of bundling it —
  // bundling breaks/throttles its websocket streaming (12s vs 1.5s per call).
  serverExternalPackages: ["msedge-tts"],
};

export default withPayload(nextConfig);
