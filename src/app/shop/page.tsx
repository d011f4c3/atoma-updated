import type { Metadata } from "next";
import { Shop } from "@/components/shop";
import { StorefrontFooter } from "@/components/storefront-footer";

export const metadata: Metadata = {
  title: "ATOMA — Shop matcha",
  description:
    "Explore the ATOMA matcha collection. Choose your format, quantity and matcha for the way you serve it.",
};

export default function ShopPage() {
  return (
    <>
      <Shop />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
