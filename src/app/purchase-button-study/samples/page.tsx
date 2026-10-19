import type { Metadata } from "next";
import { PurchaseButtonStudy } from "@/components/purchase-button-study";

export const metadata: Metadata = {
  title: "Earlier purchase button study — ATOMA",
  description: "The saved Current, Mineral, Split and Keyline comparison.",
  robots: { index: false, follow: false },
};

export default async function SamplePurchaseButtonStudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    direction?: string | string[];
    tone?: string | string[];
  }>;
}) {
  const { direction, tone } = await searchParams;
  const directions = ["current", "mineral", "split", "keyline"] as const;
  return (
    <PurchaseButtonStudy
      initialDirection={
        directions.find((item) => item === direction) ?? "mineral"
      }
      initialTone={tone === "light" || tone === "dark" ? tone : undefined}
    />
  );
}
