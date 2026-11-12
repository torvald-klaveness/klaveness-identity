// Site-wide settings: name, logo and the menu.

export const site = {
  name: "Klaveness Brands",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.klavenessidentity.com",
  logo: { src: "/images/site/tk-logo.png", alt: "Klaveness Brands", width: 1500, height: 400 },
};

export type NavLink = { label: string; href: string };
export type NavFolder = { label: string; id: string; href: string; links: NavLink[] };

// Each top item opens a dropdown. `href` is where the mobile menu's folder title
// pointed on the old site (it redirects to the folder's first page).
export const navigation: NavFolder[] = [
  {
    label: "Torvald Klaveness",
    id: "torvald-klaveness",
    href: "/kla",
    links: [
      { label: "Overview", href: "/kla" },
      { label: "Logo", href: "/kla#kla-logo" },
      { label: "Typography", href: "/kla#kla-typography" },
      { label: "Colors", href: "/kla#kla-colours" },
      { label: "Templates", href: "/kla#kla-brand-elements" },
      { label: "Vision and values", href: "/kla#kla-vision" },
      { label: "Images", href: "/kla#kla-images" },
      { label: "Company presentation", href: "/kla#company-presentation" },
    ],
  },
  {
    label: "Klaveness Combination Carriers",
    id: "klaveness-combination-carriers",
    href: "/kcc",
    links: [
      { label: "Overview", href: "/kcc" },
      { label: "Logo", href: "/kcc#kcc-logo" },
      { label: "Typography", href: "/kcc#kcc-typography" },
      { label: "Colors", href: "/kcc#kcc-colours" },
      { label: "Templates", href: "/kcc#kcc-brand-elements" },
      { label: "Slogan", href: "/kcc#kcc-vision" },
      { label: "Images", href: "/kcc#kcc-images" },
    ],
  },
  {
    label: "Klaveness Digital",
    id: "klaveness-digital",
    href: "/klaveness-digital",
    links: [
      { label: "Overview", href: "/klaveness-digital" },
      { label: "Logo", href: "/klaveness-digital#logo" },
      { label: "Typography", href: "/klaveness-digital#typography" },
      { label: "Colors", href: "/klaveness-digital#colors" },
      { label: "Templates", href: "/klaveness-digital#templates" },
      { label: "Graphic Elements", href: "/klaveness-digital#graphics" },
      { label: "Images", href: "/klaveness-digital#images" },
    ],
  },
];
