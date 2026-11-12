#!/usr/bin/env node
// One-off import of klavenessidentity.com from Squarespace.
//
// Reads the live pages, turns every section into plain data (src/content/pages/*.json)
// and downloads every image and downloadable file into public/. The site renders that
// data with the same grid rules Squarespace used, so the layout matches the old site.
//
//   pnpm import:squarespace            fetch the live site
//   pnpm import:squarespace -- --cache <dir>   read <dir>/<page>.html instead (offline re-run)
//
// Re-running overwrites src/content/pages/*.json and src/content/downloads.json, so make
// content edits there only after the old site is switched off. Existing files in public/
// are kept (delete one to download it again).

import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const ORIGIN = "https://www.klavenessidentity.com";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTENT_DIR = path.join(ROOT, "src/content/pages");
const PUBLIC_DIR = path.join(ROOT, "public");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)";

// Squarespace path -> local page slug (file name in src/content/pages)
const PAGES = [
  { slug: "home", path: "/" },
  { slug: "klaveness-digital", path: "/klaveness-digital" },
  { slug: "kla", path: "/kla" },
  { slug: "kcc", path: "/kcc" },
];

const cacheIdx = process.argv.indexOf("--cache");
const CACHE = cacheIdx > -1 ? process.argv[cacheIdx + 1] : null;

// ---------------------------------------------------------------- helpers

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// The image CDN converts images to WebP unless asked for the original format.
const IMAGE_ACCEPT = "image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.1";
const MAGIC = { ".png": "89504e47", ".jpg": "ffd8ff", ".jpeg": "ffd8ff", ".gif": "47494638" };

async function download(url, dest, { image = false } = {}) {
  const expected = image ? MAGIC[path.extname(dest).toLowerCase()] : null;
  const matches = (buf) => !expected || buf.subarray(0, 4).toString("hex").startsWith(expected);
  if (fs.existsSync(dest) && matches(fs.readFileSync(dest))) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const headers = { "User-Agent": UA, ...(image ? { Accept: IMAGE_ACCEPT } : {}) };
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!matches(buf)) console.warn(`warning: ${dest} is not a ${path.extname(dest)} file (${res.headers.get("content-type")})`);
  fs.writeFileSync(dest, buf);
  return true;
}

const decodeEntities = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

function jsonAttr(el, name) {
  const raw = el.getAttribute(name);
  if (!raw) return null;
  try {
    return JSON.parse(decodeEntities(raw));
  } catch {
    return null;
  }
}

let DOC = null; // current page's document
function parse(html) {
  const t = DOC.createElement("template");
  t.innerHTML = html;
  return t.content;
}
const serialize = (frag) => [...frag.childNodes].map((n) => (n.nodeType === 1 ? n.outerHTML : n.textContent)).join("");

