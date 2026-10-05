"use client";

import { useState } from "react";
import { SpecimenHero } from "./specimen-hero";

export function ProductExploration({
  initialProductHandle,
}: {
  initialProductHandle?: string;
}) {
  const [tone, setTone] = useState<"dark" | "light">("dark");
  return (
    <SpecimenHero
      storefrontTheme
      tone={tone}
      onToneChange={setTone}
      materialObject="silver-bag"
      selectorVariant="slides"
      sectionSelectorVariant="tabs"
      selectorPlacement="left"
      originPreviewVariant="split"
      shopPreviewVariant="refined"
      startAtSelection={Boolean(initialProductHandle)}
      initialProductHandle={initialProductHandle}
    />
  );
}
