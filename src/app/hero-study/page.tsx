import type { Metadata } from "next";
import { HeroStudy } from "@/components/hero-study";

export const metadata: Metadata = {
  title: "ATOMA — Hero study",
  description: "Compare treatments for the homepage introduction.",
};

export default async function HeroStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string | string[] }>;
}) {
  const { direction } = await searchParams;
  const initialDirection = [
    "current",
    "specimen",
    "margin",
    "register",
    "fieldnote",
    "ledger",
    "signal",
    "axis",
  ] as const;
  return (
    <HeroStudy
      initialDirection={
        initialDirection.find((item) => item === direction) ?? "specimen"
      }
    />
  );
}
