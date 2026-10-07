import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutStudy } from "@/components/checkout-study";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout study — ATOMA",
  description:
    "An ATOMA checkout design concept and Shopify integration study.",
  robots: { index: false, follow: false },
};

export default function CheckoutStudyPage() {
  if (
    !["development", "test"].includes(process.env.NODE_ENV) ||
    process.env.ATOMA_TEST_CHECKOUT_ENABLED !== "true" ||
    process.env.ATOMA_CHECKOUT_STUDY_ENABLED !== "true"
  ) {
    notFound();
  }

  return <CheckoutStudy />;
}
