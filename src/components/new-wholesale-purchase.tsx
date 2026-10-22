"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog-types";
import {
  canPurchaseQuantity,
  initialSelection,
  money,
  quantityCeiling,
  refreshedSelection,
  type Selection,
} from "@/lib/product-selection";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { useHomepageJourney } from "./homepage-journey-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./new-wholesale-purchase.module.css";

type Feedback = { handle: string; pending: boolean; dismissed: boolean };
type FeedbackOwner = {
  feedback: Feedback | null;
  update: (handle: string, phase: "start" | "settled" | "dismiss") => void;
};
const PurchaseFeedback = createContext<FeedbackOwner | null>(null);

/** One cart error belongs to the row that made the latest purchase attempt. */
export function NewWholesalePurchaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { error } = useCart();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  if (feedback && !feedback.pending && !error) setFeedback(null);
  function update(handle: string, phase: "start" | "settled" | "dismiss") {
    setFeedback((current) => {
      if (phase === "start") return { handle, pending: true, dismissed: false };
      if (current?.handle !== handle) return current;
      return phase === "settled"
        ? { ...current, pending: false }
        : { ...current, dismissed: true };
    });
  }
  return (
    <PurchaseFeedback.Provider value={{ feedback, update }}>
      {children}
    </PurchaseFeedback.Provider>
  );
}

