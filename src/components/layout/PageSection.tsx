import Image from "next/image";
import type { CSSProperties } from "react";

import type { Section } from "@/content/types";

import { ClassicLayout } from "./ClassicLayout";
import { FluidLayout } from "./FluidLayout";

export function PageSection({ section, priority }: { section: Section; priority?: boolean }) {
  const classes = [
    "page-section",
    `section-height--${section.height}`,
    `vertical-alignment--${section.vAlign}`,
    `horizontal-alignment--${section.hAlign}`,
    `content-width--${section.contentWidth}`,
    section.layout?.kind === "fluid" ? "fluid-section" : "classic-section",
  ];
  const style: CSSProperties = section.minHeight ? { minHeight: section.minHeight } : {};
  const wrapperStyle: CSSProperties = {};
  if (section.padTop) wrapperStyle.paddingTop = section.padTop;
  if (section.padBottom) wrapperStyle.paddingBottom = section.padBottom;
  const bg = section.backgroundImage;

  return (
    <section
      className={classes.join(" ")}
      data-section-theme={section.theme || undefined}
      id={section.anchor}
      style={style}
    >
      <div className="section-background" style={section.background ? { backgroundColor: section.background } : undefined}>
        {bg ? (
          <>
            <Image
              src={bg.src}
              alt={bg.alt}
              fill
              sizes="100vw"
              priority={priority}
              style={bg.focal ? { objectPosition: `${bg.focal.x * 100}% ${bg.focal.y * 100}%` } : undefined}
            />
            {bg.overlayOpacity ? (
              <div className="section-background-overlay" style={{ opacity: bg.overlayOpacity }} />
            ) : null}
          </>
        ) : null}
      </div>
      <div className="content-wrapper" style={wrapperStyle}>
        <div className="content">
          {section.layout?.kind === "fluid" ? <FluidLayout layout={section.layout} /> : null}
          {section.layout?.kind === "classic" ? <ClassicLayout layout={section.layout} /> : null}
        </div>
      </div>
    </section>
  );
}

export function PageSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <PageSection key={s.id} section={s} priority={i === 0} />
      ))}
    </>
  );
}
