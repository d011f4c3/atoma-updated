"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ProductKey } from "@/lib/product-codes";
import type { TastingDraft } from "@/lib/sample-tastings";

type TastingView = "card" | "compare";
type TastingPair = [ProductKey, ProductKey];
type TastingDrafts = Partial<Record<ProductKey, TastingDraft>>;

type SampleTastingSession = {
  view: TastingView;
  setView: Dispatch<SetStateAction<TastingView>>;
  selected: ProductKey;
  setSelected: Dispatch<SetStateAction<ProductKey>>;
  pair: TastingPair;
  setPair: Dispatch<SetStateAction<TastingPair>>;
  drafts: TastingDrafts;
  setDrafts: Dispatch<SetStateAction<TastingDrafts>>;
  nextOrderChoice: string | null;
  setNextOrderChoice: Dispatch<SetStateAction<string | null>>;
};

const SampleTastingContext = createContext<SampleTastingSession | null>(null);

/** Local navigation memory only. Device persistence remains explicit Save/Clear. */
export function SampleTastingSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [view, setView] = useState<TastingView>("card");
  const [selected, setSelected] = useState<ProductKey>("ceremonial");
  const [pair, setPair] = useState<TastingPair>(["ceremonial", "barista"]);
  const [drafts, setDrafts] = useState<TastingDrafts>({});
  const [nextOrderChoice, setNextOrderChoice] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      view,
      setView,
      selected,
      setSelected,
      pair,
      setPair,
      drafts,
      setDrafts,
      nextOrderChoice,
      setNextOrderChoice,
    }),
    [view, selected, pair, drafts, nextOrderChoice],
  );

  return (
    <SampleTastingContext.Provider value={value}>
      {children}
    </SampleTastingContext.Provider>
  );
}

export function useSampleTastingSession() {
  const context = useContext(SampleTastingContext);
  if (!context) throw new Error("SampleTastingSessionProvider is required.");
  return context;
}
