"use client";

import { useSyncExternalStore } from "react";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { LanguageSwitcher } from "./language-switcher";
import styles from "./theme-switcher.module.css";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function ThemeSwitcher({ label = "Dark mode" }: { label?: string }) {
  const { t } = useStorefrontLocale();
  const { tone, setTone } = useStorefrontTheme();
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const dark = tone === "dark";

  return (
    <span className={styles.controls} data-appearance-controls>
      <LanguageSwitcher />
      <button
        className={styles.switcher}
        type="button"
        role="switch"
        aria-label={t(label)}
        aria-checked={dark}
        title={t(dark ? "Switch to light mode" : "Switch to dark mode")}
        disabled={!ready}
        onClick={() => setTone(dark ? "light" : "dark")}
        data-theme-switcher
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb}>
            <svg viewBox="0 0 24 24" fill="none">
              {dark ? (
                <path d="M20.5 13.5A8.6 8.6 0 0 1 10.5 3.5a8.6 8.6 0 1 0 10 10Z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                </>
              )}
            </svg>
          </span>
        </span>
      </button>
    </span>
  );
}
