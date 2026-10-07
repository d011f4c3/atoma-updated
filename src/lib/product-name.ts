import { getProductKey, type ProductKey } from "./product-codes.ts";
import { translate, type Locale } from "./i18n/index.ts";

const productNames: Record<ProductKey, string> = {
  ceremonial: "Ceremonial Matcha",
  barista: "Barista Matcha",
  culinary: "Culinary Matcha",
};

/** Product identity stays handle-based while its editorial name is localized. */
export function productName(
  title: string,
  handle?: string,
  locale: Locale = "en",
): string {
  const productKey = handle === undefined ? undefined : getProductKey(handle);
  if (productKey) return translate(locale, productNames[productKey]);

  // Keep literal-title formatting for unmapped products and historical studies.
  const name =
    title
      .replace(/^\[?TEST ONLY\]?\s*[—–:\-]?\s*/i, "")
      .replace(/\s+Fixture\b/gi, "")
      .replace(/^Japanese\s+/i, "")
      .split(/\s+for\s+|\s+[—–]\s+/i)
      .at(0)
      ?.replace(/\s+Powder\b/i, "")
      .trim() ?? title;

  // The owner retains Ceremonial as the storefront name. This display alias
  // does not rename the Shopify product or imply a different use or provenance.
  return translate(
    locale,
    /^Premium Matcha$/i.test(name) ? "Ceremonial Matcha" : name,
  );
}
