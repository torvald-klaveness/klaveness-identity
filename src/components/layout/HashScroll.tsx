"use client";

import { useEffect } from "react";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Anchor scrolling, as the old Squarespace site did it.
 *
 * When a page opens at an #anchor (a menu link from another page, a link opened in a
 * new tab, a shared URL), the browser jumps there before the web fonts have loaded.
 * Once they swap in, the text above changes height and the jump is off. So: wait for
 * the fonts and the page to load, jump to the anchor again (unless the visitor has
 * already started scrolling), and only then switch on smooth scrolling for in-page links.
 */
export function HashScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const id = decodeURIComponent(window.location.hash.slice(1));

    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    const events = ["wheel", "touchmove", "keydown", "mousedown"] as const;
    events.forEach((e) => window.addEventListener(e, cancel, { passive: true }));

    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));

    Promise.all([document.fonts.ready, loaded])
      .then(nextFrame)
      .then(nextFrame)
      .then(() => {
        if (id && !cancelled) {
          document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
        }
        root.classList.add("smooth-scroll");
      });

    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, cancel));
    };
  }, []);

  return null;
}
