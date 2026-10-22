"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Catalog,
  CatalogProduct,
  CatalogVariant,
  CatalogSellingPlan,
} from "@/lib/catalog-types";
import {
  initialSelection,
  quantityCeiling,
  money,
  resolvePurchaseVariant,
  type Selection,
} from "@/lib/product-selection";
import { useHomepageJourney } from "./homepage-journey-provider";
import { matchaCatalogProducts } from "@/lib/sample-catalog";
import { useCart } from "./cart-drawer";
import { productEntrySelection } from "@/lib/product-entry-selection";

export type ProductSelectionModel = {
  catalog: Catalog | null;
  products: CatalogProduct[];
  loading: boolean;
  refreshing: boolean;
  product: CatalogProduct | undefined;
  variant: CatalogVariant | undefined;
  purchaseVariant: CatalogVariant | undefined;
  selectedSellingPlanKey: string | null;
  selectedSellingPlan: CatalogSellingPlan | undefined;
  quantity: number;
  priceLabel: string;
  canIncrement: boolean;
  selectProduct: (id: string) => void;
  selectVariant: (id: string) => void;
  selectSellingPlan: (id: string | null) => void;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
  retry: () => void;
};

const EMPTY_SELECTION: Selection = {
  productId: "",
  variantId: "",
  quantity: 1,
};

