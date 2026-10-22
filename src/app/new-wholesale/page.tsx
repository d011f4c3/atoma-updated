import type { Metadata } from "next";
import { connection } from "next/server";
import { NewWholesale } from "@/components/new-wholesale";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "Wholesale study — ATOMA",
  robots: { index: false, follow: false },
};

export default async function NewWholesalePage() {
  await connection();
  return (
    <>
      <NewWholesale />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
