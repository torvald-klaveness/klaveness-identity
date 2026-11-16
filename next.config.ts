import type { NextConfig } from "next";

import downloads from "./src/content/downloads.json";

// Indexing is allowed only on the live site (production on klavenessidentity.com),
// never on vercel.app addresses.
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "";
const isIndexable =
  process.env.VERCEL_ENV === "production" && productionUrl.endsWith("klavenessidentity.com");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    deviceSizes: [640, 750, 828, 1080, 1280, 1440, 1680, 1920, 2048, 2560],
  },
  // Old Squarespace addresses that pointed at the same pages (the menu's folder links).
  async redirects() {
    return [
      { source: "/torvald-klaveness", destination: "/kla", permanent: false },
      { source: "/klaveness-combination-carrier", destination: "/kcc", permanent: false },
      { source: "/klaveness-digital-1", destination: "/klaveness-digital", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...(isIndexable ? [] : [{ key: "X-Robots-Tag", value: "noindex" }]),
        ],
      },
      // Downloads keep the file name and open/download behaviour they had on the old site.
      ...downloads.map((file) => ({
        source: file.path,
        headers: [
          { key: "Content-Type", value: file.contentType },
          ...("inline" in file && file.inline
            ? []
            : [
                {
                  key: "Content-Disposition",
                  value: `attachment; filename="${file.fileName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
                },
              ]),
        ],
      })),
    ];
  },
};

export default nextConfig;
