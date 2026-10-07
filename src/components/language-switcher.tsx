"use client";

import { resolveLocale } from "@/lib/i18n";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./theme-switcher.module.css";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useStorefrontLocale();
  return (
    <select
      className={styles.language}
      aria-label={t("Language")}
      value={locale}
      onChange={(event) => setLocale(resolveLocale(event.target.value))}
      data-language-switcher
    >
      <option value="en" lang="en">
        English
      </option>
      <option value="zh-Hans" lang="zh-Hans">
        简体中文
      </option>
      <option value="zh-Hant" lang="zh-Hant">
        繁體中文
      </option>
      <option value="ja" lang="ja">
        日本語
      </option>
    </select>
  );
}
