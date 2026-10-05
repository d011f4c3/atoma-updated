/** Compact display names derived from catalog titles; no new product claims. */
export function productName(title: string): string {
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
  return /^Premium Matcha$/i.test(name) ? "Ceremonial Matcha" : name;
}
