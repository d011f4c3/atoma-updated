"use client";

import { usePathname } from "next/navigation";
import { useCart } from "./cart-drawer";
import { SiteFooter } from "./site-footer";
import { usePageScroll } from "./smooth-scroll";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ThemeSwitcher } from "./theme-switcher";
import { DestinationSelector } from "./destination-selector";

export function StorefrontFooter({ year }: { year: number }) {
  const pathname = usePathname();
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
      direction="directory"
      tone={tone}
      year={year}
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
      themeControl={<ThemeSwitcher label="Dark mode in footer" />}
      destinationControl={<DestinationSelector />}
    />
  );
}
