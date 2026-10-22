import { getProductKey, type ProductKey } from "./product-codes.ts";

export type ProductApplicationImageCollection = "reference" | "canonical";

type ProductApplicationImage = Readonly<{
  productKey: ProductKey;
  src: string;
  alt: string;
  caption: string;
  usage: string;
  sourceKind: "client-reference" | "ai-generated-reference";
  approvalStatus: "product-photography-pending";
}>;

/**
 * Composition references only; these do not show verified ATOMA product results.
 * Source records and replacement requirements: docs/design/application-imagery-register.md.
 * Keep powder/material imagery in product-content independent of this mapping.
 */
const applicationImages: Record<ProductKey, ProductApplicationImage> = {
  ceremonial: {
    productKey: "ceremonial",
    src: "/images/samples/prepared-matcha.webp",
    alt: "A bowl of prepared matcha on a woven mat.",
    caption: "Application reference · Product photography pending",
    usage: "For tea served with water.",
    sourceKind: "client-reference",
    approvalStatus: "product-photography-pending",
  },
  barista: {
    productKey: "barista",
    src: "/images/applications/iced-matcha-latte-reference-v1.webp",
    alt: "AI-generated reference of an iced matcha latte in a clear glass.",
    caption: "AI application reference · Product photography pending",
    usage: "For hot and iced matcha lattes.",
    sourceKind: "ai-generated-reference",
    approvalStatus: "product-photography-pending",
  },
  culinary: {
    productKey: "culinary",
    src: "/images/applications/matcha-tea-cake-reference-v1.webp",
    alt: "AI-generated reference of a slice of matcha cake on an ivory plate.",
    caption: "AI application reference · Product photography pending",
    usage: "For baking, desserts and café recipes.",
    sourceKind: "ai-generated-reference",
    approvalStatus: "product-photography-pending",
  },
};

/** The approved hero's application direction, opted into by the main homepage. */
const canonicalApplicationImages: Record<ProductKey, ProductApplicationImage> =
  {
    ceremonial: {
      ...applicationImages.ceremonial,
      src: "/images/applications/prepared-matcha-hero-v3.webp",
      alt: "Whisked matcha in a ceramic tea bowl.",
      caption: "AI application reference · Product photography pending",
      sourceKind: "ai-generated-reference",
    },
    barista: {
      ...applicationImages.barista,
      src: "/images/applications/iced-matcha-latte-hero-v3.webp",
      alt: "An iced matcha latte with green matcha over milk in a thin clear glass.",
    },
    culinary: {
      ...applicationImages.culinary,
      src: "/images/applications/matcha-wagashi-hero-v3.webp",
      alt: "Green matcha wagashi on a dark ceramic saucer.",
    },
  };

/** Exact catalog identity and reviewed aliases only, never title/list-position guesses. */
export function getProductApplicationImage(
  handle: string | undefined,
  collection: ProductApplicationImageCollection = "reference",
): ProductApplicationImage | undefined {
  const productKey = handle ? getProductKey(handle) : undefined;
  const images =
    collection === "canonical" ? canonicalApplicationImages : applicationImages;
  return productKey ? images[productKey] : undefined;
}
