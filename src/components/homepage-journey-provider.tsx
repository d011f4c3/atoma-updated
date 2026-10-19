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
  const rememberJourney = useCallback((patch: Partial<HomepageJourney>) => {
    setJourney((current) => {
      const keys = Object.keys(patch) as (keyof HomepageJourney)[];
      return keys.every((key) => Object.is(current[key], patch[key]))
        ? current
        : { ...current, ...patch };
    });
  }, []);
  const value = useMemo(
    () => ({ journey, rememberJourney }),
    [journey, rememberJourney],
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
