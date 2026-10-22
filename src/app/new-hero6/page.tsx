import type { Metadata } from "next";
import { NewHeroSix } from "@/components/new-hero-six";
import { StorefrontFooter } from "@/components/storefront-footer";
import styles from "@/components/new-hero-five.module.css";

export const metadata: Metadata = {
  title: "Matcha for the way you make it — ATOMA",
  description:
    "Japanese matcha for tea service, lattes and recipes. Explore the range, try all three and find your next order.",
  robots: { index: false, follow: false },
};

export default function NewHeroSixPage() {
  return (
    <>
      <NewHeroSix />
      <div className={styles.footer}>
        <StorefrontFooter year={new Date().getUTCFullYear()} />
      </div>
    </>
  );
}
