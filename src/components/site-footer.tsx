"use client";

import Link from "next/link";
import type { Ref } from "react";
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
}: {
  direction: FooterDirection;
  tone: "light" | "dark";
  year: number;
  onBackToTop: () => void;
  footerRef?: Ref<HTMLElement>;
}) {
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  // Plain placeholders until real policy and contact destinations are supplied.
  const utilityLinks = (
    <div
      className={styles.utility}
      data-footer-utility-preview
      role="group"
      aria-label="Information"
    >
      <ul className={styles.utilityList}>
        <li>Privacy policy</li>
        <li>Terms</li>
        <li>Contact</li>
      </ul>
    </div>
  );
  const wordmark = (
    <Link
      className={styles.wordmark}
      href="/"
      aria-label="ATOMA homepage"
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
      aria-label="ATOMA footer"
      tabIndex={-1}
    >
      <div className={styles.body}>
        <div className={styles.identity}>
          {direction !== "colophon" && wordmark}
          <p className={styles.statement}>Carefully specified matcha.</p>
        </div>
        <nav className={styles.navigation} aria-label="Footer navigation">
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
              <span>Shop matcha</span>
              <span className={styles.description}>Formats & selection</span>
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
              <span>Growing places</span>
              <span className={styles.description}>Explore the origins</span>
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
              <span>Back to top</span>
              <span className={styles.description}>
                Return to the beginning
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
        <span>Matcha</span>
      </div>
    </footer>
  );
}
