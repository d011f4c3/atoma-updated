import type { Metadata } from "next";
import { connection } from "next/server";
import { HeroCxStudy } from "@/components/hero-cx-study";

export const metadata: Metadata = {
  title: "Hero CX study — ATOMA",
  description:
    "Explore ATOMA's application-led hero, with direct tea service, latte and baking entrances around a changing powder field and immediate sample entry.",
  robots: { index: false, follow: false },
};

export default async function HeroCxStudyPage() {
  await connection();
  return <HeroCxStudy />;
}
