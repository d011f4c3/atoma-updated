"use client";

import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader } from "./home-header";
import { OriginsContent } from "./origins-content";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./origins-page.module.css";

export function OriginsPage() {
  const { tone } = useStorefrontTheme();
  return (
    <main className={styles.page} data-tone={tone} data-storefront-theme={tone}>
      <HomeHeader tone={tone} activePage="origins" />
      <OriginsContent tone={tone} />
      <footer className={styles.footer}>
        <Link href="/">
          Explore matcha <span aria-hidden="true">↗</span>
        </Link>
        <ThemeSwitcher />
      </footer>
    </main>
  );
}
