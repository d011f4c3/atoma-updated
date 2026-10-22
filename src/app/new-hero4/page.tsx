import type { Metadata } from "next";
import { NewHeroFour } from "@/components/new-hero-four";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "Matcha for the way you make it — ATOMA",
  description:
    "Japanese matcha for tea service, lattes and recipes. Compare the range, try the Sample Set and find your next order.",
  robots: { index: false, follow: false },
};

export default function NewHeroFourPage() {
  return (
    <>
      <NewHeroFour />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
