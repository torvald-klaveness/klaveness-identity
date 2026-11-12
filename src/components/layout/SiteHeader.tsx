"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { navigation, site } from "@/content/site";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <span className={`chevron chevron--${direction}`} aria-hidden="true">
      <svg viewBox="0 0 22 22">
        <path d={direction === "right" ? "M7.5 4L14.5 11L7.5 18" : "M14.5 4L7.5 11L14.5 18"} />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileFolder, setMobileFolder] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Lock page scrolling while the mobile menu is open.
  useEffect(() => {
    document.documentElement.classList.toggle("header--menu-open", menuOpen);
    return () => document.documentElement.classList.remove("header--menu-open");
  }, [menuOpen]);

  // Close a dropdown opened by click when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!openDropdown) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && (e.target as Element).closest?.(".header-nav-item--folder")) return;
      setOpenDropdown(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, [openDropdown]);

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileFolder(null);
  };

  return (
    <header className={`header${menuOpen ? " header--menu-open" : ""}`} data-section-theme="white">
      <div className="header-inner">
        <div className="header-title-logo">
          <Link href="/" onClick={closeMenu}>
            <Image src={site.logo.src} alt={site.logo.alt} width={site.logo.width} height={site.logo.height} priority />
          </Link>
        </div>

        <nav className="header-nav" aria-label="Main">
          {navigation.map((folder) => (
            <div
              key={folder.id}
              className={`header-nav-item header-nav-item--folder${openDropdown === folder.id ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="header-nav-folder-title"
                aria-expanded={openDropdown === folder.id}
                aria-controls={folder.id}
                onClick={() => setOpenDropdown((cur) => (cur === folder.id ? null : folder.id))}
              >
                {folder.label}
              </button>
              <div className="header-nav-folder-content" id={folder.id}>
                {folder.links.map((link) => (
                  <div key={link.href} className="header-nav-folder-item">
                    <a href={link.href} onClick={() => setOpenDropdown(null)}>
                      {link.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="header-burger"
          aria-label={menuOpen ? "Close Menu" : "Open Menu"}
          aria-expanded={menuOpen}
          aria-controls="header-menu"
          onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
        >
          <span className="burger-line burger-line--top" />
          <span className="burger-line burger-line--bottom" />
        </button>
      </div>

      <div className="header-menu" id="header-menu" aria-hidden={!menuOpen}>
        <div className={`header-menu-nav${mobileFolder ? " is-folder-open" : ""}`}>
          <div className="header-menu-nav-folder header-menu-nav-folder--root">
            <div className="header-menu-nav-folder-content">
              {navigation.map((folder) => (
                <div key={folder.id} className="header-menu-nav-item">
                  <a
                    href={folder.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileFolder(folder.id);
                    }}
                    tabIndex={menuOpen && !mobileFolder ? 0 : -1}
                  >
                    <span className="visually-hidden">Folder:</span>
                    <span>{folder.label}</span>
                    <Chevron direction="right" />
                  </a>
                </div>
              ))}
            </div>
          </div>
          {navigation.map((folder) => (
            <div
              key={folder.id}
              className={`header-menu-nav-folder header-menu-nav-folder--sub${mobileFolder === folder.id ? " is-active" : ""}`}
            >
              <div className="header-menu-nav-folder-content">
                <div className="header-menu-controls">
                  <a
                    href="#"
                    className="header-menu-back"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileFolder(null);
                    }}
                    tabIndex={mobileFolder === folder.id ? 0 : -1}
                  >
                    <Chevron direction="left" />
                    <span>Back</span>
                  </a>
                </div>
                {folder.links.map((link) => (
                  <div key={link.href} className="header-menu-nav-item">
                    <a href={link.href} onClick={closeMenu} tabIndex={mobileFolder === folder.id ? 0 : -1}>
                      {link.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
