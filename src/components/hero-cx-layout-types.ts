import type { ReactNode, RefObject } from "react";
import type { ProductKey } from "@/lib/product-codes";
import type { SampleSetContent } from "@/lib/sample-set";

export type HeroCxLayout =
  "field" | "material" | "applications" | "invitation" | "directory" | "guided";
export type HeroCxStep = "intro" | "application" | "product";

export const HERO_CX_APPLICATIONS: Record<ProductKey, string> = {
  ceremonial: "Tea service",
  barista: "Lattes",
  culinary: "Recipes & baking",
};

export type HeroCxLayoutProps = {
  /** Only set when the product step is active; earlier choice remains in the URL. */
  selected: SampleSetContent | undefined;
  selectedKey: ProductKey | undefined;
  step: HeroCxStep;
  busy: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onChoose: (key: ProductKey) => void;
  onBack: () => void;
  /** Native sample entry is available without answering the application question. */
  sampleAction: ReactNode;
  /** Shared native Sample Set / exact 1 kg actions, with one primary destination. */
  actions: ReactNode;
};
