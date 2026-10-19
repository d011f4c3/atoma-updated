import type { Metadata } from "next";
import { ShopFilterStudy } from "@/components/shop-filter-study";
import { SHOP_CATEGORIES } from "@/lib/shop-category-filter";

export const metadata: Metadata = {
  title: "Shop filter study — ATOMA",
  description:
    "Index, category tiles and an expandable filter bar for the matcha collection.",
  robots: { index: false, follow: false },
};

export default async function ShopFilterStudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    direction?: string | string[];
    tone?: string | string[];
    category?: string | string[];
    future?: string | string[];
  }>;
}) {
  const { direction, tone, category, future } = await searchParams;
  return (
    <ShopFilterStudy
      initialDirection={
        direction === "index" || direction === "tiles" ? direction : "facets"
      }
      initialTone={tone === "light" || tone === "dark" ? tone : undefined}
      initialCategory={
        SHOP_CATEGORIES.find((item) => item.value === category)?.value ?? "all"
      }
      initialFuture={future === "1"}
    />
  );
}
