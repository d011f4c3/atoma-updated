"use client";

import { useCart } from "./cart-drawer";
import { SiteFooter } from "./site-footer";
import { usePageScroll } from "./smooth-scroll";
import { useStorefrontTheme } from "./storefront-theme-provider";

export function StorefrontFooter({ year }: { year: number }) {
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  const scrollTo = usePageScroll();

  function backToTop() {
    if (busy) return;
    document
      .querySelector<HTMLElement>("main [data-nav-brand]")
      ?.focus({ preventScroll: true });
    scrollTo(0);
  }

  return (
    <SiteFooter
      direction="directory"
      tone={tone}
      year={year}
      onBackToTop={backToTop}
    />
  );
}
