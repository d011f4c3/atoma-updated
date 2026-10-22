import type { Metadata } from "next";
import { NewHeroThree } from "@/components/new-hero-three";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "Choose your matcha — ATOMA",
  description:
    "Japanese matcha for tea service, lattes and recipes. Compare the range, try the Sample Set and find your next order.",
  robots: { index: false, follow: false },
};

export default function NewHeroThreePage() {
  return (
    <>
      <NewHeroThree />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
