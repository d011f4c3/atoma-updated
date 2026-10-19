"use client";

import Link from "next/link";
import { HomeHeader } from "./home-header";
import { StorefrontFooter } from "./storefront-footer";
import { AboutRelationships } from "./about-relationships";
import { AboutCompany } from "./about-company";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useCart } from "./cart-drawer";
import styles from "./about-stories.module.css";

export type StoryDirection = "sequence" | "relationships";

export function AboutStories({
  direction = "sequence",
}: {
  direction?: StoryDirection;
}) {
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  return (
    <div
      className={styles.page}
      data-about-stories={direction}
      data-storefront-theme={tone}
      data-tone={tone}
    >
      <aside
        className={styles.comparison}
        aria-label="About design comparison"
        lang="en"
      >
        <span>About / Layout concepts</span>
        <nav aria-label="About concepts">
          {(
            [
              ["sequence", "01 Company"],
              ["relationships", "02 Connections"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              href={`/about-exploration?direction=${value === "sequence" ? "company" : "connections"}`}
              aria-label={label}
              aria-current={direction === value ? "page" : undefined}
              aria-disabled={busy || undefined}
              onNavigate={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <HomeHeader tone={tone} persistentTheme />
      {direction === "relationships" ? (
        <AboutRelationships />
      ) : (
        <AboutCompany />
      )}
      <StorefrontFooter year={2026} />
      <aside
        className={styles.reviewNote}
        lang="en"
        aria-label="Design review notes"
      >
        Design study · Field photographs are placeholders. Final story captions
        and formal company disclosure to be confirmed.
      </aside>
    </div>
  );
}