/** One selection owner can drive both an interactive object and normal controls. */
export function useProductSelection(
  initialProductHandle?: string,
  preserveJourney: boolean | "restore" = false,
  scope: "matcha" | "all" = "matcha",
  initialFormat?: "1kg",
  selectionMemoryKey?: string,
): ProductSelectionModel {
  const {
    destinationRevision,
    destination,
    destinationReviewRequired,
    destinationChanging,
    reviewRequired,
  } = useCart();
  const {
    journey,
    rememberJourney,
    surfaceSelections,
    rememberSurfaceSelection,
  } = useHomepageJourney();
  const savedSelection = useRef(
    (selectionMemoryKey && initialProductHandle
      ? surfaceSelections[selectionMemoryKey]?.[initialProductHandle]
      : undefined) ?? (preserveJourney ? journey.selection : null),
  );
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [revision, setRevision] = useState(0);
  const [catalogRevision, setCatalogRevision] = useState(-1);
  const [failedDestinationRevision, setFailedDestinationRevision] = useState<
    number | null
  >(null);
  const requestRef = useRef(0);
  const appliedEntry = useRef<string | null>(null);
  const products = useMemo(
    () =>
      catalog?.status === "ready"
        ? scope === "all"
          ? catalog.products
          : matchaCatalogProducts(catalog.products)
        : [],
    [catalog, scope],
  );

  useEffect(() => {
    const controller = new AbortController();
    const request = ++requestRef.current;
    async function read() {
      try {
        const response = await fetch("/api/catalog", {
          signal: controller.signal,
          cache: "no-store",
        });
        const value: Catalog = await response.json();
        if (controller.signal.aborted || request !== requestRef.current) return;
        if (!response.ok || value.status === "unavailable") {
          throw new Error("unavailable");
        }
        if (
          destination &&
          value.destination &&
          (destination.countryCode !== value.destination.countryCode ||
            destination.currency !== value.destination.currency)
        )
          throw new Error("Destination changed");
        setCatalog(value);
        setCatalogRevision(destinationRevision);
        setFailedDestinationRevision(null);
        const saved = savedSelection.current;
        const selectableProducts =
          scope === "all"
            ? value.products
            : matchaCatalogProducts(value.products);
        const entryKey = JSON.stringify([
          initialProductHandle ?? null,
          initialFormat ?? null,
          scope,
        ]);
        const retainLocalChoice = appliedEntry.current === entryKey;
        appliedEntry.current = entryKey;
        setSelection((current) =>
          productEntrySelection({
            products: selectableProducts,
            current: retainLocalChoice ? current : null,
            saved,
            initialProductHandle,
            initialFormat,
          }),
        );
      } catch {
        if (controller.signal.aborted || request !== requestRef.current) return;
        setFailedDestinationRevision(destinationRevision);
        setCatalog((current) =>
          current?.status === "ready"
            ? current
            : {
                status: "unavailable",
                products: [],
                shopUrl: "https://h0cuaw-f7.myshopify.com",
              },
        );
      } finally {
        if (!controller.signal.aborted && request === requestRef.current) {
          setLoading(false);
        }
      }
    }
    void read();
    return () => {
      controller.abort();
    };
  }, [
    revision,
    initialProductHandle,
    scope,
    initialFormat,
    destinationRevision,
    destination,
  ]);

  useEffect(() => {
    if (
      preserveJourney === true &&
      catalog?.status === "ready" &&
      selection.productId
    ) {
      savedSelection.current = selection;
      rememberJourney({ selection });
    }
  }, [preserveJourney, catalog, selection, rememberJourney]);

  const product = products.find((item) => item.id === selection.productId);
  useEffect(() => {
    if (
      selectionMemoryKey &&
      initialProductHandle &&
      product?.handle === initialProductHandle
    ) {
      // Persist only the explicitly requested product, never a catalog fallback.
      // The next entry still refreshes this UI intent against its current offer.
      savedSelection.current = selection;
      rememberSurfaceSelection(
        selectionMemoryKey,
        initialProductHandle,
        selection,
      );
    }
  }, [
    selectionMemoryKey,
    initialProductHandle,
    product?.handle,
    selection,
    rememberSurfaceSelection,
  ]);
  const variant = product?.variants.find(
    (item) => item.id === selection.variantId,
  );
  const quantity = selection.quantity;
  const selectedSellingPlanKey = selection.sellingPlanKey ?? null;
  const selectedSellingPlan = variant?.sellingPlans?.find(
    (plan) => plan.id === selectedSellingPlanKey,
  );
  const readFailed =
    !loading && failedDestinationRevision === destinationRevision;
  // Preserve the selected product/format and last good catalog internally.
  // Existing consumers see a failed read, not an endlessly pending refresh.
  const visibleCatalog = useMemo<Catalog | null>(
    () =>
      readFailed && catalog && catalog.status !== "unavailable"
        ? { status: "unavailable", products: [], shopUrl: catalog.shopUrl }
        : catalog,
    [catalog, readFailed],
  );
  const refreshing =
    destinationChanging ||
    (!readFailed &&
      catalog !== null &&
      catalogRevision !== destinationRevision);
  const purchaseVariant = useMemo(
    () =>
      loading ||
      readFailed ||
      catalogRevision !== destinationRevision ||
      refreshing ||
      destinationChanging ||
      destinationReviewRequired ||
      reviewRequired
        ? undefined
        : resolvePurchaseVariant(variant, selectedSellingPlanKey),
    [
      variant,
      selectedSellingPlanKey,
      refreshing,
      loading,
      readFailed,
      catalogRevision,
      destinationRevision,
      destinationChanging,
      destinationReviewRequired,
      reviewRequired,
    ],
  );
  const priceLabel = purchaseVariant
    ? money(purchaseVariant.priceMinor * quantity, purchaseVariant.currency)
    : "";
  const canIncrement = Boolean(
    purchaseVariant &&
    quantity + purchaseVariant.increment <= quantityCeiling(purchaseVariant),
  );

  const selectProduct = useCallback(
    (id: string) => {
      const next = products.find((item) => item.id === id);
      if (next) setSelection(initialSelection(next));
    },
    [products],
  );
  const selectVariant = useCallback(
    (id: string) => {
      const next = product?.variants.find((item) => item.id === id);
      if (!next || !product) return;
      setSelection({
        productId: product.id,
        variantId: next.id,
        ...(next.selectionId ? { variantSelectionId: next.selectionId } : {}),
        quantity: next.minimum,
      });
    },
    [product],
  );
  const selectSellingPlan = useCallback(
    (id: string | null) => {
      if (
        !variant ||
        (id !== null &&
          !variant.sellingPlans?.some(
            (plan) => plan.id === id && plan.available,
          ))
      )
        return;
      setSelection((current) =>
        current.variantId === variant.id
          ? {
              ...current,
              sellingPlanKey: id,
              sellingPlanSelectionId:
                variant.sellingPlans?.find((plan) => plan.id === id)
                  ?.selectionId ?? null,
            }
          : current,
      );
    },
    [variant],
  );
  const incrementQuantity = useCallback(() => {
    if (!variant || !purchaseVariant) return;
    setSelection((current) => {
      if (current.variantId !== variant.id) return current;
      const next = current.quantity + variant.increment;
      if (next > quantityCeiling(purchaseVariant)) return current;
      return { ...current, quantity: next };
    });
  }, [variant, purchaseVariant]);
  const decrementQuantity = useCallback(() => {
    if (!variant) return;
    setSelection((current) => {
      if (current.variantId !== variant.id) return current;
      const next = Math.max(
        variant.minimum,
        current.quantity - variant.increment,
      );
      return next === current.quantity
        ? current
        : { ...current, quantity: next };
    });
  }, [variant]);
  const retry = useCallback(() => {
    setLoading(true);
    setRevision((value) => value + 1);
  }, []);

  return useMemo(
    () => ({
      catalog: visibleCatalog,
      products,
      loading,
      refreshing,
      product,
      variant,
      purchaseVariant,
      selectedSellingPlanKey,
      selectedSellingPlan,
      quantity,
      priceLabel,
      canIncrement,
      selectProduct,
      selectVariant,
      selectSellingPlan,
      incrementQuantity,
      decrementQuantity,
      retry,
    }),
    [
      visibleCatalog,
      products,
      loading,
      refreshing,
      product,
      variant,
      purchaseVariant,
      selectedSellingPlanKey,
      selectedSellingPlan,
      quantity,
      priceLabel,
      canIncrement,
      selectProduct,
      selectVariant,
      selectSellingPlan,
      incrementQuantity,
      decrementQuantity,
      retry,
    ],
  );
}
