import type { Metadata } from "next";
import { RetailProduct } from "@/components/retail-product";
import { StorefrontFooter } from "@/components/storefront-footer";
import { readStorefrontLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata("product", await readStorefrontLocale());
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return (
    <>
      <RetailProduct key={handle} handle={handle} />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
