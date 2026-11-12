"use client";

import { useEffect } from "react";

/**
 * When a page opens at an #anchor (a menu link from another page, a link opened in a
 * new tab, a shared URL), the browser jumps there before the web fonts have loaded.
 * Once they swap in, the text above gets shorter and the jump ends up too far down.
 * The old Squarespace site scrolled again after loading; this does the same, unless
 * the visitor has already started scrolling.
 */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

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

    Promise.all([document.fonts.ready, loaded]).then(() => {
      if (cancelled) return;
      document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
    });

    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, cancel));
    };
  }, []);

  return null;
}
