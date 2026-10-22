import type { Metadata } from "next";
import { connection } from "next/server";
import { NewWholesale } from "@/components/new-wholesale";
import { StorefrontFooter } from "@/components/storefront-footer";
import { readStorefrontLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...localizedMetadata("wholesale", await readStorefrontLocale()),
    alternates: { canonical: "/wholesale" },
  };
}

export default async function WholesalePage() {
  await connection();
  return (
    <>
      <NewWholesale />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
