# klavenessidentity.com

The Klaveness brand guides (Torvald Klaveness, Klaveness Combination Carriers and Klaveness
Digital), moved from Squarespace to Next.js on Vercel. The site is a faithful copy of the
Squarespace version: same pages, layout, links, images and downloads.

Built with Next.js 16 (App Router), React 19 and TypeScript. Every page is static.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script                    | What it does                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `pnpm build`              | Production build (all pages are statically generated)          |
| `pnpm typecheck`          | Generates route types and runs `tsc`                            |
| `pnpm lint`               | ESLint                                                          |
| `pnpm format`             | Prettier                                                        |
| `pnpm import:squarespace` | Re-imports the old Squarespace site (see below). Overwrites content |

## Pages

| Address              | Page                                                   |
| -------------------- | ------------------------------------------------------ |
| `/` (also `/home`)   | Home                                                   |
| `/kla`               | Torvald Klaveness (Group & Klaveness Dry Bulk) guide   |
| `/kcc`               | Klaveness Combination Carriers guide                   |
| `/klaveness-digital` | Klaveness Digital guide                                |

Old addresses `/torvald-klaveness`, `/klaveness-combination-carrier` and `/klaveness-digital-1`
redirect to these, as they did on Squarespace. `/kla` and `/kcc` are `noindex` and left out of
the sitemap, as before.

## Where things are

```
src/
  app/                  Routes, fonts, styles, robots.txt, sitemap.xml, icon
    globals.css         The site's styles (a port of the Squarespace theme)
    fonts.css           Source Sans Pro and Poppins, self-hosted (public/fonts/)
  components/
    layout/             Header (menu), page sections, grid and classic layouts
    blocks/Block.tsx    Text, image, button, spacer, anchor and code blocks
  content/
    site.ts             Site name, logo and the menu
    pages/*.json        Each page's sections and blocks (text, images, buttons)
    footer.json         The footer ("Questions? …")
    downloads.json      Every downloadable file and the name it downloads as
    types.ts            The shape of the content data
public/
  images/<page>/        Every image on the site, in its original resolution
  s/                    Every downloadable file (templates, logo packs, fonts, …)
  fonts/                Web fonts
scripts/
  import-squarespace.mjs  One-off import from Squarespace
  image-sources.json      Where each image came from on Squarespace
```

### Editing content

- **Text, buttons and links**: edit the page's file in `src/content/pages/`. Text blocks hold
  HTML (`"html": "<p>…</p>"`).
- **Replacing a download** (for example a new company presentation): replace the file in
  `public/s/`. To change its address, update the button's `href` in the page file and its entry
  in `src/content/downloads.json` (which sets the file name people get).
- **Replacing an image**: put the new file in `public/images/<page>/` and update `src`.
- **Menu**: `src/content/site.ts`.

The page data keeps Squarespace's layout model so the pages look exactly as before:

- **Grid sections** (`"kind": "fluid"`, all of Klaveness Digital) place each block on a
  24-column grid on desktop (`desktop: [rowStart, colStart, rowEnd, colEnd]`) and an
  8-column grid on phones (`mobile`). Columns 2–25 are the content area.
- **Classic sections** (`"kind": "classic"`, most of KLA and KCC) are rows of columns on a
  12-column grid; columns stack on phones.
- **Anchor blocks** are the targets of the menu's `#…` links (for example `#kla-logo`).

### Downloads

Files are served from `/s/<file>`, the same addresses as on Squarespace, so links shared
earlier keep working. `next.config.ts` sends each file with the name it had on Squarespace
(for example `Torvald Klaveness Power BI theme.json`); the brand colour PDF opens in the browser,
everything else downloads.

### Re-importing from Squarespace

`pnpm import:squarespace` reads the live Squarespace pages and rewrites `src/content/pages/*.json`,
`src/content/footer.json` and `src/content/downloads.json`, and downloads any image or file
missing from `public/`. Use it only while Squarespace is still the source (for example to pick
up a last-minute change before the switch); after the switch, edit the content files directly.

## Deployment

One branch, `main`, deployed from Klaveness's own Vercel account to
https://www.klavenessidentity.com on every push. There is no staging site; preview changes
locally with `pnpm dev`.

After the domain is added in Vercel, redeploy once: indexing is switched on only when the
project's production domain is klavenessidentity.com.

Search engines are kept out of every deployment except production on klavenessidentity.com
(`X-Robots-Tag: noindex` and a disallow-all `robots.txt`).

## Switching the domain

`klavenessidentity.com` is registered with MarkMonitor and its DNS is on Cloudflare; today it
points at Squarespace (A records `198.185.159.144/145` and `198.49.23.144/145`,
`www` → `ext-cust.squarespace.com`). To switch:

1. Add `klavenessidentity.com` and `www.klavenessidentity.com` to the live Vercel project
   (Project → Settings → Domains), with `www` as the primary domain (as on Squarespace).
2. In Cloudflare, replace the Squarespace records with the ones Vercel shows for each domain
   (an A record for the apex and a CNAME for `www`), DNS only (grey cloud).
3. Check the pages, menu links and a few downloads on the new domain, then cancel the
   Squarespace subscription.

## Not carried over

- Squarespace's empty shopping-cart page (`/cart`) and search page (`/search`); the site had
  no shop or search.
- The "mega menu" plugin and its hidden `/mega-menu` page: the plugin was set to open on a
  `/klaveness-brands` link that is not in the menu, so it never showed.
