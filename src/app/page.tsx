import type { Metadata } from "next";

import { PageSections } from "@/components/layout/PageSection";
import { homePage } from "@/content/pages";

export const metadata: Metadata = {
  title: { absolute: homePage.title },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <PageSections sections={homePage.sections} />;
}
