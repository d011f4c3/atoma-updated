"use client";

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
  itemCount: number;
  adding: boolean;
  busy: boolean;
  error: string | null;
  isOpen: boolean;
  dialogId: string;
};

const CartContext = createContext<CartContextValue | null>(null);

async function readCart(signal?: AbortSignal): Promise<CartData | null> {
  const response = await fetch("/api/cart", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const value: CartResponse = await response.json();
  if (!response.ok || !["ready", "empty", "missing"].includes(value.kind)) {
    throw new Error("Cart unavailable");
  }
  return value.kind === "ready" ? (value.cart ?? null) : null;
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
  const { openCart, itemCount, isOpen, dialogId } = useCart();
  return (
    <button
      type="button"
      className={`${styles.trigger}${className ? ` ${className}` : ""}`}
      data-tone={tone}
      aria-label={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      aria-haspopup="dialog"
      aria-controls={dialogId}
      aria-expanded={isOpen}
      onClick={openCart}
    >
      <ScrambleText text="CART" interactive />
      <span className={styles.triggerCount} aria-hidden="true">
        {String(itemCount).padStart(2, "0")}
      </span>
    </button>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const id = useId();
  const dialogId = `${id}-cart`;
  const headingId = `${id}-cart-title`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const mutationRef = useRef(false);
  const reviewRef = useRef(false);
  const requestRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<
    CartAction["action"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCart = useCallback(async (signal?: AbortSignal) => {
    if (mutationRef.current) return;
    const request = ++requestRef.current;
    try {
      const value = await readCart(signal);
      if (request !== requestRef.current || signal?.aborted) return;
      setCart(value);
      setError(null);
      reviewRef.current = false;
      setReviewRequired(false);
      setNotice(null);
    } catch {
      if (request !== requestRef.current || signal?.aborted) return;
      setError("Your selection couldn’t be loaded. Please try again.");
    } finally {
      if (request === requestRef.current && !signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const request = ++requestRef.current;
    void readCart(controller.signal).then(
      (value) => {
        if (controller.signal.aborted || request !== requestRef.current) return;
        setCart(value);
        setLoading(false);
      },
      () => {
        if (controller.signal.aborted || request !== requestRef.current) return;
        setError("Your selection couldn’t be loaded. Please try again.");
        setLoading(false);
      },
    );
    return () => controller.abort();
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
    if (mutationRef.current) return;
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

  const mutate = useCallback(async (action: CartAction) => {
    if (mutationRef.current) return;
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

  const busy = pendingAction !== null;
  const itemCount = cart?.totalQuantity ?? 0;
  const context = useMemo(
    () => ({
      addItem,
      openCart,
      itemCount,
      adding: pendingAction === "add",
      busy,
      error,
      isOpen,
      dialogId,
    }),
    [
      addItem,
      openCart,
      itemCount,
      pendingAction,
      busy,
      error,
      isOpen,
      dialogId,
    ],
  );

  function closeCart() {
    dialogRef.current?.close();
  }

  const dismissCart = useDialogDismiss(closeCart);

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
              <ScrambleText text="ATOMA / CART" periodic />
            </span>
            <button
              ref={closeRef}
              className={styles.close}
              type="button"
              aria-label="Close cart"
              onClick={closeCart}
            >
              <ScrambleText text="CLOSE" interactive />
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>
              {String(itemCount).padStart(2, "0")} /{" "}
              {itemCount === 1 ? "ITEM" : "ITEMS"}
            </p>
            <h2 id={headingId}>
              Your
              <br />
              selection.
            </h2>
          </div>
          <div className={styles.content} aria-busy={loading || busy}>
            {error && (
              <div className={styles.message} role="alert">
                <p>{error}</p>
                <button
                  className={styles.retry}
                  type="button"
                  disabled={loading || busy}
                  onClick={reloadCart}
                >
                  <ScrambleText text="Reload selection" interactive />{" "}
                  <span aria-hidden="true">↻</span>
                </button>
              </div>
            )}
            {notice && (
              <p className={styles.srOnly} role="status">
                {notice}
              </p>
            )}
            {reviewRequired && !error && (
              <div className={styles.message} role="status">
                <p>{notice}</p>
                <button
                  className={styles.retry}
                  type="button"
                  disabled={loading || busy}
                  onClick={reloadCart}
                >
                  <ScrambleText text="Refresh selection" interactive />{" "}
                  <span aria-hidden="true">↻</span>
                </button>
              </div>
            )}
            {loading && !cart ? (
              <div className={styles.message} role="status">
                <p>Opening your selection…</p>
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
                    text="Your selection starts with matcha."
                    periodic
                    wrap
                  />
                </p>
                <button
                  className={styles.retry}
                  type="button"
                  onClick={closeCart}
                >
                  <ScrambleText text="Explore the selection" interactive />{" "}
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : null}
          </div>
          {Boolean(cart?.lines.length) && (
            <div className={styles.footer}>
              <p className={styles.total}>
                <span>
                  <ScrambleText text="Subtotal" periodic />
                </span>
                <strong>{cart?.subtotalLabel}</strong>
              </p>
              <p className={styles.checkoutNote}>
                <ScrambleText
                  text="Checkout is not connected yet."
                  periodic
                  wrap
                />
              </p>
              <button className={styles.checkout} type="button" disabled>
                <span>Checkout</span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                className={styles.continue}
                type="button"
                onClick={closeCart}
              >
                <ScrambleText text="Continue exploring" interactive />{" "}
                <span aria-hidden="true">←</span>
              </button>
            </div>
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
          <h3>{productName(line.productTitle)}</h3>
          <span className={styles.price}>{line.lineTotalLabel}</span>
        </div>
        <p className={styles.format}>
          {line.variantTitle !== "Default Title" && `${line.variantTitle} · `}
          {line.unitPriceLabel} / UNIT
        </p>
        {line.sellingPlan && (
          <p className={styles.format}>
            {line.sellingPlan.name} · {line.sellingPlan.deliveryLabel}
            <br />
            {line.sellingPlan.priceLabel} / unit, per delivery
          </p>
        )}
        {line.purchaseState !== "purchasable" && (
          <p className={styles.format}>Currently unavailable</p>
        )}
        <div className={styles.lineControls}>
          <div className={styles.stepper}>
            <button
              type="button"
              disabled={!canDecrease}
              aria-label={`Decrease ${productName(line.productTitle)} quantity`}
              onClick={() => onUpdate(lower)}
            >
              −
            </button>
            <output aria-label={`${productName(line.productTitle)} quantity`}>
              {line.quantity}
            </output>
            <button
              type="button"
              disabled={!canIncrease}
              aria-label={`Increase ${productName(line.productTitle)} quantity`}
              onClick={() => onUpdate(upper)}
            >
              +
            </button>
          </div>
          <button
            className={styles.remove}
            type="button"
            disabled={disabled || !line.canRemove}
            aria-label={`Remove ${productName(line.productTitle)}`}
            onClick={onRemove}
          >
            <ScrambleText text="REMOVE" interactive />
          </button>
        </div>
      </div>
    </li>
  );
}
