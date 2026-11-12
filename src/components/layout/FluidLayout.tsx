import type { CSSProperties } from "react";

import { BlockContent } from "@/components/blocks/Block";
import type { FluidLayout as FluidLayoutData, GridArea } from "@/content/types";

const area = (a?: GridArea) => (a ? a.join(" / ") : undefined);

// Approximate rendered width of a grid area, for responsive image `sizes`.
function sizesFor(desktop?: GridArea, mobile?: GridArea) {
  const d = desktop ? Math.min(100, Math.ceil(((desktop[3] - desktop[1]) / 24) * 94)) : 100;
  const m = mobile ? Math.min(100, Math.ceil(((mobile[3] - mobile[1]) / 8) * 88)) : 100;
  return `(max-width: 767px) ${m}vw, ${d}vw`;
}

/**
 * Squarespace "fluid engine" layout: a 24-column grid on desktop and an 8-column
 * grid on phones, every block placed on explicit grid lines.
 */
export function FluidLayout({ layout }: { layout: FluidLayoutData }) {
  const style = {
    "--rows-d": layout.desktopRows,
    "--rows-m": layout.mobileRows,
    "--row-scale": layout.rowScale,
  } as CSSProperties;
  return (
    <div className="fluid" style={style}>
      {layout.blocks.map((item) => {
        const s = {
          "--area-d": area(item.desktop ?? item.mobile),
          "--area-m": area(item.mobile ?? item.desktop),
          "--z": item.z ?? 0,
          "--justify-d": item.justify ?? "flex-start",
          "--justify-m": item.justifyMobile ?? item.justify ?? "flex-start",
          "--align-d": item.align ?? "flex-start",
          "--align-m": item.alignMobile ?? item.align ?? "flex-start",
        } as CSSProperties;
        return (
          <div key={item.block.id} className={`fe-item fe-item--${item.block.type}`} style={s}>
            <div className="fe-block">
              <BlockContent
                block={item.block}
                placement={{
                  justify: item.justify,
                  justifyMobile: item.justifyMobile,
                  align: item.align,
                  alignMobile: item.alignMobile,
                  sizes: sizesFor(item.desktop, item.mobile),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
