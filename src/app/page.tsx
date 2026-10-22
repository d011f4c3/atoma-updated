import { redirect } from "next/navigation";
import { NewHeroSevenExperience } from "@/components/new-hero-seven-experience";
import { getProductKey } from "@/lib/product-codes";
import { heroSevenHref } from "@/lib/new-hero-seven-view";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const handle = typeof params.matcha === "string" ? params.matcha : undefined;
  // Preserve product links from Origins and checkout retries after the adoption.
  // An explicit new view takes precedence over the previous homepage's query.
  if (
    !params.view &&
    !params.application &&
    handle &&
    handle.length <= 255 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle)
  ) {
    const application = getProductKey(handle);
    const destination = application
      ? heroSevenHref({ view: "matcha", application }, "/")
      : `/shop/${encodeURIComponent(handle)}`;
    const retry =
      params.checkout === "retry"
        ? `${application ? "&" : "?"}checkout=retry`
        : "";
    redirect(`${destination}${retry}`);
  }
  return (
    <NewHeroSevenExperience year={new Date().getUTCFullYear()} basePath="/" />
  );
}
