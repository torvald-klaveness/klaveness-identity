// Shape of the page data in src/content/pages/*.json.
// The data was imported from the old Squarespace site (scripts/import-squarespace.mjs)
// and keeps Squarespace's layout model, so the pages look exactly as before.

/** Grid placement: row start / column start / row end / column end (CSS grid lines). */
export type GridArea = [number, number, number, number];

export type Align = "flex-start" | "center" | "flex-end";

export type TextBlock = {
  type: "text";
  id: string;
  /** Rich text (HTML). Headings, paragraphs, links and inline styles as on the old site. */
  html: string;
};

export type ImageBlock = {
  type: "image";
  id: string;
  /** Path under public/, e.g. /images/kla/kla-blue.png */
  src: string;
  alt: string;
  width?: number;
  height?: number;
  href?: string;
  newTab?: boolean;
  caption?: string;
  /** Fluid (grid) image: fills its grid area, fitted ("fit") or cropped ("fill"). */
  fluid: boolean;
  fit?: "fit" | "fill";
  fitMobile?: "fit" | "fill";
  /** Classic image: height as a percentage of its width. */
  ratio?: number;
  maxWidth?: number;
  align?: string;
  /** Crop focal point, 0–1 (defaults to the centre). */
  focal?: { x: number; y: number };
};

export type ButtonBlock = {
  type: "button";
  id: string;
  text: string;
  href: string;
  newTab?: boolean;
  size: "small" | "medium" | "large";
  /** primary = blue Source Sans button (KLA/KCC), tertiary = green Poppins button (KD) */
  variant: "primary" | "secondary" | "tertiary";
  align: "left" | "center" | "right";
};

/** Empty space: `size` steps of 34px, or (older spacers) a height of `ratio`% of the width. */
export type SpacerBlock = { type: "spacer"; id: string; size?: number; ratio?: number };

/** Invisible target for the menu's #anchor links. */
export type AnchorBlock = { type: "anchor"; id: string; anchor: string };

/** Raw HTML/CSS embed. */
export type CodeBlock = { type: "code"; id: string; html: string; css?: string };

export type Block = TextBlock | ImageBlock | ButtonBlock | SpacerBlock | AnchorBlock | CodeBlock;

export type FluidItem = {
  desktop?: GridArea;
  mobile?: GridArea;
  z?: number;
  /** Vertical alignment inside the grid area */
  justify?: Align;
  justifyMobile?: Align;
  /** Horizontal alignment inside the grid area */
  align?: Align;
  alignMobile?: Align;
  block: Block;
};

export type FluidLayout = {
  kind: "fluid";
  mobileRows: number;
  desktopRows: number;
  rowScale: number;
  blocks: FluidItem[];
};

export type ClassicColumn = { span: number; items: (Block | { row: ClassicRow })[] };
export type ClassicRow = { cols: ClassicColumn[] };
export type ClassicLayout = { kind: "classic"; rows: ClassicRow[] };

export type Section = {
  id: string;
  anchor?: string;
  /** Squarespace section theme: "white", "black-bold", or "" (site default: dark) */
  theme: string;
  /** Background colour override */
  background?: string;
  backgroundImage?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    focal?: { x: number; y: number };
    overlayOpacity?: number;
  };
  height: "small" | "medium" | "large" | "custom";
  minHeight?: string;
  padTop?: string;
  padBottom?: string;
  contentWidth: string;
  vAlign: "top" | "middle" | "bottom";
  hAlign: "left" | "center" | "right";
  backgroundWidth: string;
  fullBleed?: boolean;
  layout: FluidLayout | ClassicLayout | null;
};

export type PageData = {
  title: string;
  noindex?: boolean;
  sections: Section[];
};

export type Download = {
  /** Address on the site, e.g. /s/kd-logo.zip (file lives in public/s/) */
  path: string;
  /** File name the browser saves it as */
  fileName: string;
  contentType: string;
  /** true = opens in the browser (PDF), otherwise downloads */
  inline?: boolean;
};
