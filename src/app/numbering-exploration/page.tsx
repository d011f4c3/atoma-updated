import type { Metadata } from "next";
import { NumberingExploration } from "@/components/numbering-exploration";
import { PRODUCT_CODE_PLACEMENTS } from "@/lib/product-display-index";

export const metadata: Metadata = {
  title: "Product identity exploration — ATOMA",
  robots: { index: false, follow: false },
};

export default async function NumberingExplorationPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string | string[] }>;
}) {
  const { direction } = await searchParams;
  const directions = ["current", ...PRODUCT_CODE_PLACEMENTS] as const;
  return (
    <NumberingExploration
      initialDirection={
        directions.find((item) => item === direction) ?? "register"
      }
    />
  );
}
