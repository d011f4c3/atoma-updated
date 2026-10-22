import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NewHeroSevenFrame } from "@/components/new-hero-seven";

export const metadata: Metadata = {
  title: "Matcha for the way you make it — ATOMA",
  description: "Japanese matcha selected for tea service, lattes and recipes.",
  robots: { index: false, follow: false },
};

export default function NewHeroSevenLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NewHeroSevenFrame year={new Date().getUTCFullYear()}>
      {children}
    </NewHeroSevenFrame>
  );
}
