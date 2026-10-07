"use client";

import { useEffect, useRef, useState } from "react";
import type { ShopifyCheckout } from "@shopify/checkout-kit";
import { CATALOG_SHOP_DOMAIN } from "@/lib/catalog-model";
import { isExpectedCheckoutUrl } from "@/lib/checkout-policy";
import styles from "./checkout-kit-preview.module.css";

export type CheckoutKitPreviewIssue =
  | "unsupported_browser"
  | "sdk_unavailable"
  | "invalid_checkout"
  | "checkout_error"
  | "checkout_warning"
  | "unconfirmed_start";

type PreviewStatus =
  | "loading"
  | "ready"
  | "opening"
  | "active"
  | "unconfirmed"
  | "warning"
  | "complete"
  | "closed"
  | "error";

type CheckoutKitPreviewProps = {
  checkoutUrl: string;
  onOpen?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onClose?: () => void;
  onError?: (issue: CheckoutKitPreviewIssue) => void;
};

const STATUS_COPY: Record<PreviewStatus, string> = {
  loading: "Preparing the Checkout Kit preview…",
  ready: "Ready to open Shopify checkout in a separate window.",
  opening: "Opening checkout. A separate window or tab should appear.",
  active: "Checkout is ready in its separate window.",
  unconfirmed:
    "The preview has not confirmed that checkout is ready. If a checkout window opened, continue there. Otherwise, close the preview and use hosted checkout.",
  warning:
    "Checkout reported an issue that may be recoverable. Continue in the checkout window, or close the preview before trying hosted checkout.",
  complete: "Checkout reported that the order is complete.",
  closed: "The checkout window is closed. Prepare a new preview to try again.",
  error: "The preview is unavailable. Use hosted checkout to continue.",
};

/** Local study only. The parent supplies a fresh URL from the gated server route. */
export function CheckoutKitPreview({
  checkoutUrl,
  onOpen,
  onStart,
  onComplete,
  onClose,
  onError,
}: CheckoutKitPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<ShopifyCheckout | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedRef = useRef(false);
  const callbacksRef = useRef({
    onOpen,
    onStart,
    onComplete,
    onClose,
    onError,
  });
  const [status, setStatus] = useState<PreviewStatus>("loading");

  useEffect(() => {
    callbacksRef.current = { onOpen, onStart, onComplete, onClose, onError };
  }, [onOpen, onStart, onComplete, onClose, onError]);

  useEffect(() => {
    let disposed = false;
    let checkout: ShopifyCheckout | null = null;
    let events: AbortController | null = null;

    function stopWaiting() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    async function initialize() {
      // Defer all work until the client effect. The SDK touches browser globals
      // when imported, so a static runtime import is unsafe during Next SSR.
      await Promise.resolve();
      if (disposed) return;
      if (!isExpectedCheckoutUrl(checkoutUrl, CATALOG_SHOP_DOMAIN)) {
        setStatus("error");
        callbacksRef.current.onError?.("invalid_checkout");
        return;
      }
      if (
        !window.customElements ||
        !window.AbortController ||
        !window.HTMLDialogElement?.prototype.showModal ||
        !Element.prototype.attachShadow
      ) {
        setStatus("error");
        callbacksRef.current.onError?.("unsupported_browser");
        return;
      }
      try {
        events = new AbortController();
        await import("@shopify/checkout-kit");
        if (disposed || !mountRef.current) return;
        checkout = document.createElement(
          "shopify-checkout",
        ) as ShopifyCheckout;
        checkout.logLevel = "none";
        checkout.target = "popup";
        checkout.appearance = "storefront";
        checkout.src = checkoutUrl;
        // The alpha's optional scrim cannot recover from a blocked popup.
        // Keep the study's hosted fallback reachable using this documented option.
        checkout.style.display = "none";
        checkout.style.setProperty("--shopify-checkout-dialog-width", "1000");
        checkout.style.setProperty("--shopify-checkout-dialog-height", "850");
        const options = { signal: events.signal };
        checkout.addEventListener(
          "ec.start",
          () => {
            stopWaiting();
            setStatus("active");
            callbacksRef.current.onStart?.();
          },
          options,
        );
        checkout.addEventListener(
          "ec.complete",
          () => {
            stopWaiting();
            if (endedRef.current) return;
            endedRef.current = true;
            setStatus("complete");
            callbacksRef.current.onComplete?.();
          },
          options,
        );
        checkout.addEventListener(
          "ec.close",
          () => {
            stopWaiting();
            if (endedRef.current) return;
            endedRef.current = true;
            setStatus("closed");
            callbacksRef.current.onClose?.();
          },
          options,
        );
        checkout.addEventListener(
          "ec.error",
          (event) => {
            stopWaiting();
            if (endedRef.current) return;
            const messages = event.detail?.error?.messages;
            const terminal =
              Array.isArray(messages) &&
              messages.some((message) => message?.severity === "unrecoverable");
            // Alpha.4 explicitly distinguishes recoverable checkout errors.
            // Inspect severity only; never copy provider/buyer payloads to state.
            if (terminal) {
              endedRef.current = true;
              setStatus("error");
              callbacksRef.current.onError?.("checkout_error");
            } else {
              setStatus("warning");
              callbacksRef.current.onError?.("checkout_warning");
            }
          },
          options,
        );
        mountRef.current.append(checkout);
        checkoutRef.current = checkout;
        setStatus("ready");
      } catch {
        if (disposed) return;
        events?.abort();
        checkout?.remove();
        checkoutRef.current = null;
        setStatus("error");
        callbacksRef.current.onError?.("sdk_unavailable");
      }
    }

    void initialize();
    return () => {
      disposed = true;
      stopWaiting();
      events?.abort();
      checkout?.close();
      checkout?.removeAttribute("src");
      checkout?.remove();
      checkoutRef.current = null;
    };
  }, [checkoutUrl]);

  function openCheckout() {
    const checkout = checkoutRef.current;
    if (!checkout || status !== "ready") return;
    endedRef.current = false;
    setStatus("opening");
    callbacksRef.current.onOpen?.();
    // No fetch or await here: window.open must retain the user's click gesture.
    try {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setStatus("unconfirmed");
        callbacksRef.current.onError?.("unconfirmed_start");
      }, 15000);
      checkout.open();
    } catch {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      endedRef.current = true;
      setStatus("error");
      callbacksRef.current.onError?.("checkout_error");
    }
  }

  function closePreview() {
    checkoutRef.current?.close();
    // Normally ec.close is synchronous. Still release local controls if a
    // blocked/failed alpha popup does not report closure.
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setStatus("closed");
    callbacksRef.current.onClose?.();
  }

  const windowMayBeOpen = [
    "opening",
    "active",
    "unconfirmed",
    "warning",
  ].includes(status);

  return (
    <div className={styles.preview} data-checkout-kit-status={status}>
      <div ref={mountRef} />
      <div className={styles.actions}>
        <button
          className={styles.button}
          type="button"
          disabled={status !== "ready"}
          onClick={openCheckout}
        >
          Open Checkout Kit popup
        </button>
        {windowMayBeOpen && (
          <>
            <button
              className={styles.button}
              type="button"
              onClick={() => checkoutRef.current?.focus()}
            >
              Return to checkout window
            </button>
            <button
              className={styles.button}
              type="button"
              onClick={closePreview}
            >
              Close preview
            </button>
          </>
        )}
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {STATUS_COPY[status]}
      </p>
    </div>
  );
}
