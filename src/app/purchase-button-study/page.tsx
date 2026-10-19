import type { Metadata } from "next";
import { HomepagePurchaseButtonStudy } from "@/components/homepage-purchase-button-study";

export const metadata: Metadata = {
  title: "Homepage purchase button study — ATOMA",
  description:
    "Compare Current, Soft solid, Tonal and Outline in the homepage Shop panel.",
  robots: { index: false, follow: false },
};

export default async function PurchaseButtonStudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    surface?: string | string[];
    tone?: string | string[];
  }>;
}) {
  const { surface, tone } = await searchParams;
  const surfaces = ["current", "soft", "tonal", "outline"] as const;
  return (
    <HomepagePurchaseButtonStudy
      initialSurface={surfaces.find((item) => item === surface) ?? "soft"}
      initialTone={tone === "light" || tone === "dark" ? tone : undefined}
    />
  );
}
