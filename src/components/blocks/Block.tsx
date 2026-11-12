import Image from "next/image";
import type { CSSProperties } from "react";

import type { Align, Block, ButtonBlock, ImageBlock } from "@/content/types";

type Placement = {
  /** Grid image only: how it sits in its area, desktop and mobile. */
  justify?: Align;
  justifyMobile?: Align;
  align?: Align;
  alignMobile?: Align;
  /** `sizes` hint for responsive images */
  sizes?: string;
};

const pos = (a: Align | undefined) => (a === "flex-start" ? "0%" : a === "flex-end" ? "100%" : "50%");

function Text({ html }: { html: string }) {
  return <div className="text" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Button({ block }: { block: ButtonBlock }) {
  return (
    <div className={`button-container button-container--${block.align}`}>
      <a
        href={block.href}
        className={`button button--${block.variant} button--${block.size}`}
        {...(block.newTab ? { target: "_blank", rel: "noopener" } : {})}
      >
        {block.text}
      </a>
    </div>
  );
}

function withLink(block: ImageBlock, content: React.ReactNode, className: string) {
  if (!block.href) return content;
  return (
    <a href={block.href} className={className} {...(block.newTab ? { target: "_blank", rel: "noopener" } : {})}>
      {content}
    </a>
  );
}

function FluidImage({ block, placement }: { block: ImageBlock; placement: Placement }) {
  const fit = block.fit ?? "fill";
  const fitMobile = block.fitMobile ?? fit;
  const focal = block.focal ? `${block.focal.x * 100}% ${block.focal.y * 100}%` : "50% 50%";
  // A fitted image keeps its proportions and sits where the block is aligned;
  // a filled image is cropped around its focal point.
  const style = {
    "--fit": fit === "fit" ? "contain" : "cover",
    "--fit-m": fitMobile === "fit" ? "contain" : "cover",
    "--op": fit === "fit" ? `${pos(placement.align)} ${pos(placement.justify)}` : focal,
    "--op-m":
      fitMobile === "fit"
        ? `${pos(placement.alignMobile ?? placement.align)} ${pos(placement.justifyMobile ?? placement.justify)}`
        : focal,
  } as CSSProperties;
  const img = (
    <Image
      src={block.src}
      alt={block.alt}
      fill
      sizes={placement.sizes ?? "100vw"}
      unoptimized={block.src.endsWith(".gif")}
    />
  );
  return (
    <div className="image image--fluid" style={style}>
      {withLink(block, img, "image-link")}
    </div>
  );
}

function ClassicImage({ block, sizes }: { block: ImageBlock; sizes?: string }) {
  const focal = block.focal ? `${block.focal.x * 100}% ${block.focal.y * 100}%` : undefined;
  const img = (
    <div className="image-shape" style={{ paddingBottom: `${block.ratio ?? 100}%` }}>
      <Image
        src={block.src}
        alt={block.alt}
        fill
        sizes={sizes ?? "(max-width: 767px) 100vw, 50vw"}
        style={focal ? { objectPosition: focal } : undefined}
        unoptimized={block.src.endsWith(".gif")}
      />
    </div>
  );
  return (
    <figure className="image image--classic" style={block.maxWidth ? { maxWidth: block.maxWidth } : undefined}>
      {withLink(block, img, "image-link")}
      {block.caption ? (
        <figcaption className="image-caption" dangerouslySetInnerHTML={{ __html: block.caption }} />
      ) : null}
    </figure>
  );
}

function Code({ html, css }: { html: string; css?: string }) {
  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div className="code" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

export function BlockContent({ block, placement = {} }: { block: Block; placement?: Placement }) {
  switch (block.type) {
    case "text":
      return <Text html={block.html} />;
    case "button":
      return <Button block={block} />;
    case "image":
      return block.fluid ? (
        <FluidImage block={block} placement={placement} />
      ) : (
        <ClassicImage block={block} sizes={placement.sizes} />
      );
    case "spacer":
      return block.ratio ? (
        <div className="spacer" style={{ paddingBottom: `${block.ratio}%` }}>
          &nbsp;
        </div>
      ) : (
        <div className="spacer" style={{ height: (block.size ?? 1) * 34 }}>
          &nbsp;
        </div>
      );
    case "anchor":
      return <p id={block.anchor} className="anchor" />;
    case "code":
      return <Code html={block.html} css={block.css} />;
  }
}
