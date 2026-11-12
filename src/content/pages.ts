import type { Download, PageData, Section } from "./types";

import home from "./pages/home.json";
import klavenessDigital from "./pages/klaveness-digital.json";
import kla from "./pages/kla.json";
import kcc from "./pages/kcc.json";
import footerData from "./footer.json";
import downloadsData from "./downloads.json";

/** Brand-guide pages, by URL slug. The home page is "/" (and "/home"). */
export const pages = {
  "klaveness-digital": klavenessDigital as PageData,
  kla: kla as PageData,
  kcc: kcc as PageData,
} satisfies Record<string, PageData>;

export type PageSlug = keyof typeof pages;

export const homePage = home as PageData;

export const footerSections = footerData.sections as Section[];

/** Every downloadable file (public/s/), with the name it downloads as. */
export const downloads = downloadsData as Download[];
