import { translate } from "./index.ts";
import type { Locale } from "./types.ts";

export type StorefrontPage = "home" | "shop" | "product";
const metadata = {
  home: {
    title: "ATOMA — Matcha",
    description:
      "Matcha, clearly defined. A selection organised by profile, format and application, with precise specifications to guide your choice.",
  },
  shop: {
    title: "ATOMA — Shop matcha",
    description:
      "Explore the ATOMA matcha collection. Choose your format, quantity and matcha for the way you serve it.",
  },
  product: {
    title: "ATOMA — Matcha selection",
    description:
      "Explore the matcha, its specifications and origins. Choose your format and quantity.",
  },
};

export function localizedMetadata(page: StorefrontPage, locale: Locale) {
  return {
    title: translate(locale, metadata[page].title),
    description: translate(locale, metadata[page].description),
  };
}
