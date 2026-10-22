import type { Metadata } from "next";
import { NewHeroSevenSamples } from "@/components/new-hero-seven-details";

export const metadata: Metadata = { title: "The Sample Set — ATOMA" };

export default function SamplesPage() {
  return <NewHeroSevenSamples />;
}
