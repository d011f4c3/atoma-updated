"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Selection } from "@/lib/product-selection";

type HomepageJourney = {
  exploring: boolean;
  sampleRightFocus: "set" | "tea";
  selection: Selection | null;
  view: "overview" | "specifications" | "origins" | "builder" | "standard";
  reference: string;
  labelHasQuantity: boolean;
};
type JourneyContextValue = {
  journey: HomepageJourney;
  rememberJourney: (patch: Partial<HomepageJourney>) => void;
  surfaceSelections: Record<string, Record<string, Selection>>;
  rememberSurfaceSelection: (
    surface: string,
    productHandle: string,
    selection: Selection,
  ) => void;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

/** UI choices survive local route changes; catalog and cart remain authoritative. */
export function HomepageJourneyProvider({ children }: { children: ReactNode }) {
  const [journey, setJourney] = useState<HomepageJourney>({
    exploring: false,
    sampleRightFocus: "set",
    selection: null,
    view: "overview",
    reference: "",
    labelHasQuantity: false,
  });
  // Optional comparison surfaces retain each edited order across local routes.
  // These are UI choices only; current catalog data still governs purchases.
  const [surfaceSelections, setSurfaceSelections] = useState<
    Record<string, Record<string, Selection>>
  >({});
  const rememberSurfaceSelection = useCallback(
    (surface: string, productHandle: string, selection: Selection) => {
      setSurfaceSelections((current) => {
        if (current[surface]?.[productHandle] === selection) return current;
        return {
          ...current,
          [surface]: { ...current[surface], [productHandle]: selection },
        };
      });
    },
    [],
  );
  const rememberJourney = useCallback((patch: Partial<HomepageJourney>) => {
    setJourney((current) => {
      const keys = Object.keys(patch) as (keyof HomepageJourney)[];
      return keys.every((key) => Object.is(current[key], patch[key]))
        ? current
        : { ...current, ...patch };
    });
  }, []);
  const value = useMemo(
    () => ({
      journey,
      rememberJourney,
      surfaceSelections,
      rememberSurfaceSelection,
    }),
    [journey, rememberJourney, surfaceSelections, rememberSurfaceSelection],
  );
  return (
    <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
  );
}

export function useHomepageJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error("HomepageJourneyProvider is required.");
  return context;
}
