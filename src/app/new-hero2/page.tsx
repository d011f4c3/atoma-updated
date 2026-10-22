import type { Metadata } from "next";
import { NewHeroTwo } from "@/components/new-hero-two";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "Matcha by application — ATOMA",
  description:
    "Find Japanese matcha for tea service, lattes and recipes. Compare the three matcha, start with the Sample Set and return to your named product.",
  robots: { index: false, follow: false },
};

export default function NewHeroTwoPage() {
  return (
    <>
      <NewHeroTwo />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
