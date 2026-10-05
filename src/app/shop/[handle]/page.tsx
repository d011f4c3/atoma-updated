import type { Metadata } from "next";
import { RetailProduct } from "@/components/retail-product";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "ATOMA — Matcha selection",
  description:
    "Explore the matcha, its specifications and origins. Choose your format and quantity.",
};

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
