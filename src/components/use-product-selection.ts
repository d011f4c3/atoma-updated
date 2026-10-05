"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Catalog,
  CatalogProduct,
  CatalogVariant,
} from "@/lib/catalog-types";
import {
  initialSelection,
  quantityCeiling,
  money,
  type Selection,
} from "@/lib/product-selection";

export type ProductSelectionModel = {
  catalog: Catalog | null;
  loading: boolean;
  product: CatalogProduct | undefined;
  variant: CatalogVariant | undefined;
  quantity: number;
  priceLabel: string;
  canIncrement: boolean;
  selectProduct: (id: string) => void;
  selectVariant: (id: string) => void;
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
): ProductSelectionModel {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [revision, setRevision] = useState(0);
  const requestRef = useRef(0);

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
        setCatalog(value);
        const initialProduct =
          value.products.find((item) => item.handle === initialProductHandle) ??
          value.products[0];
        setSelection(
          initialProduct ? initialSelection(initialProduct) : EMPTY_SELECTION,
        );
      } catch {
        if (controller.signal.aborted || request !== requestRef.current) return;
        setCatalog({
          status: "unavailable",
          products: [],
          shopUrl: "https://h0cuaw-f7.myshopify.com",
        });
        setSelection(EMPTY_SELECTION);
      } finally {
        if (!controller.signal.aborted && request === requestRef.current) {
          setLoading(false);
        }
      }
    }
    void read();
    return () => controller.abort();
  }, [revision, initialProductHandle]);

  const product = catalog?.products.find(
    (item) => item.id === selection.productId,
  );
  const variant = product?.variants.find(
    (item) => item.id === selection.variantId,
  );
  const quantity = selection.quantity;
  const priceLabel = variant
    ? money(variant.priceMinor * quantity, variant.currency)
    : "";
  const canIncrement = Boolean(
    variant && quantity + variant.increment <= quantityCeiling(variant),
  );

  const selectProduct = useCallback(
    (id: string) => {
      const next = catalog?.products.find((item) => item.id === id);
      if (next) setSelection(initialSelection(next));
    },
    [catalog],
  );
  const selectVariant = useCallback(
    (id: string) => {
      const next = product?.variants.find((item) => item.id === id);
      if (!next || !product) return;
      setSelection({
        productId: product.id,
        variantId: next.id,
        quantity: next.minimum,
      });
    },
    [product],
  );
  const incrementQuantity = useCallback(() => {
    if (!variant) return;
    setSelection((current) => {
      if (current.variantId !== variant.id) return current;
      const next = current.quantity + variant.increment;
      if (next > quantityCeiling(variant)) return current;
      return { ...current, quantity: next };
    });
  }, [variant]);
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
      catalog,
      loading,
      product,
      variant,
      quantity,
      priceLabel,
      canIncrement,
      selectProduct,
      selectVariant,
      incrementQuantity,
      decrementQuantity,
      retry,
    }),
    [
      catalog,
      loading,
      product,
      variant,
      quantity,
      priceLabel,
      canIncrement,
      selectProduct,
      selectVariant,
      incrementQuantity,
      decrementQuantity,
      retry,
    ],
  );
}
