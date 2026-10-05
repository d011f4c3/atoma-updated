import { SpecimenHero } from "@/components/specimen-hero";
import { StorefrontFooter } from "@/components/storefront-footer";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ matcha?: string | string[] }>;
}) {
  const { matcha } = await searchParams;
  const handle = typeof matcha === "string" ? matcha : undefined;
  return (
    <>
      <SpecimenHero
        storefrontTheme
        initialLoader={!handle}
        materialObject="silver-bag"
        introductionVariant="specimen"
        selectorVariant="slides"
        sectionSelectorVariant="tabs"
        selectorPlacement="left"
        originPreviewVariant="panorama"
        shopPreviewVariant="refined"
        shopExplorationLayout="compact"
        productCodePlacement="register"
        startAtSelection={Boolean(handle)}
        initialProductHandle={handle}
      />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
