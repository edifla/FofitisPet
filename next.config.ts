import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Upload de imagens dos produtos: até 5 MB por arquivo (lib/images.ts).
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    // Imagens enviadas pelo admin, servidas por app/arquivos, e a foto da Lya (public/lya.webp).
    localPatterns: [
      { pathname: "/arquivos/**", search: "" },
      { pathname: "/lya.webp", search: "" },
    ],
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
