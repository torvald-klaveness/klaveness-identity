import type { MetadataRoute } from "next";

import { site } from "@/content/site";

// Same pages as the old sitemap: the Torvald Klaveness and KCC guides were left out
// (and set to noindex) on Squarespace, so they stay out here too.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, priority: 1 },
    { url: `${site.url}/klaveness-digital`, priority: 0.75 },
  ];
}
