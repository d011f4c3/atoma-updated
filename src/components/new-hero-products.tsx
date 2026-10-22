"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog-types";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import type { ProductKey } from "@/lib/product-codes";
import { getProductContent } from "@/lib/product-content";
import {
  canPurchaseQuantity,
  initialSelection,
  money,
  quantityCeiling,
  refreshedSelection,
  type Selection,
} from "@/lib/product-selection";
import { SAMPLE_SET_CONTENTS, type SampleSetContent } from "@/lib/sample-set";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { useHomepageJourney } from "./homepage-journey-provider";
import { ProductApplicationImage } from "./product-application-image";
import { ShopMaterialImage } from "./shop-material-image";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useProductSelection } from "./use-product-selection";
import { ProductPopupContent } from "./product-popup-content";
import { ProductPopupPurchase } from "./product-popup-purchase";
import popupStyles from "./product-popup-content.module.css";
import styles from "./new-hero-products.module.css";

const applicationLabels: Record<ProductKey, string> = {
  ceremonial: "Tea service",
  barista: "Lattes",
  culinary: "Recipes & baking",
};

type PurchaseFeedback = {
  productKey: ProductKey;
  pending: boolean;
  dismissed: boolean;
};
type PurchaseFeedbackPhase = "start" | "settled" | "dismiss";

