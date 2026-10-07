export const locales = ["en", "zh-Hans", "zh-Hant", "ja"] as const;
export type Locale = (typeof locales)[number];
export type TranslationTable = Record<
  string,
  Record<Exclude<Locale, "en">, string>
>;

export function resolveLocale(value: unknown): Locale {
  return locales.find((locale) => locale === value) ?? "en";
}
