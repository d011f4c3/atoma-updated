import type { Metadata } from "next";
import { Samples } from "@/components/samples";
import { StorefrontFooter } from "@/components/storefront-footer";
import { readStorefrontLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata("samples", await readStorefrontLocale());
}

export default function SamplesPage() {
  return (
    <>
      <Samples />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