/** One destination-aware catalog read, with an independent order for each tea. */
export function NewHeroProducts({
  presentation = "cards",
  idPrefix = "new-hero",
  selectionMemoryKey,
  selectedProduct = "ceremonial",
  canonicalPopup = false,
}: {
  presentation?:
    | "cards"
    | "rows"
    | "counter"
    | "gallery"
    | "folio"
    | "showcase"
    | "spotlight";
  idPrefix?: string;
  selectionMemoryKey?: string;
  selectedProduct?: ProductKey;
  canonicalPopup?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const cart = useCart();
  const model = useProductSelection();
  const [purchaseFeedback, setPurchaseFeedback] =
    useState<PurchaseFeedback | null>(null);
  const catalogReady = model.catalog?.status === "ready";
  const failed = !model.loading && model.catalog?.status === "unavailable";
  const pricesReady =
    catalogReady &&
    !model.loading &&
    !model.refreshing &&
    !cart.destinationReviewRequired &&
    !cart.reviewRequired;

  // Once the shared cart clears a completed error, later cart errors no longer
  // belong to the previous card. Pending attempts retain ownership until settled.
  if (purchaseFeedback && !purchaseFeedback.pending && !cart.error) {
    setPurchaseFeedback(null);
  }

  function updatePurchaseFeedback(
    productKey: ProductKey,
    phase: PurchaseFeedbackPhase,
  ) {
    setPurchaseFeedback((current) => {
      if (phase === "start") {
        return { productKey, pending: true, dismissed: false };
      }
      if (current?.productKey !== productKey) return current;
      return phase === "settled"
        ? { ...current, pending: false }
        : { ...current, dismissed: true };
    });
  }

  return (
    <div
      className={canonicalPopup ? popupStyles.catalog : styles.root}
      data-new-hero-products
      data-presentation={presentation}
    >
      {failed && (
        <div className={styles.message} role="status">
          <p>{t("The collection couldn’t be loaded. Please try again.")}</p>
          <button type="button" disabled={cart.busy} onClick={model.retry}>
            <ScrambleText
              text={t("Try again")}
              interactive
              animateOnMount={false}
              wrap
            />
          </button>
        </div>
      )}
      {(cart.destinationReviewRequired || cart.reviewRequired) && (
        <div className={styles.message} data-new-hero-order-review>
          <button
            type="button"
            disabled={cart.navigationBusy}
            onClick={cart.openCart}
          >
            <ScrambleText
              text={t(
                cart.destinationReviewRequired
                  ? "Confirm country"
                  : "Refresh selection",
              )}
              interactive
              animateOnMount={false}
              wrap
            />
          </button>
        </div>
      )}
      {cart.error && !purchaseFeedback && (
        <p className={styles.error} role="alert">
          {cart.error}
        </p>
      )}
      <div className={canonicalPopup ? popupStyles.products : styles.grid}>
        {SAMPLE_SET_CONTENTS.map((item, index) => {
          const matches = catalogReady
            ? model.products.filter(
                (product) => product.handle === item.productHandle,
              )
            : [];
          return (
            <ApplicationProduct
              key={item.key}
              idPrefix={idPrefix}
              imageFirst={presentation === "showcase"}
              spotlight={presentation === "spotlight"}
              canonicalPopup={canonicalPopup}
              hidden={
                presentation === "spotlight" && selectedProduct !== item.key
              }
              selectionMemoryKey={selectionMemoryKey}
              position={index + 1}
              identity={item}
              product={matches.length === 1 ? matches[0] : undefined}
              loading={model.loading}
              refreshing={model.refreshing}
              catalogReady={catalogReady}
              catalogFailed={failed}
              pricesReady={pricesReady}
              purchaseError={
                purchaseFeedback?.productKey === item.key &&
                !purchaseFeedback.pending &&
                !purchaseFeedback.dismissed
                  ? cart.error
                  : null
              }
              onPurchaseFeedback={updatePurchaseFeedback}
            />
          );
        })}
      </div>
    </div>
  );
}

function ApplicationProduct({
  idPrefix,
  imageFirst,
  spotlight,
  canonicalPopup,
  hidden,
  selectionMemoryKey,
  position,
  identity,
  product,
  loading,
  refreshing,
  catalogReady,
  catalogFailed,
  pricesReady,
  purchaseError,
  onPurchaseFeedback,
}: {
  idPrefix: string;
  imageFirst: boolean;
  spotlight: boolean;
  canonicalPopup: boolean;
  hidden: boolean;
  selectionMemoryKey?: string;
  position: number;
  identity: SampleSetContent;
  product: CatalogProduct | undefined;
  loading: boolean;
  refreshing: boolean;
  catalogReady: boolean;
  catalogFailed: boolean;
  pricesReady: boolean;
  purchaseError: string | null;
  onPurchaseFeedback: (
    productKey: ProductKey,
    phase: PurchaseFeedbackPhase,
  ) => void;
}) {
  const { locale, t } = useStorefrontLocale();
  const cart = useCart();
  const {
    journey,
    rememberJourney,
    surfaceSelections,
    rememberSurfaceSelection,
  } = useHomepageJourney();
  const headingId = useId();
  const [selection, setSelection] = useState<Selection | null>(
    () =>
      (selectionMemoryKey
        ? surfaceSelections[selectionMemoryKey]?.[identity.productHandle]
        : undefined) ?? journey.selection,
  );
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const current = product
    ? selection?.productId === product.id
      ? refreshedSelection(product, selection)
      : initialSelection(product)
    : null;
  const matchingVariants =
    product?.variants.filter((item) => item.id === current?.variantId) ?? [];
  const variant =
    matchingVariants.length === 1 ? matchingVariants[0] : undefined;
  const quantity = current?.quantity;
  const available = Boolean(variant?.available);
  const validQuantity = Boolean(
    quantity !== undefined && canPurchaseQuantity(variant, quantity),
  );
  const locked = pending || cart.busy || loading || refreshing || !catalogReady;
  const purchasable = pricesReady && validQuantity;
  const application = getProductApplicationImage(identity.productHandle);
  const content = spotlight
    ? getProductContent(
        {
          title: identity.name,
          handle: identity.productHandle,
          description: "",
        },
        locale,
      )
    : null;
  const unitPrice =
    pricesReady && variant ? money(variant.priceMinor, variant.currency) : "—";
  const total =
    pricesReady &&
    variant &&
    quantity !== undefined &&
    Number.isSafeInteger(variant.priceMinor * quantity)
      ? money(variant.priceMinor * quantity, variant.currency)
      : "—";
  const canIncrease = Boolean(
    variant &&
    quantity !== undefined &&
    (validQuantity
      ? quantity + variant.increment <= quantityCeiling(variant)
      : canPurchaseQuantity(variant, variant.minimum)),
  );
  const canDecrease = Boolean(
    variant && quantity !== undefined && quantity > variant.minimum,
  );
  const status = loading
    ? t("Loading prices and availability…")
    : refreshing
      ? t("Updating prices…")
      : catalogFailed
        ? t("The collection couldn’t be loaded.")
        : !product
          ? t("This selection is not in the current collection.")
          : !variant
            ? t("Choose a published format below to continue.")
            : available
              ? t("Available")
              : t("Currently unavailable");

  function updateSelection(next: Selection) {
    setSelection(next);
    if (selectionMemoryKey) {
      rememberSurfaceSelection(
        selectionMemoryKey,
        identity.productHandle,
        next,
      );
    }
  }

  function changeQuantity(direction: -1 | 1) {
    if (locked || !available || !variant || !current) return;
    const next = validQuantity
      ? Math.max(
          variant.minimum,
          current.quantity + direction * variant.increment,
        )
      : variant.minimum;
    if (canPurchaseQuantity(variant, next)) {
      onPurchaseFeedback(identity.key, "dismiss");
      updateSelection({ ...current, quantity: next });
    }
  }

  function changeVariant(item: CatalogVariant) {
    if (locked || !product) return;
    onPurchaseFeedback(identity.key, "dismiss");
    updateSelection({
      productId: product.id,
      variantId: item.id,
      ...(item.selectionId ? { variantSelectionId: item.selectionId } : {}),
      quantity: item.minimum,
    });
  }

  async function addToCart() {
    if (
      submitting.current ||
      locked ||
      !purchasable ||
      !product ||
      !variant ||
      quantity === undefined
    ) {
      return;
    }
    submitting.current = true;
    onPurchaseFeedback(identity.key, "start");
    setPending(true);
    try {
      await cart.addItem(product.handle, variant.id, quantity);
    } finally {
      submitting.current = false;
      setPending(false);
      onPurchaseFeedback(identity.key, "settled");
    }
  }

  const ProductHeading = spotlight ? "h2" : "h3";
  const imagery = (
    <div className={styles.imagery}>
      <ProductApplicationImage
        handle={identity.productHandle}
        sizes={
          spotlight
            ? "(max-width: 900px) min(42rem, calc(100vw - 3.5rem)), (max-width: 1200px) 45vw, 33rem"
            : undefined
        }
      />
    </div>
  );

  const productLink = (
    <Link
      href={`/shop/${encodeURIComponent(identity.productHandle)}`}
      className={styles.productLink}
      data-new-hero-product-link={identity.key}
      aria-label={t("View {name}", { name: t(identity.name) })}
      aria-disabled={cart.navigationBusy || undefined}
      onClick={(event) => {
        if (cart.navigationBusy) event.preventDefault();
      }}
      onNavigate={(event) => {
        if (cart.navigationBusy) {
          event.preventDefault();
          return;
        }
        if (current) {
          rememberJourney({ selection: current });
          if (selectionMemoryKey) {
            rememberSurfaceSelection(
              selectionMemoryKey,
              identity.productHandle,
              current,
            );
          }
        }
      }}
    >
      <span data-new-hero-product-name={spotlight ? undefined : true}>
        <ScrambleText
          text={t(spotlight ? "Product details" : identity.name)}
          interactive
          animateOnMount={false}
          wrap
        />
      </span>
      <span aria-hidden="true">↗</span>
    </Link>
  );

  const productIdentity = (
    <header className={styles.identity}>
      <span className={styles.applicationNumber} aria-hidden="true">
        {String(position).padStart(2, "0")}
      </span>
      <ProductHeading id={headingId}>
        {spotlight ? (
          <span data-new-hero-product-name>{t(identity.name)}</span>
        ) : (
          t(applicationLabels[identity.key])
        )}
      </ProductHeading>
      <div className={styles.nameLine}>
        {productLink}
        <span className={styles.code} data-new-hero-product-code>
          ◇ {identity.productCode}
        </span>
      </div>
    </header>
  );
  const purchaseControls = (
    <div
      className={styles.purchase}
      data-new-hero-product-order={spotlight || undefined}
    >
      <div className={styles.priceLine}>
        <div>
          <p className={styles.purchaseKind}>{t("One-time purchase")}</p>
          <p className={styles.price} data-new-hero-price>
            {unitPrice}
            {pricesReady && variant && (
              <span className={styles.perUnit}> {t("/ UNIT")}</span>
            )}
          </p>
        </div>
        <p className={styles.status} data-new-hero-product-status role="status">
          {status}
        </p>
      </div>
      <fieldset className={styles.formats} disabled={locked}>
        <legend>{t("Format")}</legend>
        <div>
          {product?.variants.map((item) => (
            <button
              type="button"
              key={item.id}
              data-new-hero-format={item.id}
              aria-pressed={variant?.id === item.id}
              onClick={() => changeVariant(item)}
            >
              <span>
                {item.title === "Default Title" ? t("Standard") : item.title}
              </span>
              {!item.available && <small>{t("Unavailable")}</small>}
            </button>
          ))}
        </div>
        {!product?.variants.length && (
          <p className={styles.formatMessage}>
            {t(
              loading || refreshing
                ? "Loading prices and availability…"
                : catalogFailed
                  ? "The collection couldn’t be loaded."
                  : "No formats are currently published.",
            )}
          </p>
        )}
      </fieldset>
      <div className={styles.orderLine}>
        <div className={styles.quantity}>
          <span>{t("Quantity")}</span>
          <div className={styles.stepper}>
            <button
              type="button"
              aria-label={t("Decrease quantity")}
              disabled={locked || !available || !canDecrease}
              onClick={() => changeQuantity(-1)}
            >
              −
            </button>
            <output
              aria-label={t("Quantity")}
              aria-live="polite"
              data-new-hero-quantity
            >
              {quantity ?? "—"}
            </output>
            <button
              type="button"
              aria-label={t("Increase quantity")}
              disabled={locked || !available || !canIncrease}
              onClick={() => changeQuantity(1)}
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.total}>
          <span>{t("Total")}</span>
          <output aria-live="polite" data-new-hero-total>
            {total}
          </output>
        </div>
      </div>
      {variant && (variant.minimum > 1 || variant.increment > 1) && (
        <p className={styles.quantityNote}>
          {t("Minimum {minimum} · Increments of {increment}", {
            minimum: variant.minimum,
            increment: variant.increment,
          })}
        </p>
      )}
      {variant && available && !validQuantity && (
        <p className={styles.quantityNote} role="status">
          {t("This format’s quantity is currently unavailable.")}
        </p>
      )}
      <div className={styles.add} data-new-hero-add>
        <AddToCartButton
          treatment="split"
          available={available}
          pending={pending}
          updating={loading || refreshing}
          disabled={locked || !purchasable}
          onAdd={() => void addToCart()}
        />
      </div>
      {purchaseError && (
        <p
          className={styles.purchaseError}
          role="alert"
          data-new-hero-purchase-error
        >
          {purchaseError}
        </p>
      )}
    </div>
  );
  const profile = content && (
    <details
      className={styles.spotlightProfile}
      data-new-hero-product-profile={identity.key}
    >
      <summary>
        <ScrambleText
          text={t("Preparation & profile")}
          interactive
          animateOnMount={false}
          wrap
        />
        <span aria-hidden="true" />
      </summary>
      <div className={styles.profileBody}>
        <div className={styles.profileIntroduction}>
          <p>{content.materialSummary}</p>
        </div>
        <p>{content.summary}</p>
        <dl className={styles.profileValues}>
          {content.materialProfile.map((property) => (
            <div key={property.label}>
              <dt>{property.label}</dt>
              <dd>{property.value}</dd>
            </div>
          ))}
        </dl>
        <h3>{t("Preparation")}</h3>
        <p>{content.preparation}</p>
      </div>
    </details>
  );

  return (
    <article
      id={`${idPrefix}-${identity.key}`}
      className={canonicalPopup ? popupStyles.product : styles.product}
      hidden={hidden}
      aria-labelledby={headingId}
      tabIndex={-1}
      data-new-hero-product={identity.key}
      data-application-number={position}
      data-product-handle={identity.productHandle}
      data-available={pricesReady && available}
      data-catalog-state={
        loading
          ? "loading"
          : refreshing
            ? "refreshing"
            : !catalogReady
              ? "unavailable"
              : product
                ? "ready"
                : "missing"
      }
    >
      {canonicalPopup && content ? (
        <ProductPopupContent
          identity={identity}
          content={content}
          headingId={headingId}
          purchase={
            <ProductPopupPurchase
              product={product}
              variant={variant}
              quantity={quantity}
              pricesReady={pricesReady}
              available={available}
              validQuantity={validQuantity}
              locked={locked}
              pending={pending}
              loading={loading}
              refreshing={refreshing}
              purchasable={purchasable}
              unitPrice={unitPrice}
              total={total}
              status={
                cart.destinationReviewRequired
                  ? t("Confirm country")
                  : cart.reviewRequired
                    ? t("Refresh selection")
                    : status
              }
              canIncrease={canIncrease}
              canDecrease={canDecrease}
              purchaseError={purchaseError}
              onQuantityChange={changeQuantity}
              onVariantChange={changeVariant}
              onAdd={() => void addToCart()}
            />
          }
        />
      ) : spotlight && content ? (
        <>
          <div className={styles.spotlightIntroduction}>{productIdentity}</div>
          <div className={styles.spotlightOrder}>
            <div
              className={styles.spotlightReading}
              data-new-hero-product-reading
            >
              <div
                className={styles.spotlightOverview}
                data-new-hero-product-overview
              >
                <p>{content.materialSummary}</p>
              </div>
              {profile}
            </div>
            {purchaseControls}
          </div>
          <div
            className={styles.spotlightInformation}
            data-new-hero-product-information
          >
            <figure
              className={styles.materialSwatch}
              data-new-hero-product-swatch
            >
              <ShopMaterialImage
                src={identity.image}
                alt={t(identity.imageAlt)}
              />
            </figure>
            {imagery}
          </div>
        </>
      ) : (
        <>
          {imageFirst && imagery}
          {productIdentity}
          {!imageFirst && imagery}
          {application && (
            <p className={styles.usage}>{t(application.usage)}</p>
          )}
          {purchaseControls}
        </>
      )}
    </article>
  );
}
