import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Image Docker minimale (node server.js).
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingExcludes: { "/*": ["./.env*", "./e2e/**/*", "./scripts/**/*"] },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // En production l'application refuse d'être encadrée (clickjacking). En développement
          // l'en-tête est omis : l'aperçu local s'affiche dans un cadre, sur un autre hôte.
          ...(process.env.NODE_ENV === "production" ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
