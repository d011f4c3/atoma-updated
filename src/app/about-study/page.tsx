import type { Metadata } from "next";
import { AboutStudy } from "@/components/about-study";

export const metadata: Metadata = {
  title: "About study — ATOMA",
  description:
    "Six About ATOMA layouts: Fieldnotes, Map, Chapters, Index, Broadside and Sequence.",
  robots: { index: false, follow: false },
};

export default async function AboutStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string | string[] }>;
}) {
  const { direction } = await searchParams;
  const options = [
    "fieldnotes",
    "compact",
    "ledger",
    "columns",
    "broadside",
    "sequence",
  ] as const;
  return (
    <AboutStudy
      initialDirection={
        options.find((option) => option === direction) ?? "fieldnotes"
      }
    />
  );
}
