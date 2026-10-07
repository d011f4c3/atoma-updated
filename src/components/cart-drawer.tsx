"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { CartData, CartLine, CartResponse } from "@/lib/cart-types";
import { productName } from "@/lib/product-name";
import { ScrambleText } from "./scramble-text";
import { useDialogDismiss } from "./use-dialog-dismiss";
import styles from "./cart-drawer.module.css";

type CartAction =
  | {
      action: "add";
      productHandle: string;
      variantKey: string;
      quantity: number;
    }
  | { action: "update"; lineKey: string; quantity: number }
  | { action: "remove"; lineKey: string };

type CartContextValue = {
  addItem: (
    productHandle: string,
    variantKey: string,
    quantity: number,
  ) => Promise<void>;
  openCart: () => void;
  refreshCart: () => Promise<void>;
  itemCount: number;
  adding: boolean;
  busy: boolean;
  reviewRequired: boolean;
  error: string | null;
  isOpen: boolean;
  dialogId: string;
};

const CartContext = createContext<CartContextValue | null>(null);

async function readCart(
  signal?: AbortSignal,
): Promise<{ cart: CartData | null; checkoutEnabled: boolean }> {
  const response = await fetch("/api/cart", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const value: CartResponse = await response.json();
  if (!response.ok || !["ready", "empty", "missing"].includes(value.kind)) {
    throw new Error("Cart unavailable");
  }
  if (
    value.kind === "ready" &&
    (!value.cart ||
      !Array.isArray(value.cart.lines) ||
      !Number.isSafeInteger(value.cart.totalQuantity) ||
      value.cart.totalQuantity < 0 ||
      (value.cart.lines.length === 0 && value.cart.totalQuantity !== 0))
  ) {
    throw new Error("Cart unavailable");
  }
  return {
    cart: value.kind === "ready" ? (value.cart ?? null) : null,
    checkoutEnabled: value.checkoutEnabled === true,
  };
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Cart controls require CartProvider.");
  return cart;
}

export function CartButton({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const { t } = useStorefrontLocale();
  const { openCart, itemCount, isOpen, dialogId } = useCart();
  return (
    <button
      type="button"
      className={`${styles.trigger}${className ? ` ${className}` : ""}`}
      data-tone={tone}
      aria-label={t(
        itemCount === 1
          ? "Open cart, {count} item"
          : "Open cart, {count} items",
        { count: itemCount },
      )}
      aria-haspopup="dialog"
      aria-controls={dialogId}
      aria-expanded={isOpen}
      onClick={openCart}
    >
      <ScrambleText text={t("CART")} interactive />
      <span className={styles.triggerCount} aria-hidden="true">
        {String(itemCount).padStart(2, "0")}
      </span>
    </button>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const dialogId = `${id}-cart`;
  const headingId = `${id}-cart-title`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const mutationRef = useRef(false);
  const reviewRef = useRef(false);
  const requestRef = useRef(0);
  const checkoutRef = useRef(false);
  const checkoutWindowRef = useRef<Window | null>(null);
  const popupAttemptRef = useRef(false);
  const popupAttemptVersionRef = useRef(0);
  const popupReconcileControllerRef = useRef<AbortController | null>(null);
  const checkoutRetryRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [popupOpened, setPopupOpened] = useState(false);
  const [popupReviewRequested, setPopupReviewRequested] = useState(false);
  const [popupFocusUnavailable, setPopupFocusUnavailable] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    CartAction["action"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCart = useCallback(async (signal?: AbortSignal) => {
    if (mutationRef.current || checkoutRef.current) return;
    const request = ++requestRef.current;
    try {
      const value = await readCart(signal);
      if (request !== requestRef.current || signal?.aborted) return;
      if (checkoutRetryRef.current) setIsOpen(true);
      setCart(value.cart);
      setCheckoutEnabled(value.checkoutEnabled);
      setError(
        checkoutRetryRef.current
          ? "Checkout couldn’t be opened. Reload your selection and try again."
          : null,
      );
      checkoutRetryRef.current = false;
      reviewRef.current = false;
      setReviewRequired(false);
      setNotice(null);
    } catch {
      if (request !== requestRef.current || signal?.aborted) return;
      if (checkoutRetryRef.current) setIsOpen(true);
      setCheckoutEnabled(false);
      setError("Your selection couldn’t be loaded. Please try again.");
    } finally {
      if (request === requestRef.current && !signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") === "retry") {
      checkoutRetryRef.current = true;
      url.searchParams.delete("checkout");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
    const request = ++requestRef.current;
    void readCart(controller.signal).then(
      (value) => {
        if (controller.signal.aborted || request !== requestRef.current) return;
        setCart(value.cart);
        setCheckoutEnabled(value.checkoutEnabled);
        if (checkoutRetryRef.current) {
          setIsOpen(true);
          setError(
            "Checkout couldn’t be opened. Reload your selection and try again.",
          );
          checkoutRetryRef.current = false;
        }
        setLoading(false);
      },
      () => {
        if (controller.signal.aborted || request !== requestRef.current) return;
        if (checkoutRetryRef.current) setIsOpen(true);
        setCheckoutEnabled(false);
        setError("Your selection couldn’t be loaded. Please try again.");
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function refreshAfterCheckout(event: PageTransitionEvent) {
      // Returning to the storefront cannot establish what happened in a
      // separate checkout window. Its read-only reconciliation owns that lock.
      if (!event.persisted || popupAttemptRef.current) return;
      checkoutRef.current = false;
      setCheckingOut(false);
      setCheckoutEnabled(false);
      setLoading(true);
      void loadCart();
    }
    window.addEventListener("pageshow", refreshAfterCheckout);
    return () => window.removeEventListener("pageshow", refreshAfterCheckout);
  }, [loadCart]);

  useEffect(() => {
    if (!popupOpened) return;
    const attempt = popupAttemptVersionRef.current;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight: AbortController | null = null;
    let returnRequested = false;
    let delay = 10_000;

    function isCurrentAttempt() {
      return (
        !disposed &&
        popupAttemptRef.current &&
        checkoutRef.current &&
        popupAttemptVersionRef.current === attempt &&
        !mutationRef.current
      );
    }

    function clearTimer() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }

    function schedule(wait: number) {
      clearTimer();
      if (!isCurrentAttempt() || document.visibilityState !== "visible") return;
      timer = setTimeout(() => void reconcile(), wait);
    }

    async function reconcile() {
      if (
        !isCurrentAttempt() ||
        document.visibilityState !== "visible" ||
        inFlight
      )
        return;
      clearTimer();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const request = ++requestRef.current;
      inFlight = controller;
      popupReconcileControllerRef.current = controller;
      try {
        // The checkout lock still blocks writes and another payment attempt.
        // Read the public projection directly, without unlocking loadCart.
        const value = await readCart(controller.signal);
        if (
          !isCurrentAttempt() ||
          controller.signal.aborted ||
          request !== requestRef.current
        )
          return;
        if (value.cart && value.cart.lines.length > 0) {
          setCart(value.cart);
          setCheckoutEnabled(value.checkoutEnabled);
          return;
        }
        // Shopify's successful empty/missing projection is the only automatic
        // clearing signal. This is cart reconciliation, not a paid-order claim.
        popupAttemptVersionRef.current += 1;
        popupAttemptRef.current = false;
        checkoutRef.current = false;
        checkoutWindowRef.current = null;
        reviewRef.current = false;
        setCart(null);
        setCheckoutEnabled(value.checkoutEnabled);
        setCheckingOut(false);
        setPopupOpened(false);
        setPopupReviewRequested(false);
        setPopupFocusUnavailable(false);
        setReviewRequired(false);
        setError(null);
        setNotice(null);
        setLoading(false);
      } catch {
        // Unavailable, malformed and aborted reads preserve the last selection
        // and checkout lock. A later read or explicit review can recover.
      } finally {
        clearTimeout(timeout);
        if (inFlight === controller) inFlight = null;
        if (popupReconcileControllerRef.current === controller) {
          popupReconcileControllerRef.current = null;
        }
        if (isCurrentAttempt()) {
          delay = Math.min(delay * 2, 30_000);
          const wait = returnRequested ? 0 : delay;
          returnRequested = false;
          schedule(wait);
        }
      }
    }

    function refreshOnReturn() {
      if (!isCurrentAttempt() || document.visibilityState !== "visible") return;
      clearTimer();
      if (inFlight) {
        returnRequested = true;
        return;
      }
      void reconcile();
    }

    function visibilityChanged() {
      if (document.visibilityState === "visible") {
        refreshOnReturn();
      } else {
        clearTimer();
        returnRequested = false;
        inFlight?.abort();
      }
    }

    window.addEventListener("focus", refreshOnReturn);
    window.addEventListener("pageshow", refreshOnReturn);
    document.addEventListener("visibilitychange", visibilityChanged);
    schedule(delay);
    return () => {
      disposed = true;
      clearTimer();
      inFlight?.abort();
      window.removeEventListener("focus", refreshOnReturn);
      window.removeEventListener("pageshow", refreshOnReturn);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [popupOpened]);

  useEffect(() => {
    // A dialog can inherit focus-visible when it opens after an async add.
    // Remember the actual input method without removing focus from Close.
    function onPointerDown() {
      dialogRef.current?.setAttribute("data-input-modality", "pointer");
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      dialogRef.current?.setAttribute("data-input-modality", "keyboard");
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog?.open && !dialog.contains(document.activeElement)) {
      closeRef.current?.focus({ preventScroll: true });
    }
  }, [cart]);

  const reloadCart = useCallback(() => {
    if (mutationRef.current || checkoutRef.current) return;
    setLoading(true);
    void loadCart();
  }, [loadCart]);

  const openCart = useCallback(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setIsOpen(true);
    reloadCart();
  }, [reloadCart]);

  const refreshCart = useCallback(async () => {
    // External checkout completion may update the cart without navigating this
    // window. A passive refresh must not dismiss an unresolved mutation review.
    if (mutationRef.current || checkoutRef.current || reviewRef.current) return;
    setLoading(true);
    await loadCart();
  }, [loadCart]);

  const mutate = useCallback(async (action: CartAction) => {
    if (mutationRef.current || checkoutRef.current) return;
    if (reviewRef.current) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setIsOpen(true);
      return;
    }
    mutationRef.current = true;
    const request = ++requestRef.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPendingAction(action.action);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const value: CartResponse = await response.json();
      if (request !== requestRef.current) return;
      setCheckoutEnabled(value.checkoutEnabled === true);
      if (value.cart) setCart(value.cart);
      if (value.kind === "missing") setCart(null);
      const needsReview =
        Boolean(value.reviewRequired) || value.kind === "ambiguous";
      reviewRef.current = needsReview;
      setReviewRequired(needsReview);
      if (needsReview && action.action === "add") {
        triggerRef.current = trigger;
        setIsOpen(true);
      }
      if (!response.ok || !["success", "warning"].includes(value.kind)) {
        if (needsReview) {
          setError(
            value.kind === "ambiguous"
              ? "The update couldn’t be confirmed. Reload your selection before trying again."
              : "Your selection changed. Reload your selection before trying again.",
          );
        } else {
          setError(
            value.kind === "rejected"
              ? "This selection couldn’t be updated. Check its availability and quantity."
              : "Your selection couldn’t be updated. Please try again.",
          );
        }
        return;
      }
      setNotice(
        value.kind === "warning" || value.reviewRequired
          ? "Your selection changed. Review the quantities and total below."
          : action.action === "add"
            ? "Added to your selection."
            : action.action === "remove"
              ? "Item removed."
              : "Quantity updated.",
      );
      if (action.action === "add") {
        triggerRef.current = trigger;
        setIsOpen(true);
      }
    } catch {
      // A failed connection may follow an accepted write. Never replay it.
      reviewRef.current = true;
      setReviewRequired(true);
      setError(
        "The update couldn’t be confirmed. Reload your selection before trying again.",
      );
      if (action.action === "add") {
        triggerRef.current = trigger;
        setIsOpen(true);
      }
    } finally {
      mutationRef.current = false;
      setPendingAction(null);
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    (productHandle: string, variantKey: string, quantity: number) =>
      mutate({ action: "add", productHandle, variantKey, quantity }),
    [mutate],
  );

  const busy = pendingAction !== null || checkingOut;
  const canCheckout =
    checkoutEnabled &&
    !busy &&
    !loading &&
    !reviewRequired &&
    !error &&
    cart !== null &&
    cart.lines.length > 0 &&
    cart.lines.every((line) => line.purchaseState === "purchasable");
  const itemCount = cart?.totalQuantity ?? 0;
  const context = useMemo(
    () => ({
      addItem,
      openCart,
      refreshCart,
      itemCount,
      adding: pendingAction === "add",
      busy,
      reviewRequired,
      error: error ? t(error) : null,
      isOpen,
      dialogId,
    }),
    [
      addItem,
      openCart,
      refreshCart,
      itemCount,
      pendingAction,
      busy,
      reviewRequired,
      error,
      t,
      isOpen,
      dialogId,
    ],
  );

  function closeCart() {
    dialogRef.current?.close();
  }

  const dismissCart = useDialogDismiss(closeCart);

  function returnToCheckout() {
    try {
      // COOP can sever this WindowProxy while checkout is still open. Never
      // interpret its `closed` property or focus behavior as order completion.
      // A lost reference only changes the guidance; it never releases the lock.
      const popup = checkoutWindowRef.current;
      if (!popup || popup.closed) {
        setPopupFocusUnavailable(true);
        return;
      }
      popup.focus();
    } catch {
      setPopupFocusUnavailable(true);
    }
  }

  function reviewAfterCheckout() {
    if (!popupReviewRequested) {
      setPopupReviewRequested(true);
      return;
    }
    // The shopper explicitly confirms they finished or closed checkout. Do
    // not close the payment window or infer whether an order was paid.
    popupReconcileControllerRef.current?.abort();
    popupAttemptVersionRef.current += 1;
    checkoutWindowRef.current = null;
    popupAttemptRef.current = false;
    checkoutRef.current = false;
    setPopupOpened(false);
    setPopupReviewRequested(false);
    setPopupFocusUnavailable(false);
    setCheckingOut(false);
    setCheckoutEnabled(false);
    setLoading(true);
    void loadCart();
  }

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]',
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <CartContext.Provider value={context}>
      {children}
      <dialog
        {...dismissCart}
        ref={dialogRef}
        id={dialogId}
        className={styles.dialog}
        aria-labelledby={headingId}
        onKeyDown={containFocus}
        onClose={() => {
          setIsOpen(false);
          if (triggerRef.current?.isConnected) {
            triggerRef.current.focus({ preventScroll: true });
          }
        }}
      >
        <div className={styles.shell}>
          <div className={styles.topline}>
            <span>
              <ScrambleText text={t("ATOMA / CART")} periodic />
            </span>
            <button
              ref={closeRef}
              className={styles.close}
              type="button"
              aria-label={t("Close cart")}
              onClick={closeCart}
            >
              <ScrambleText text={t("CLOSE")} interactive />
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>
              {String(itemCount).padStart(2, "0")} /{" "}
              {t(itemCount === 1 ? "ITEM" : "ITEMS")}
            </p>
            <h2 id={headingId}>
              {t("Your")} <br />
              {t("selection.")}
            </h2>
          </div>
          <div className={styles.content} aria-busy={loading || busy}>
            {error && (
              <div className={styles.message} role="alert">
                <p>{t(error)}</p>
                <button
                  className={styles.retry}
                  type="button"
                  disabled={loading || busy}
                  onClick={reloadCart}
                >
                  <ScrambleText text={t("Reload selection")} interactive />{" "}
                  <span aria-hidden="true">↻</span>
                </button>
              </div>
            )}
            {notice && (
              <p className={styles.srOnly} role="status">
                {notice ? t(notice) : null}
              </p>
            )}
            {reviewRequired && !error && (
              <div className={styles.message} role="status">
                <p>{notice ? t(notice) : null}</p>
                <button
                  className={styles.retry}
                  type="button"
                  disabled={loading || busy}
                  onClick={reloadCart}
                >
                  <ScrambleText text={t("Refresh selection")} interactive />{" "}
                  <span aria-hidden="true">↻</span>
                </button>
              </div>
            )}
            {loading && !cart ? (
              <div className={styles.message} role="status">
                <p>{t("Opening your selection…")}</p>
              </div>
            ) : cart?.lines.length ? (
              <ol className={styles.lines}>
                {cart.lines.map((line, index) => (
                  <CartLineItem
                    key={line.lineKey}
                    line={line}
                    index={index}
                    disabled={busy || loading || reviewRequired}
                    onUpdate={(quantity) =>
                      void mutate({
                        action: "update",
                        lineKey: line.lineKey,
                        quantity,
                      })
                    }
                    onRemove={() =>
                      void mutate({ action: "remove", lineKey: line.lineKey })
                    }
                  />
                ))}
              </ol>
            ) : !error ? (
              <div className={styles.empty}>
                <p>
                  <ScrambleText
                    text={t("Your selection starts with matcha.")}
                    periodic
                    wrap
                  />
                </p>
                <button
                  className={styles.retry}
                  type="button"
                  onClick={closeCart}
                >
                  <ScrambleText text={t("Explore the selection")} interactive />{" "}
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : null}
          </div>
          {Boolean(cart?.lines.length) && (
            <form
              className={styles.footer}
              action="/api/checkout"
              method="post"
              onSubmit={(event) => {
                if (
                  !canCheckout ||
                  mutationRef.current ||
                  reviewRef.current ||
                  checkoutRef.current
                ) {
                  event.preventDefault();
                  return;
                }
                checkoutRef.current = true;
                setCheckingOut(true);
                const form = event.currentTarget;
                form.target = "_self";
                try {
                  // Open synchronously from the click, then let the browser
                  // submit the existing empty POST and follow its 303. The
                  // Shopify checkout URL never enters application JavaScript.
                  const name = `atoma-checkout-${crypto.randomUUID()}`;
                  const width = Math.min(
                    1000,
                    Math.max(320, screen.availWidth),
                  );
                  const height = Math.min(
                    850,
                    Math.max(480, screen.availHeight),
                  );
                  const left = Math.max(
                    0,
                    window.screenX + (window.outerWidth - width) / 2,
                  );
                  const top = Math.max(
                    0,
                    window.screenY + (window.outerHeight - height) / 2,
                  );
                  const popup = window.open(
                    "about:blank",
                    name,
                    `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`,
                  );
                  if (popup) {
                    // Isolate the payment page from its storefront opener
                    // while retaining the already-created named form target.
                    popup.opener = null;
                    form.target = name;
                    popupAttemptVersionRef.current += 1;
                    requestRef.current += 1;
                    checkoutWindowRef.current = popup;
                    popupAttemptRef.current = true;
                    setPopupOpened(true);
                    setPopupReviewRequested(false);
                    setPopupFocusUnavailable(false);
                  }
                } catch {
                  // A blocked popup or unavailable browser feature retains
                  // the normal native same-tab checkout submission.
                }
              }}
            >
              <p className={styles.total}>
                <span>
                  <ScrambleText text={t("Subtotal")} periodic />
                </span>
                <strong>{cart?.subtotalLabel}</strong>
              </p>
              <p
                id={`${id}-checkout-status`}
                className={styles.checkoutNote}
                role={popupOpened ? "status" : undefined}
              >
                {popupOpened ? (
                  t(
                    popupReviewRequested
                      ? "Finish or close checkout before reviewing your selection. Closing checkout does not cancel an order already placed."
                      : popupFocusUnavailable
                        ? "Your browser may have opened checkout in another tab. Return there to continue."
                        : "Checkout opened in another window or tab.",
                  )
                ) : (
                  <ScrambleText
                    text={t(
                      checkoutEnabled
                        ? "Shipping and the final total are shown at checkout."
                        : "Checkout is not connected yet.",
                    )}
                    periodic
                    wrap
                  />
                )}
              </p>
              <button
                className={styles.checkout}
                type={popupOpened ? "button" : "submit"}
                disabled={!popupOpened && !canCheckout}
                aria-describedby={`${id}-checkout-status`}
                onClick={popupOpened ? returnToCheckout : undefined}
              >
                <span>
                  {t(
                    popupOpened
                      ? "Return to checkout"
                      : checkingOut
                        ? "Opening checkout…"
                        : "Checkout",
                  )}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                className={styles.continue}
                type="button"
                onClick={popupOpened ? reviewAfterCheckout : closeCart}
              >
                <ScrambleText
                  text={t(
                    popupOpened
                      ? popupReviewRequested
                        ? "I’ve finished or closed checkout"
                        : "Review selection"
                      : "Continue exploring",
                  )}
                  interactive
                />{" "}
                <span aria-hidden="true">←</span>
              </button>
            </form>
          )}
        </div>
      </dialog>
    </CartContext.Provider>
  );
}

function CartLineItem({
  line,
  index,
  disabled,
  onUpdate,
  onRemove,
}: {
  line: CartLine;
  index: number;
  disabled: boolean;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { locale, t } = useStorefrontLocale();
  const { minimum, increment, maximum } = line.quantityRule;
  const lower = line.quantity - increment;
  const upper = line.quantity + increment;
  const canDecrease = !disabled && line.canUpdateQuantity && lower >= minimum;
  const canIncrease =
    !disabled &&
    line.canUpdateQuantity &&
    Number.isSafeInteger(upper) &&
    (maximum === null || upper <= maximum);

  return (
    <li className={styles.line}>
      <span className={styles.lineIndex} aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <div className={styles.lineHeader}>
          <h3>{productName(line.productTitle, line.productHandle, locale)}</h3>
          <span className={styles.price}>{line.lineTotalLabel}</span>
        </div>
        <p className={styles.format}>
          {line.variantTitle !== "Default Title" && `${line.variantTitle} · `}
          {line.unitPriceLabel} {t("/ UNIT")}
        </p>
        {line.sellingPlan && (
          <p className={styles.format}>
            {t(line.sellingPlan.name)} · {t(line.sellingPlan.deliveryLabel)}
            <br />
            {line.sellingPlan.priceLabel} {t("/ unit, per delivery")}
          </p>
        )}
        {line.purchaseState !== "purchasable" && (
          <p className={styles.format}>{t("Currently unavailable")}</p>
        )}
        <div className={styles.lineControls}>
          <div className={styles.stepper}>
            <button
              type="button"
              disabled={!canDecrease}
              aria-label={t("Decrease {name} quantity", {
                name: productName(
                  line.productTitle,
                  line.productHandle,
                  locale,
                ),
              })}
              onClick={() => onUpdate(lower)}
            >
              −
            </button>
            <output
              aria-label={t("{name} quantity", {
                name: productName(
                  line.productTitle,
                  line.productHandle,
                  locale,
                ),
              })}
            >
              {line.quantity}
            </output>
            <button
              type="button"
              disabled={!canIncrease}
              aria-label={t("Increase {name} quantity", {
                name: productName(
                  line.productTitle,
                  line.productHandle,
                  locale,
                ),
              })}
              onClick={() => onUpdate(upper)}
            >
              +
            </button>
          </div>
          <button
            className={styles.remove}
            type="button"
            disabled={disabled || !line.canRemove}
            aria-label={t("Remove {name}", {
              name: productName(line.productTitle, line.productHandle, locale),
            })}
            onClick={onRemove}
          >
            <ScrambleText text={t("REMOVE")} interactive />
          </button>
        </div>
      </div>
    </li>
  );
}
