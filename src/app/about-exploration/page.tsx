import type { Metadata } from "next";
import {
  AboutVariations,
  type AboutDirection,
} from "@/components/about-variations";

export const metadata: Metadata = {
  title: "About explorations — ATOMA",
  description: "Three directions for About ATOMA: Studio, Atlas and Notes.",
  robots: { index: false, follow: false },
};

export default async function AboutExplorationPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string | string[] }>;
}) {
  const { direction } = await searchParams;
  const options: readonly AboutDirection[] = [
    "studio",
    "atlas",
    "notes",
    "original",
  ];
  return (
    <AboutVariations
      direction={options.find((value) => value === direction) ?? "studio"}
    />
  );
}
