"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import styles from "./site-footer.module.css";

export type FooterDirection =
  "index" | "colophon" | "compact" | "rail" | "directory";

export function SiteFooter({
  direction,
  tone,
  year,
  onBackToTop,
  footerRef,
  themeControl,
}: {
  direction: FooterDirection;
  tone: "light" | "dark";
  year: number;
  onBackToTop: () => void;
  footerRef?: Ref<HTMLElement>;
  themeControl?: ReactNode;
}) {
  const { t } = useStorefrontLocale();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  // Plain placeholders until real policy and contact destinations are supplied.
  const utilityLinks = (
    <div
      className={styles.utility}
      data-footer-utility-preview
      role="group"
      aria-label={t("Information")}
    >
      <ul className={styles.utilityList}>
        <li>{t("Privacy policy")}</li>
        <li>{t("Terms")}</li>
        <li>{t("Contact")}</li>
      </ul>
    </div>
  );
  const wordmark = (
    <Link
      className={styles.wordmark}
      href="/"
      aria-label={t("ATOMA homepage")}
      aria-disabled={busy || undefined}
      onClick={(event) => {
        if (busy) event.preventDefault();
      }}
    >
      ATOMA
    </Link>
  );

  return (
    <footer
      ref={footerRef}
      className={styles.footer}
      data-site-footer
      data-footer-direction={direction}
      data-tone={tone}
      aria-label={t("ATOMA footer")}
      tabIndex={-1}
    >
      <div className={styles.body}>
        <div className={styles.identity}>
          {direction !== "colophon" && wordmark}
          <p className={styles.statement}>{t("Carefully specified matcha.")}</p>
        </div>
        <nav className={styles.navigation} aria-label={t("Footer navigation")}>
          <Link
            className={styles.destination}
            href="/shop"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <span className={styles.number} aria-hidden="true">
              01
            </span>
            <span className={styles.linkCopy}>
              <span>{t("Shop matcha")}</span>
              <span className={styles.description}>
                {t("Formats & selection")}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </Link>
          <button
            className={styles.destination}
            type="button"
            disabled={busy}
            onClick={() => openOrigins({ tone })}
          >
            <span className={styles.number} aria-hidden="true">
              02
            </span>
            <span className={styles.linkCopy}>
              <span>{t("Growing places")}</span>
              <span className={styles.description}>
                {t("Explore the origins")}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </button>
          <button
            className={styles.destination}
            type="button"
            disabled={busy}
            onClick={onBackToTop}
          >
            <span className={styles.number} aria-hidden="true">
              03
            </span>
            <span className={styles.linkCopy}>
              <span>{t("Back to top")}</span>
              <span className={styles.description}>
                {t("Return to the beginning")}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↑
            </span>
          </button>
        </nav>
        {direction === "directory" && utilityLinks}
        {direction === "colophon" && wordmark}
      </div>
      <div className={styles.base}>
        <span>© {year} ATOMA</span>
        {direction !== "directory" && utilityLinks}
        {themeControl ? (
          <div className={styles.appearance}>
            <span>{t("Appearance")}</span>
            {themeControl}
          </div>
        ) : (
          <span>{t("Matcha")}</span>
        )}
      </div>
    </footer>
  );
}
