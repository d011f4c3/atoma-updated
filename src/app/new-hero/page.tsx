import type { Metadata } from "next";
import { NewHero } from "@/components/new-hero";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "Japanese matcha for your business — ATOMA",
  description:
    "Japanese matcha selected for tea service, lattes and recipes. Explore three matcha by application or start with the Sample Set.",
  robots: { index: false, follow: false },
};

export default function NewHeroPage() {
  return (
    <>
      <NewHero />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
