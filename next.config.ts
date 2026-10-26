import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Upload de imagens dos produtos: até 5 MB por arquivo (lib/images.ts).
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    // Imagens enviadas pelo admin, servidas por app/arquivos.
    localPatterns: [{ pathname: "/arquivos/**", search: "" }],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
