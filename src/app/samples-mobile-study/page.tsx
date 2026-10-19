import type { Metadata } from "next";
import { SamplesMobileStudy } from "@/components/samples-mobile-study";
import { resolveSampleMobileLayout } from "@/lib/sample-mobile-layouts";

export const metadata: Metadata = {
  title: "Mobile Sample Set study — ATOMA",
  description: "Compare four ways to explore the Sample Set on a phone.",
  robots: { index: false, follow: false },
};

export default async function SamplesMobileStudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    layout?: string | string[];
    tone?: string | string[];
  }>;
}) {
  const { layout, tone } = await searchParams;
  return (
    <SamplesMobileStudy
      initialLayout={resolveSampleMobileLayout(layout)}
      initialTone={tone === "dark" || tone === "light" ? tone : undefined}
    />
  );
}
