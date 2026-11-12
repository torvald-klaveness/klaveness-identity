import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageSections } from "@/components/layout/PageSection";
import { pages, type PageSlug } from "@/content/pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

function getPage(slug: string) {
  return slug in pages ? pages[slug as PageSlug] : null;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return {
    title: { absolute: page.title },
    alternates: { canonical: `/${slug}` },
    // The Torvald Klaveness and KCC guides were hidden from search engines on the old site.
    robots: page.noindex ? { index: false } : undefined,
  };
}

export default async function BrandPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  return <PageSections sections={page.sections} />;
}
