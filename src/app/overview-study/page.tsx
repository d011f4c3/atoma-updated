import type { Metadata } from "next";
import { OverviewStudy } from "@/components/overview-study";

export const metadata: Metadata = {
  title: "Overview study — ATOMA",
  robots: { index: false, follow: false },
};

export default async function OverviewStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string | string[] }>;
}) {
  const { direction } = await searchParams;
  const directions = ["current", "digest", "index", "folded"] as const;
  return (
    <OverviewStudy
      initialDirection={
        directions.find((item) => item === direction) ?? "digest"
      }
    />
  );
}
