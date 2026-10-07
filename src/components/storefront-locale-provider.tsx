"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { resolveLocale, translate, type Locale } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { localizedMetadata } from "@/lib/i18n/metadata";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (source: string, values?: Record<string, string | number>) => string;
};
const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (source, values) => translate("en", source, values),
});

export function StorefrontLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [locale, updateLocale] = useState(initialLocale);
  const setLocale = useCallback((value: Locale) => {
    const next = resolveLocale(value);
    updateLocale(next);
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `atoma-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
      // Selection still works during this visit when storage is unavailable.
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    if (
      pathname !== "/" &&
      pathname !== "/origins" &&
      pathname !== "/shop" &&
      !pathname.startsWith("/shop/")
    )
      return;
    const metadata = localizedMetadata(
      pathname === "/shop"
        ? "shop"
        : pathname.startsWith("/shop/")
          ? "product"
          : "home",
      locale,
    );
    document.title = metadata.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", metadata.description);
  }, [locale, pathname]);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (source: string, values?: Record<string, string | number>) =>
        translate(locale, source, values),
    }),
    [locale, setLocale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useStorefrontLocale() {
  return useContext(LocaleContext);
}
