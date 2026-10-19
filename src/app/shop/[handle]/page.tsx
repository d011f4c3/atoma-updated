import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RetailProduct } from "@/components/retail-product";
import { StorefrontFooter } from "@/components/storefront-footer";
import { readStorefrontLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/i18n/metadata";
import { isSampleSetHandle } from "@/lib/sample-catalog";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata("product", await readStorefrontLocale());
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ format?: string | string[] }>;
}) {
  const [{ handle }, { format }] = await Promise.all([params, searchParams]);
  const initialFormat = format === "1kg" ? "1kg" : undefined;
  if (isSampleSetHandle(handle)) redirect("/samples");
  return (
    <>
      <RetailProduct
        key={`${handle}:${initialFormat ?? "default"}`}
        handle={handle}
        initialFormat={initialFormat}
      />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
