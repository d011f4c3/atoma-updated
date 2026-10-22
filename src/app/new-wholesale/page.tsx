import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ATOMA — Wholesale matcha",
  alternates: { canonical: "/wholesale" },
  robots: { index: false, follow: false },
};

export default async function NewWholesalePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const search = query.toString();
  redirect(`/wholesale${search ? `?${search}` : ""}`);
}
