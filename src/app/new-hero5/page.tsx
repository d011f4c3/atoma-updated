import type { Metadata } from "next";
import { NewHeroFive } from "@/components/new-hero-five";
import { StorefrontFooter } from "@/components/storefront-footer";
import styles from "@/components/new-hero-five.module.css";

export const metadata: Metadata = {
  title: "Matcha for the way you make it — ATOMA",
  description:
    "Japanese matcha for tea service, lattes and recipes. Compare the range, try the Sample Set and find your next order.",
  robots: { index: false, follow: false },
};

export default function NewHeroFivePage() {
  return (
    <>
      <NewHeroFive />
      <div className={styles.footer}>
        <StorefrontFooter year={new Date().getUTCFullYear()} />
      </div>
    </>
  );
}
