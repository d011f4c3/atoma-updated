"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useCart } from "./cart-drawer";
import { SiteFooter } from "./site-footer";
import { usePageScroll } from "./smooth-scroll";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ThemeSwitcher } from "./theme-switcher";
import { DestinationSelector } from "./destination-selector";
import { usePageReveals } from "./use-page-reveals";

export function StorefrontFooter({ year }: { year: number }) {
  const pathname = usePathname();
  const footerRef = useRef<HTMLElement>(null);
  const pageReveals = ["/", "/samples", "/about"].includes(pathname);
  usePageReveals(footerRef, pageReveals);
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  const scrollTo = usePageScroll();

  function backToTop() {
    if (busy) return;
    document
      .querySelector<HTMLElement>("[data-nav-brand]")
      ?.focus({ preventScroll: true });
    scrollTo(0);
  }

  return (
    <SiteFooter
      canonical
      footerRef={footerRef}
      pageReveals={pageReveals}
      direction="directory"
      tone={tone}
      year={year}
      shopLabel="Wholesale"
      showAbout
      showManageSubscriptions
      showSamples={pathname !== "/"}
      originsReturnLabel={
        pathname.startsWith("/field-notes/")
          ? "Back to field note"
          : pathname === "/about"
            ? "Back to About"
            : pathname === "/samples"
              ? "Back to samples"
              : undefined
      }
      onBackToTop={backToTop}
      themeControl={
        <ThemeSwitcher label="Dark mode in footer" showLanguage={false} />
      }
      destinationControl={<DestinationSelector />}
    />
  );
}
