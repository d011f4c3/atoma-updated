import type { Metadata } from "next";
import { AboutFlow } from "@/components/about-flow";
import { readStorefrontLocale } from "@/lib/i18n/server";
import { localizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata("about", await readStorefrontLocale());
}

export default function AboutPage() {
  return <AboutFlow preview={false} year={new Date().getUTCFullYear()} />;
}
