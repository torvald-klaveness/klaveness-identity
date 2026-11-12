import type { Metadata, Viewport } from "next";

import { HashScroll } from "@/components/layout/HashScroll";
import { PageSections } from "@/components/layout/PageSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { footerSections } from "@/content/pages";
import { site } from "@/content/site";

import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s — ${site.name}` },
  openGraph: { siteName: site.name, type: "website", images: [{ url: site.logo.src }] },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body>
        <div className="site-wrapper">
          <a href="#page" className="skip-link button button--primary" data-section-theme="white">
            Skip to Content
          </a>
          <SiteHeader />
          <main id="page">{children}</main>
          <footer className="site-footer">
            <PageSections sections={footerSections} />
          </footer>
        </div>
        <HashScroll />
      </body>
    </html>
  );
}