/** The library owns catalog reads; each row owns only a retained order intent. */
export function NewWholesalePurchase({
  product,
  pricesReady,
  refreshing,
}: {
  product: CatalogProduct;
  pricesReady: boolean;
  refreshing: boolean;
}) {
  const { t } = useStorefrontLocale();
  const cart = useCart();
  const owner = useContext(PurchaseFeedback);
  if (!owner) throw new Error("NewWholesalePurchaseProvider is required.");
  const { surfaceSelections, rememberSurfaceSelection } = useHomepageJourney();
  const [selection, setSelection] = useState<Selection | null>(
    () => surfaceSelections["new-wholesale"]?.[product.handle] ?? null,
  );
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const formatId = useId();
  const current =
    selection?.productId === product.id
      ? refreshedSelection(product, selection)
      : initialSelection(product);
  const variants = product.variants.filter(
    (variant) => variant.id === current.variantId,
  );
  const variant = variants.length === 1 ? variants[0] : undefined;
  const quantity = current.quantity;
  const needsReview = cart.destinationReviewRequired || cart.reviewRequired;
  const ready = pricesReady && !refreshing && !needsReview;
  const available = Boolean(variant?.available);
  const validQuantity = canPurchaseQuantity(variant, quantity);
  const locked = pending || cart.busy || !ready;
  const purchasable = ready && validQuantity;
  const unitPrice =
    ready && variant ? money(variant.priceMinor, variant.currency) : "—";
  const total =
    ready && variant && Number.isSafeInteger(variant.priceMinor * quantity)
      ? money(variant.priceMinor * quantity, variant.currency)
      : "—";
  const canIncrease = Boolean(
    variant &&
    available &&
    (validQuantity
      ? quantity + variant.increment <= quantityCeiling(variant)
      : canPurchaseQuantity(variant, variant.minimum)),
  );
  const canDecrease = Boolean(
    variant && available && quantity > variant.minimum,
  );
  const purchaseError =
    owner.feedback?.handle === product.handle &&
    !owner.feedback.pending &&
    !owner.feedback.dismissed
      ? cart.error
      : null;
  const formatTitle = (format: CatalogVariant) =>
    format.title === "Default Title" ? t("Standard") : format.title;

  function remember(next: Selection) {
    setSelection(next);
    rememberSurfaceSelection("new-wholesale", product.handle, next);
    owner!.update(product.handle, "dismiss");
  }
  function changeQuantity(direction: -1 | 1) {
    if (locked || !available || !variant) return;
    const next = validQuantity
      ? Math.max(variant.minimum, quantity + direction * variant.increment)
      : variant.minimum;
    if (canPurchaseQuantity(variant, next))
      remember({ ...current, quantity: next });
  }
  function changeFormat(id: string) {
    if (locked) return;
    const next = product.variants.find((item) => item.id === id);
    if (!next) return;
    remember({
      productId: product.id,
      variantId: next.id,
      ...(next.selectionId ? { variantSelectionId: next.selectionId } : {}),
      quantity: next.minimum,
    });
  }
  async function addToCart() {
    if (submitting.current || locked || !purchasable || !variant) return;
    submitting.current = true;
    owner!.update(product.handle, "start");
    setPending(true);
    try {
      await cart.addItem(product.handle, variant.id, quantity);
    } finally {
      submitting.current = false;
      setPending(false);
      owner!.update(product.handle, "settled");
    }
  }

  return (
    <div
      className={styles.purchase}
      data-wholesale-purchase={product.handle}
      data-available={ready ? available : undefined}
    >
      <div className={styles.offer}>
        {product.variants.length > 1 ||
        (product.variants.length > 0 && !variant) ? (
          <div className={styles.formatSelect}>
            <label htmlFor={formatId}>{t("Format")}</label>
            <select
              id={formatId}
              value={variant?.id ?? ""}
              disabled={locked}
              data-wholesale-format
              onChange={(event) => changeFormat(event.target.value)}
            >
              {!variant && (
                <option value="" disabled>
                  {t("Choose a format")}
                </option>
              )}
              {product.variants.map((item) => (
                <option value={item.id} key={item.id}>
                  {formatTitle(item)}
                  {!item.available ? ` · ${t("Unavailable")}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className={styles.format} data-wholesale-format>
            {variant ? formatTitle(variant) : t("No published format")}
          </span>
        )}
        <span className={styles.unitPrice} data-wholesale-unit-price>
          {unitPrice}
          <small>{ready && variant ? t("/ UNIT") : ""}</small>
        </span>
        {(!ready || !variant || !available || !validQuantity) && (
          <span
            className={styles.status}
            role="status"
            data-wholesale-purchase-status
          >
            {refreshing
              ? t("Updating prices…")
              : needsReview
                ? t("Review your selection")
                : !pricesReady
                  ? t("Loading prices and availability…")
                  : !variant
                    ? t("Choose a format")
                    : !available
                      ? t("Currently unavailable")
                      : t("This format’s quantity is currently unavailable.")}
          </span>
        )}
      </div>
      <div className={styles.quantity}>
        <span className={styles.label}>{t("Quantity")}</span>
        <div className={styles.stepper}>
          <button
            type="button"
            aria-label={t("Decrease quantity")}
            disabled={locked || !canDecrease}
            onClick={() => changeQuantity(-1)}
          >
            −
          </button>
          <output
            aria-label={t("Quantity")}
            data-wholesale-quantity
            aria-live="polite"
          >
            {quantity}
          </output>
          <button
            type="button"
            aria-label={t("Increase quantity")}
            disabled={locked || !canIncrease}
            onClick={() => changeQuantity(1)}
          >
            +
          </button>
        </div>
      </div>
      <div className={styles.checkout}>
        <div className={styles.total}>
          <span className={styles.label}>{t("Total")}</span>
          <output data-wholesale-total aria-live="polite">
            {total}
          </output>
        </div>
        <div data-wholesale-add>
          {ready && !available ? (
            <button className={styles.blockedButton} type="button" disabled>
              <span>{t("Add to cart")}</span>
              <span aria-hidden="true">+</span>
            </button>
          ) : (
            <AddToCartButton
              treatment="split"
              available={available}
              pending={pending}
              updating={refreshing || (!pricesReady && !needsReview)}
              disabled={locked || !purchasable}
              onAdd={() => void addToCart()}
            />
          )}
        </div>
      </div>
      {variant && (variant.minimum > 1 || variant.increment > 1) && (
        <p className={styles.note}>
          {t("Minimum {minimum} · Increments of {increment}", {
            minimum: variant.minimum,
            increment: variant.increment,
          })}
        </p>
      )}
      {needsReview && (
        <button
          className={styles.review}
          type="button"
          disabled={cart.navigationBusy}
          onClick={cart.openCart}
        >
          {t(
            cart.destinationReviewRequired
              ? "Confirm country"
              : "Refresh selection",
          )}{" "}
          <span aria-hidden="true">↗</span>
        </button>
      )}
      {purchaseError && (
        <p className={styles.error} role="alert" data-wholesale-purchase-error>
          {purchaseError}
        </p>
      )}
    </div>
  );
}
