"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { SHOPIFY_CUSTOMER_ACCOUNT_URL } from "@/lib/customer-account";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./site-footer.module.css";
import revealStyles from "./page-reveals.module.css";

export type FooterDirection =
  "index" | "colophon" | "compact" | "rail" | "directory";

export function SiteFooter({
  direction,
  tone,
  year,
  onBackToTop,
  footerRef,
  themeControl,
  destinationControl,
  showAbout = false,
  showSamples = false,
  showManageSubscriptions = false,
  originsReturnLabel,
  shopLabel = "Shop matcha",
  pageReveals = false,
  canonical = false,
}: {
  direction: FooterDirection;
  tone: "light" | "dark";
  year: number;
  onBackToTop: () => void;
  footerRef?: Ref<HTMLElement>;
  themeControl?: ReactNode;
  destinationControl?: ReactNode;
  showAbout?: boolean;
  showSamples?: boolean;
  showManageSubscriptions?: boolean;
  originsReturnLabel?: string;
  shopLabel?: string;
  pageReveals?: boolean;
  canonical?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const actionLabel = (text: string) =>
    canonical ? (
      <ScrambleText text={text} interactive animateOnMount={false} wrap />
    ) : (
      text
    );
  // Plain placeholders until real policy and contact destinations are supplied.
  const utilityLinks = (
    <div className={styles.utility} role="group" aria-label={t("Information")}>
      <ul className={styles.utilityList} data-footer-utility-preview>
        <li>{t("Privacy policy")}</li>
        <li>{t("Terms")}</li>
        <li>{t("Contact")}</li>
      </ul>
      {showManageSubscriptions && (
        <a
          className={styles.accountLink}
          href={SHOPIFY_CUSTOMER_ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("Manage subscriptions (opens in a new tab)")}
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span className={styles.accountLabel}>
            {actionLabel(t("Manage subscriptions"))}
          </span>{" "}
          <span aria-hidden="true">↗</span>
        </a>
      )}
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
      className={`${styles.footer}${pageReveals ? ` ${revealStyles.scope}` : ""}`}
      data-site-footer
      data-storefront-footer={canonical || undefined}
      data-footer-direction={direction}
      data-tone={tone}
      aria-label={t("ATOMA footer")}
      tabIndex={-1}
    >
      <div
        className={styles.body}
        data-page-reveal={pageReveals ? "rise" : undefined}
      >
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
              <span>{actionLabel(t(shopLabel))}</span>
              <span className={styles.description}>
                {t("Formats & selection")}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </Link>
          {showSamples && (
            <Link
              className={styles.destination}
              href="/samples"
              aria-disabled={busy || undefined}
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              <span className={styles.number} aria-hidden="true">
                02
              </span>
              <span className={styles.linkCopy}>
                <span>{actionLabel(t("Sample Set"))}</span>
                <span className={styles.description}>
                  {t("Three matcha · 20 g each")}
                </span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          )}
          <button
            className={styles.destination}
            type="button"
            disabled={busy}
            onClick={() =>
              openOrigins({ tone, returnLabel: originsReturnLabel })
            }
          >
            <span className={styles.number} aria-hidden="true">
              {showSamples ? "03" : "02"}
            </span>
            <span className={styles.linkCopy}>
              <span>{actionLabel(t("Growing places"))}</span>
              <span className={styles.description}>
                {t("Explore the origins")}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </button>
          {showAbout && (
            <Link
              className={styles.destination}
              href="/about"
              aria-disabled={busy || undefined}
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              <span className={styles.number} aria-hidden="true">
                {showSamples ? "04" : "03"}
              </span>
              <span className={styles.linkCopy}>
                <span>{actionLabel(t("About ATOMA"))}</span>
                <span className={styles.description}>
                  {t("A closer look at ATOMA")}
                </span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          )}
          <button
            className={styles.destination}
            type="button"
            disabled={busy}
            onClick={onBackToTop}
          >
            <span className={styles.number} aria-hidden="true">
              {String(3 + Number(showAbout) + Number(showSamples)).padStart(
                2,
                "0",
              )}
            </span>
            <span className={styles.linkCopy}>
              <span>{actionLabel(t("Back to top"))}</span>
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
      <div
        className={styles.base}
        data-page-reveal={pageReveals ? "fade" : undefined}
      >
        <span>© {year} ATOMA</span>
        {direction !== "directory" && utilityLinks}
        {destinationControl}
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