const classList = (el) => (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
const classValue = (el, prefix) => {
  const c = classList(el).find((x) => x.startsWith(prefix));
  return c ? c.slice(prefix.length) : null;
};

// Images: one local file per Squarespace asset, named after the original file.
const images = new Map(); // remote url -> local public path
const usedNames = new Map(); // local path -> remote url

function slugifyFile(name) {
  const decoded = decodeURIComponent(name.replace(/\+/g, " "));
  const ext = path.extname(decoded).toLowerCase();
  const base = decoded
    .slice(0, decoded.length - ext.length)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { base: base || "image", ext: ext || ".png" };
}

function localImage(remote, folder) {
  if (!remote) return null;
  let url = remote.startsWith("//") ? `https:${remote}` : remote;
  url = url.split("?")[0];
  if (images.has(url)) return images.get(url);
  const { base, ext } = slugifyFile(url.split("/").pop());
  let local = `/images/${folder}/${base}${ext}`;
  let n = 2;
  while (usedNames.has(local) && usedNames.get(local) !== url) local = `/images/${folder}/${base}-${n++}${ext}`;
  usedNames.set(local, url);
  images.set(url, local);
  return local;
}

function parseDims(img) {
  const d = img?.getAttribute("data-image-dimensions");
  if (!d) return null;
  const [w, h] = d.split("x").map(Number);
  return w && h ? { width: w, height: h } : null;
}

function focal(img, root) {
  const f = img?.getAttribute("data-image-focal-point") || root?.getAttribute("data-media-focal-point");
  if (!f) return undefined;
  const [x, y] = f.split(",").map(Number);
  if (x === 0.5 && y === 0.5) return undefined;
  return { x, y };
}

// Clean rich text: keep the markup and inline styles, drop Squarespace attributes.
function cleanHtml(html) {
  const root = parse(html);
  root.querySelectorAll("*").forEach((el) => {
    for (const name of [...el.attributes].map((a) => a.name)) {
      const keep = ["href", "target", "style", "id", "rel", "src", "alt", "class", "data-rte-list", "data-rte-preserve-empty"].includes(name);
      if (!keep) el.removeAttribute(name);
    }
    const cls = classList(el).filter((c) => c.startsWith("sqsrte-"));
    if (cls.length) el.setAttribute("class", cls.join(" "));
    else el.removeAttribute("class");
    const href = el.getAttribute("href");
    if (href) el.setAttribute("href", localHref(href));
  });
  return serialize(root).replace(/\s*\n\s*/g, " ").trim();
}

function localHref(href) {
  if (!href) return href;
  return href.replace(/^https?:\/\/(www\.)?klavenessidentity\.com(?=\/|$)/, "") || "/";
}

// ---------------------------------------------------------------- blocks

function parseBlock(blockEl, folder) {
  const cls = classList(blockEl);
  const id = (blockEl.getAttribute("id") || "").replace(/^block-/, "");

  if (cls.includes("sqs-block-html")) {
    const content = blockEl.querySelector(".sqs-html-content");
    return { type: "text", id, html: cleanHtml(content ? content.innerHTML : "") };
  }

  if (cls.includes("sqs-block-button")) {
    const container = blockEl.querySelector(".sqs-block-button-container");
    const a = blockEl.querySelector("a");
    const align = container ? classValue(container, "sqs-block-button-container--") : null;
    return {
      type: "button",
      id,
      text: a.textContent.trim(),
      href: localHref(a.getAttribute("href")),
      newTab: a.getAttribute("target") === "_blank" || undefined,
      size: container?.getAttribute("data-button-size") || "medium",
      variant: container?.getAttribute("data-button-type") || "primary",
      align: align || "left",
    };
  }

  if (cls.includes("sqs-block-spacer")) {
    const vsize = cls.find((c) => /^vsize-\d+$/.test(c));
    if (vsize) return { type: "spacer", id, size: Number(vsize.split("-")[1]) };
    // Older spacers keep a width:height ratio (padding-bottom in % of the width)
    const ratio = Number(blockEl.getAttribute("data-aspect-ratio"));
    return ratio ? { type: "spacer", id, ratio } : { type: "spacer", id, size: 1 };
  }

  if (cls.includes("sqs-block-code")) {
    const container = blockEl.querySelector(".sqs-code-container");
    const style = [...blockEl.querySelectorAll("style")]
      .filter((s) => !classList(s).includes("transform-overrides-vars"))
      .map((s) => s.innerHTML.trim())
      .filter(Boolean)
      .join("\n");
    let inner = container ? container.innerHTML : "";
    // Squarespace nests the code's own <style> inside the container
    const own = parse(inner);
    const ownStyles = [...own.querySelectorAll("style")].map((s) => s.innerHTML.trim());
    own.querySelectorAll("style").forEach((s) => s.remove());
    inner = serialize(own).replace(/\s*\n\s*/g, " ").trim();
    const css = [...ownStyles, style].filter(Boolean).join("\n");
    // A lone <p id="..."></p> is only an anchor target for the menu links
    const anchor = inner.match(/^<p id="([^"]+)"><\/p>$/);
    if (anchor) return { type: "anchor", id, anchor: anchor[1] };
    return { type: "code", id, html: inner, css: css || undefined };
  }

  if (cls.includes("sqs-block-image")) {
    const img = blockEl.querySelector("img");
    const remote = img?.getAttribute("data-src") || img?.getAttribute("data-image") || img?.getAttribute("src");
    const link = blockEl.querySelector("a[href]");
    const dims = parseDims(img);
    const captionEl = blockEl.querySelector(".image-caption");
    const caption = captionEl ? cleanHtml(captionEl.innerHTML) : "";
    const base = {
      type: "image",
      id,
      src: localImage(remote, folder),
      alt: decodeEntities(img?.getAttribute("alt") || ""),
      width: dims?.width,
      height: dims?.height,
      href: link ? localHref(link.getAttribute("href")) : undefined,
      newTab: link?.getAttribute("target") === "_blank" || undefined,
      caption: caption || undefined,
    };
    const fluidRoot = blockEl.querySelector(".fluid-image-component-root");
    if (fluidRoot) {
      // Fluid engine image: fills its grid area, either fitted or cropped.
      const desktop = fluidRoot.querySelector(".js-content-mode-element-system_desktop .js-content-mode-element");
      const mobile = fluidRoot.querySelector(".js-content-mode-element-system_mobile .js-content-mode-element");
      const modeOf = (el) => (el ? (classList(el).includes("content-fill") ? "fill" : "fit") : null);
      const fitDesktop = modeOf(desktop) || (classList(fluidRoot).includes("image-component-container-fit") ? "fit" : "fill");
      const fitMobile = modeOf(mobile) || fitDesktop;
      return {
        ...base,
        fluid: true,
        fit: fitDesktop,
        fitMobile: fitMobile !== fitDesktop ? fitMobile : undefined,
        focal: focal(img, fluidRoot),
      };
    }
    // Classic image: full column width, fixed aspect ratio from the container padding.
    const shape = blockEl.querySelector("[data-sqsp-image-classic-block-image-container]") || blockEl.querySelector(".sqs-image-shape-container-element");
    const pad = shape?.getAttribute("style")?.match(/padding-bottom:\s*([\d.]+)%/);
    const wrapper = blockEl.querySelector(".image-block-outer-wrapper");
    const figure = blockEl.querySelector("figure");
    const maxW = figure?.getAttribute("style")?.match(/max-width:\s*([\d.]+)px/);
    return {
      ...base,
      fluid: false,
      ratio: pad ? Number(pad[1]) : dims ? (dims.height / dims.width) * 100 : undefined,
      maxWidth: maxW ? Number(maxW[1]) : undefined,
      align: wrapper ? classValue(wrapper, "image-position-") || undefined : undefined,
      focal: focal(img),
    };
  }

  return { type: "unknown", id, classes: cls.join(" ") };
}

