import type { Metadata } from "next";
import { ShopCollection } from "@/components/shop-collection";
import { StorefrontFooter } from "@/components/storefront-footer";
import { readStorefrontLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata("shop", await readStorefrontLocale());
}

export default function ShopPage() {
  return (
    <>
      <ShopCollection />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
