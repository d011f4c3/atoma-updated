"use client";

import Link from "next/link";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader } from "./home-header";
import { OriginsContent } from "./origins-content";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./origins-page.module.css";

export function OriginsPage() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  return (
    <main
      className={styles.page}
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <HomeHeader persistentTheme tone={tone} activePage="origins" />
      <OriginsContent tone={tone} />
      <footer className={styles.footer}>
        <Link href="/">
          <ScrambleText
            text={t("Explore matcha")}
            interactive
            animateOnMount={false}
            wrap
          />{" "}
          <span aria-hidden="true">↗</span>
        </Link>
        <ThemeSwitcher showLanguage={false} />
      </footer>
    </main>
  );
}