// ---------------------------------------------------------------- layouts

function parseFluid(engineWrap, folder) {
  const styleEl = engineWrap.querySelector("style");
  const css = styleEl ? styleEl.innerHTML : "";
  const mobileRows = Number(css.match(/grid-template-rows:\s*repeat\((\d+),\s*minmax\(24px/)?.[1] || 0);
  const desktopRows = Number(css.match(/grid-template-rows:\s*repeat\((\d+),\s*minmax\(calc\(var\(--container-width\)/)?.[1] || 0);
  const rowScale = Number(css.match(/--row-height-scaling-factor:\s*([\d.]+)/)?.[1] || 0.0215);

  const areas = {};
  for (const m of css.matchAll(/\.fe-block-([\w-]+)\s*\{\s*grid-area:\s*([^;]+);\s*z-index:\s*(\d+);/g)) {
    const [, bid, area, z] = m;
    const parts = area.split("/").map((n) => Number(n.trim()));
    (areas[bid] ||= []).push({ area: parts, z: Number(z) });
  }
  const justify = {};
  for (const m of css.matchAll(/\.fe-block-([\w-]+)\s+\.sqs-block\s*\{\s*justify-content:\s*([^;]+);/g)) (justify[m[1]] ||= []).push(m[2].trim());
  const alignItems = {};
  for (const m of css.matchAll(/\.fe-block-([\w-]+)\s+\.sqs-block-alignment-wrapper\s*\{\s*align-items:\s*([^;]+);/g)) (alignItems[m[1]] ||= []).push(m[2].trim());

  const blocks = [...engineWrap.querySelectorAll(".fe-block")].map((fe) => {
    const bid = classList(fe).find((c) => c.startsWith("fe-block-"))?.slice("fe-block-".length);
    const a = areas[bid] || [];
    const block = parseBlock(fe.querySelector(".sqs-block"), folder);
    const mobile = a[0];
    const desktop = a[1] || a[0];
    return {
      desktop: desktop?.area,
      mobile: mobile?.area,
      z: desktop?.z,
      justify: (justify[bid]?.[1] ?? justify[bid]?.[0]) || undefined,
      justifyMobile: justify[bid]?.[0] !== justify[bid]?.[1] ? justify[bid]?.[0] : undefined,
      align: (alignItems[bid]?.[1] ?? alignItems[bid]?.[0]) || undefined,
      alignMobile: alignItems[bid]?.[0] !== alignItems[bid]?.[1] ? alignItems[bid]?.[0] : undefined,
      block,
    };
  });

  return { kind: "fluid", mobileRows, desktopRows, rowScale, blocks };
}

function parseClassicRow(rowEl, folder) {
  return {
    cols: [...rowEl.children]
      .filter((n) => classList(n).includes("col"))
      .map((col) => {
        const span = Number(classList(col).find((c) => /^span-\d+$/.test(c))?.split("-")[1] || 12);
        const items = [...col.children]
          .map((n) => (classList(n).includes("row") ? { row: parseClassicRow(n, folder) } : classList(n).includes("sqs-block") ? parseBlock(n, folder) : null))
          .filter(Boolean);
        return { span, items };
      }),
  };
}

function parseClassic(layoutEl, folder) {
  const rows = [...layoutEl.children].filter((n) => classList(n).includes("row"));
  return { kind: "classic", rows: rows.map((r) => parseClassicRow(r, folder)) };
}

// ---------------------------------------------------------------- sections

function parseSection(sec, folder, customBg) {
  const styles = jsonAttr(sec, "data-current-styles") || {};
  const sid = sec.getAttribute("data-section-id");
  const wrapper = sec.querySelector(".content-wrapper");
  const pad = wrapper?.getAttribute("style") || "";
  const padTop = pad.match(/padding-top:\s*([^;]+);/)?.[1]?.trim();
  const padBottom = pad.match(/padding-bottom:\s*([^;]+);/)?.[1]?.trim();
  const minHeight = sec.getAttribute("style")?.match(/min-height:\s*([^;]+);/)?.[1]?.trim();

  const bgWrap = sec.querySelector(".section-background");
  const bgImg = bgWrap?.querySelector("img");
  const overlay = bgWrap?.querySelector(".section-background-overlay");
  const overlayOpacity = overlay?.getAttribute("style")?.match(/opacity:\s*([\d.]+)/)?.[1];

  const engine = sec.querySelector("[data-fluid-engine]");
  const classic = sec.querySelector(".sqs-layout");
  const layout = engine ? parseFluid(engine, folder) : classic ? parseClassic(classic, folder) : null;

  return {
    id: sid,
    anchor: sec.getAttribute("id") || undefined,
    theme: sec.getAttribute("data-section-theme") || "",
    background: customBg[sid] || undefined,
    backgroundImage: bgImg
      ? {
          src: localImage(bgImg.getAttribute("data-src") || bgImg.getAttribute("src"), folder),
          alt: decodeEntities(bgImg.getAttribute("alt") || ""),
          ...parseDims(bgImg),
          focal: focal(bgImg),
          overlayOpacity: overlayOpacity ? Number(overlayOpacity) : undefined,
        }
      : undefined,
    height: classValue(sec, "section-height--") || styles.sectionHeight?.replace("section-height--", "") || "custom",
    minHeight,
    padTop,
    padBottom,
    contentWidth: classValue(sec, "content-width--") || "wide",
    vAlign: classValue(sec, "vertical-alignment--") || "middle",
    hAlign: classValue(sec, "horizontal-alignment--") || "center",
    backgroundWidth: classValue(sec, "background-width--") || "full-bleed",
    fullBleed: classList(sec).includes("full-bleed-section") || undefined,
    layout,
  };
}

function customSectionBackgrounds(css) {
  const out = {};
  for (const m of css.matchAll(/section\[data-section-id="([^"]+)"\]\s*\.section-background\s*\{\s*background-color:\s*([^;!}]+)/g)) out[m[1]] = m[2].trim();
  return out;
}

// ---------------------------------------------------------------- run

async function getHtml(page) {
  if (CACHE) return fs.readFileSync(path.join(CACHE, `${page.slug}.html`), "utf8");
  return fetchText(ORIGIN + page.path);
}

async function main() {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const downloads = new Set();
  let customBg = {};

  for (const page of PAGES) {
    const html = await getHtml(page);
    const root = new JSDOM(html).window.document;
    DOC = root;

    if (!Object.keys(customBg).length) {
      const customCssHref = [...root.querySelectorAll("link[rel=stylesheet]")].map((l) => l.getAttribute("href")).find((h) => h?.includes("/custom-css/"));
      if (customCssHref) customBg = customSectionBackgrounds(await fetchText(customCssHref));
    }

    const title = root.querySelector("title")?.textContent || "";
    const robots = root.querySelector('meta[name="ROBOTS" i]')?.getAttribute("content");
    const sections = root.querySelectorAll("#sections > section[data-section-id], article section[data-section-id], main section[data-section-id]");
    const uniq = [...new Set(sections)];
    const data = {
      title,
      noindex: robots ? /noindex/i.test(robots) : undefined,
      sections: uniq.map((s) => parseSection(s, page.slug, customBg)),
    };
    fs.writeFileSync(path.join(CONTENT_DIR, `${page.slug}.json`), JSON.stringify(data, null, 2) + "\n");
    console.log(`${page.slug}: ${data.sections.length} sections`);

    if (page.slug === "home") {
      const footer = [...root.querySelectorAll("footer section[data-section-id]")].map((s) => parseSection(s, "site", customBg));
      fs.writeFileSync(path.join(ROOT, "src/content/footer.json"), JSON.stringify({ sections: footer }, null, 2) + "\n");
      const logo = root.querySelector(".header-title-logo img");
      if (logo) localImage(logo.getAttribute("src"), "site");
    }

    for (const m of html.matchAll(/href="(\/s\/[^"#?]+)"/g)) downloads.add(m[1]);
  }

  // Images
  let fetched = 0;
  for (const [remote, local] of images) {
    if (await download(remote, path.join(PUBLIC_DIR, local), { image: true })) fetched++;
  }
  console.log(`images: ${images.size} (${fetched} downloaded)`);
  fs.writeFileSync(path.join(ROOT, "scripts/image-sources.json"), JSON.stringify(Object.fromEntries([...images].map(([r, l]) => [l, r])), null, 2) + "\n");

  // Downloadable files: keep the exact /s/... address, and the file name and
  // inline/attachment behaviour the old site sent.
  const files = [];
  for (const href of [...downloads].sort()) {
    const head = await fetch(ORIGIN + href, { method: "HEAD", redirect: "manual", headers: { "User-Agent": UA } });
    const target = head.headers.get("location");
    if (!target) throw new Error(`No redirect for ${href}`);
    const res = await fetch(target, { method: "HEAD", headers: { "User-Agent": UA } });
    const disposition = res.headers.get("content-disposition");
    const original = decodeURIComponent(target.split("/").pop().replace(/\+/g, " "));
    files.push({
      path: href,
      fileName: disposition?.match(/filename="([^"]+)"/)?.[1] || original,
      contentType: res.headers.get("content-type"),
      inline: !disposition || undefined,
    });
    await download(target, path.join(PUBLIC_DIR, decodeURIComponent(href)));
  }
  fs.writeFileSync(path.join(ROOT, "src/content/downloads.json"), JSON.stringify(files, null, 2) + "\n");
  console.log(`downloads: ${files.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
