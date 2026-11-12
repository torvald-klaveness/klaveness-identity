import type { MetadataRoute } from "next";

import { site } from "@/content/site";

// Search engines may index only the live site, not the vercel.app staging address.
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "";
const isIndexable =
  process.env.VERCEL_ENV === "production" && productionUrl.endsWith("klavenessidentity.com");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isIndexable ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
