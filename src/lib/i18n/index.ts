import { shellTranslations } from "./shell.ts";
import { productTranslations } from "./products.ts";
import { commerceTranslations } from "./commerce.ts";
import { originTranslations } from "./origins.ts";
import { aboutTranslations } from "./about.ts";
import { sampleTranslations } from "./samples.ts";
import { tastingTranslations } from "./tastings.ts";
import type { Locale, TranslationTable } from "./types.ts";

export { locales, resolveLocale, type Locale } from "./types.ts";
export const translationTables = [
  shellTranslations,
  productTranslations,
  commerceTranslations,
  originTranslations,
  aboutTranslations,
  sampleTranslations,
  tastingTranslations,
];
const messages: TranslationTable = Object.assign(
  Object.create(null),
  ...translationTables,
);
const folded = new Map(
  Object.entries(messages).map(([key, value]) => [key.toLowerCase(), value]),
);

/** Source text is the English fallback; interpolated values are never translated. */
export function translate(
  locale: Locale,
  source: string,
  values: Record<string, string | number> = {},
): string {
  const entry = Object.hasOwn(messages, source)
    ? messages[source]
    : folded.get(source.toLowerCase());
  const text = locale === "en" ? source : (entry?.[locale] ?? source);
  return text.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder,
  );
}
