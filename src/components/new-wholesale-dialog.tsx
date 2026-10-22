"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { getProductContent } from "@/lib/product-content";
import { ProductApplicationCutout } from "./product-application-cutout";
import { ScrambleText } from "./scramble-text";
import { useDialogDismiss } from "./use-dialog-dismiss";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./new-wholesale-dialog.module.css";

type DialogEntry = {
  id: string;
  product: ProductKey;
  trigger: HTMLElement | null;
  scrollX: number;
  scrollY: number;
};

type WholesaleDialogController = {
  selected: ProductKey | null;
  openProduct: (product: ProductKey, trigger?: HTMLElement | null) => void;
  closeProduct: () => void;
  entry: RefObject<DialogEntry | null>;
};

function productKey(value: string | null): ProductKey | null {
  return value === "ceremonial" || value === "barista" || value === "culinary"
    ? value
    : null;
}

function currentHref(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

/** URL-owned learning, independent of the homepage's selection destinations. */
export function useWholesaleDialog(): WholesaleDialogController {
  const params = useSearchParams();
  const selected = productKey(params.get("matcha"));
  const { navigationBusy, isOpen: cartOpen } = useCart();
  const id = useId();
  const sequence = useRef(0);
  const entry = useRef<DialogEntry | null>(null);
  const dismissing = useRef(false);

  useLayoutEffect(() => {
    dismissing.current = false;
  }, [selected]);

  const openProduct = useCallback(
    (product: ProductKey, trigger?: HTMLElement | null) => {
      if (navigationBusy || cartOpen) return;
      const url = new URL(window.location.href);
      if (productKey(url.searchParams.get("matcha")) === product) return;
      const alreadyOpen = productKey(url.searchParams.get("matcha")) !== null;
      const entryId =
        alreadyOpen && entry.current
          ? entry.current.id
          : `${id}-${++sequence.current}`;
      entry.current = {
        id: entryId,
        product,
        trigger:
          trigger ??
          (document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null),
        scrollX:
          entry.current && alreadyOpen ? entry.current.scrollX : window.scrollX,
        scrollY:
          entry.current && alreadyOpen ? entry.current.scrollY : window.scrollY,
      };
      url.searchParams.set("matcha", product);
      const state = { atomaWholesaleDialog: entryId };
      if (alreadyOpen) window.history.replaceState(state, "", currentHref(url));
      else window.history.pushState(state, "", currentHref(url));
    },
    [cartOpen, id, navigationBusy],
  );

  const closeProduct = useCallback(() => {
    if (navigationBusy || cartOpen || dismissing.current) return;
    const url = new URL(window.location.href);
    if (!productKey(url.searchParams.get("matcha"))) return;
    dismissing.current = true;
    // Only entries made by this mounted library can safely return with Back.
    // A directly shared product URL instead stays in this library on dismissal.
    if (
      entry.current &&
      window.history.state?.atomaWholesaleDialog === entry.current.id
    ) {
      window.history.back();
    } else {
      url.searchParams.delete("matcha");
      window.history.replaceState(null, "", currentHref(url));
    }
  }, [cartOpen, navigationBusy]);

  return { selected, openProduct, closeProduct, entry };
}

/** Product learning stays in place; the collection owns the only order. */
export function NewWholesaleDialog({
  controller,
}: {
  controller: WholesaleDialogController;
}) {
  const { selected, closeProduct, entry } = controller;
  const cart = useCart();
  const { locale, t } = useStorefrontLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previousProduct = useRef<ProductKey | null>(null);
  const returnPending = useRef(false);
  const openingPosition = useRef({ x: 0, y: 0 });
  const dismiss = useDialogDismiss(closeProduct);
  const identity = SAMPLE_SET_CONTENTS.find((item) => item.key === selected);
  const content = identity
    ? getProductContent(
        {
          title: identity.name,
          handle: identity.productHandle,
          description: "",
        },
        locale,
      )
    : null;
  const headingId = useId();

  // The cart owns body overflow independently. Owning only the root prevents a
  // stale nested lock when browser Back closes this reader underneath the cart.
  useLayoutEffect(() => {
    if (!selected) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const gutter = root.style.scrollbarGutter;
    if (window.innerWidth > root.clientWidth)
      root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      root.style.scrollbarGutter = gutter;
    };
  }, [selected]);

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const pagePosition = { x: window.scrollX, y: window.scrollY };
    if (selected) {
      returnPending.current = false;
      let justOpened = false;
      if (!node.open) {
        // Forward navigation must never open this reader over an active cart.
        if (cart.isOpen) return;
        openingPosition.current =
          entry.current?.product === selected
            ? { x: entry.current.scrollX, y: entry.current.scrollY }
            : pagePosition;
        node.showModal();
        justOpened = true;
      }
      if (
        (justOpened || previousProduct.current !== selected) &&
        !cart.isOpen
      ) {
        node.scrollTop = 0;
        if (body.current) body.current.scrollTop = 0;
        close.current?.focus({ preventScroll: true });
      }
      if (!cart.isOpen) previousProduct.current = selected;
    } else if (node.open) {
      node.close();
      returnPending.current = true;
    }
    if (!selected && !cart.isOpen && returnPending.current) {
      const key = previousProduct.current;
      const candidates = [
        entry.current?.product === key ? entry.current.trigger : null,
        ...document.querySelectorAll<HTMLElement>(
          `[data-wholesale-product-trigger="${key}"]`,
        ),
        document.querySelector<HTMLElement>(
          "[data-wholesale-collection-heading]",
        ),
        document.querySelector<HTMLElement>("[data-new-wholesale] h1"),
      ];
      const returnTarget = candidates.find(
        (candidate) => candidate?.isConnected && candidate.checkVisibility(),
      );
      if (returnTarget) {
        if (
          !returnTarget.hasAttribute("tabindex") &&
          returnTarget.matches("h1")
        )
          returnTarget.tabIndex = -1;
        returnTarget.focus({ preventScroll: true });
      }
      window.scrollTo({
        left: openingPosition.current.x,
        top: openingPosition.current.y,
        behavior: "instant",
      });
      returnPending.current = false;
      previousProduct.current = null;
    } else if (
      window.scrollX !== pagePosition.x ||
      window.scrollY !== pagePosition.y
    ) {
      // Native autofocus and close may otherwise move the underlying library.
      window.scrollTo({
        left: pagePosition.x,
        top: pagePosition.y,
        behavior: "instant",
      });
    }
  }, [cart.isOpen, entry, selected]);

  return (
    <dialog
      {...dismiss}
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={identity ? headingId : undefined}
      aria-label={identity ? undefined : t("The matcha")}
      data-wholesale-product-dialog
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        closeProduct();
      }}
    >
      <header className={styles.header}>
        <span className={styles.context}>{t("Product details")}</span>
        <button
          className={styles.order}
          type="button"
          disabled={cart.navigationBusy}
          data-wholesale-return-order
          onClick={closeProduct}
        >
          <ScrambleText
            text={t("Back to order")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span aria-hidden="true">↗</span>
        </button>
        <button
          ref={close}
          type="button"
          disabled={cart.navigationBusy}
          data-wholesale-product-close
          onClick={closeProduct}
        >
          <ScrambleText
            text={t("Close")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span className={styles.closeIcon} aria-hidden="true">
            ×
          </span>
        </button>
      </header>
      <div ref={body} className={styles.body} data-wholesale-product-scroll>
        {identity && content && (
          <article
            className={styles.profile}
            data-wholesale-learning-product={identity.key}
          >
            <div className={styles.introduction}>
              <header className={styles.identity}>
                <p>◇ {identity.productCode}</p>
                <h2 id={headingId}>{content.name}</h2>
                <span>{content.application}</span>
              </header>
              <div className={styles.image}>
                <ProductApplicationCutout productKey={identity.key} />
              </div>
              <p className={styles.flavour}>
                {content.materialProfile[1]?.value}
              </p>
            </div>
            <dl className={styles.facts} data-wholesale-profile>
              {content.materialProfile
                .filter((_, index) => index !== 1)
                .map((property) => (
                  <div key={property.label}>
                    <dt>{property.label}</dt>
                    <dd>{property.value}</dd>
                  </div>
                ))}
            </dl>
            <details className={styles.preparation} data-wholesale-preparation>
              <summary>
                <span>{t("Preparation")}</span>
                <span aria-hidden="true" />
              </summary>
              <p>{content.preparation}</p>
            </details>
          </article>
        )}
      </div>
    </dialog>
  );
}
