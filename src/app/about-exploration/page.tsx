import type { Metadata } from "next";
import {
  AboutVariations,
  type AboutDirection,
} from "@/components/about-variations";
import { AboutStories } from "@/components/about-stories";
import { AboutFlow } from "@/components/about-flow";

export const metadata: Metadata = {
  title: "About explorations — ATOMA",
  description:
    "An introduction to ATOMA, its approach to matcha, and the people and places behind the work.",
  robots: { index: false, follow: false },
};

export default async function AboutExplorationPage({
  searchParams,
}: {
  searchParams: Promise<{
    direction?: string | string[];
  }>;
}) {
  const { direction } = await searchParams;
  const options: readonly AboutDirection[] = [
    "studio",
    "atlas",
    "notes",
    "original",
  ];
  const archived = options.find((value) => value === direction);
  const earlier = [
    "company",
    "sequence",
    "relationships",
    "desk",
    "method",
    "connections",
    "film",
    "material",
  ].some((value) => value === direction);
  return archived ? (
    <AboutVariations direction={archived} />
  ) : earlier ? (
    <AboutStories
      direction={
        direction === "relationships" ||
        direction === "desk" ||
        direction === "method" ||
        direction === "connections"
          ? "relationships"
          : "sequence"
      }
    />
  ) : (
    <AboutFlow />
  );
}
