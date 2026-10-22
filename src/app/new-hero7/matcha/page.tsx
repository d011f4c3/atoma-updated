import type { Metadata } from "next";
import { NewHeroSevenMatcha } from "@/components/new-hero-seven";

export const metadata: Metadata = { title: "Choose your matcha — ATOMA" };

export default function MatchaPage() {
  return <NewHeroSevenMatcha />;
}
