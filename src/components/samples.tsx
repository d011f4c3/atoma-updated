"use client";

import Link from "next/link";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { SampleTitleTreatment } from "@/lib/sample-title-treatments";
import { SamplePanelTitle } from "./sample-panel-title";
import { SAMPLE_SET_OFFER, resolveSampleSetOffer } from "@/lib/sample-set";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import { HomeHeader } from "./home-header";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { useProductSelection } from "./use-product-selection";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ThemeSwitcher } from "./theme-switcher";
import { SamplesGallery } from "./samples-gallery";
import { SamplesRange } from "./samples-range";
import { SampleNextOrder } from "./sample-next-order";
import { SampleTastingTools } from "./sample-tasting-tools";
import { useSamplesMotion } from "./use-samples-motion";
import { ScrambleText } from "./scramble-text";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";
import styles from "./samples.module.css";

export function useSampleSetPurchase(selectionMemoryKey?: string) {
  const cart = useCart();
  const model = useProductSelection(
    SAMPLE_SET_OFFER?.productHandle,
    false,
    "all",
    undefined,
    selectionMemoryKey,
  );
  const offer = resolveSampleSetOffer(model.catalog);
  // The generic selection hook may fall back to the first catalog product.
  // Only an explicitly reviewed set and format may reach the cart action.
  const product =
    offer && offer.product.id === model.product?.id ? offer.product : undefined;
  const variant = product
    ? offer?.variants.find((item) => item.id === model.variant?.id)
    : undefined;
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const locked =
    pending ||
    cart.busy ||
    model.loading ||
    model.refreshing ||
    cart.destinationReviewRequired ||
    cart.reviewRequired;
  const available = Boolean(product && variant?.available);
  const purchasable = Boolean(
    product && canPurchaseQuantity(variant, model.quantity),
  );
  const failed =
    !model.loading &&
    (!model.catalog || model.catalog.status === "unavailable");

  async function addSet() {
    if (submitting.current || locked || !product || !variant || !purchasable)
      return;
    submitting.current = true;
    setPending(true);
    try {
      await cart.addItem(product.handle, variant.id, model.quantity);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return {
    model,
    offer,
    variant,
    available,
    purchasable,
    pending,
    locked,
    failed,
    cartError: cart.error,
    addSet,
  };
}

export function SampleSetPurchase({
  purchase,
  className,
  titleTreatment,
  presentation = "panel",
  showValueNote = true,
  disabled = false,
  headingId = "samples-purchase",
}: {
  purchase: ReturnType<typeof useSampleSetPurchase>;
  className?: string;
  titleTreatment?: SampleTitleTreatment;
  presentation?: "panel" | "page" | "entry" | "study";
  showValueNote?: boolean;
  disabled?: boolean;
  headingId?: string;
}) {
  const { t } = useStorefrontLocale();
  const {
    model,
    offer,
    variant,
    available,
    purchasable,
    pending,
    locked: purchaseLocked,
    failed,
    cartError,
    addSet,
  } = purchase;
  const locked = purchaseLocked || disabled;
  const [valueOpen, setValueOpen] = useState(false);
  const valueId = useId();
  const [creditAction = "", creditAmount] = t(
    "First wholesale order credit · approx. US$29",
  ).split(" · ");
  const purchaseHeading = useRef<HTMLHeadingElement>(null);
  function retrySet() {
    if (locked) return;
    purchaseHeading.current?.focus({ preventScroll: true });
    model.retry();
  }
  const creditLink = (
    <Link
      className={styles.creditLink}
      href="/samples#samples-next"
      aria-disabled={locked || undefined}
      onClick={(event) => {
        if (locked) event.preventDefault();
      }}
      onNavigate={(event) => {
        if (locked) event.preventDefault();
      }}
      data-sample-credit-link
    >
      <span>
        <ScrambleText
          text={creditAction}
          interactive
          animateOnMount={false}
          wrap
        />
        {creditAmount && ` · ${creditAmount}`}
      </span>
      <span aria-hidden="true"> ↗</span>
    </Link>
  );
  const valueDetails = (mobile = false) => (
    <div
      className={styles.valueDisclosure}
      data-sample-value-disclosure
      data-mobile-value={mobile || undefined}
      data-page-value={presentation === "page" || undefined}
      data-open={valueOpen || undefined}
    >
      {presentation === "page" && (
        <button
          type="button"
          className={styles.valueToggle}
          aria-expanded={valueOpen}
          aria-controls={`${valueId}-${mobile ? "mobile" : "main"}`}
          onClick={() => setValueOpen((open) => !open)}
        >
          <ScrambleText
            text={t("Sample Set details")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span aria-hidden="true">{valueOpen ? "−" : "+"}</span>
        </button>
      )}
      <p
        id={`${valueId}-${mobile ? "mobile" : "main"}`}
        className={`${styles.detail} ${styles.valueNote}`}
        data-sample-value
      >
        {mobile && (
          <span className={styles.mobileSetFact}>
            3 × 20 g · {t("60 g total")}
          </span>
        )}
        {t(
          "Compare flavour, texture and performance in your own recipes before committing to 1 kg. Your Sample Set includes ¥4,500 credit toward your first eligible wholesale order of 1 kg or more. Taste first, then put the value of your samples toward your chosen matcha using the code emailed after purchase.",
        )}
      </p>
    </div>
  );
  return (
    <section
      className={[styles.purchase, className].filter(Boolean).join(" ")}
      data-sample-purchase
      data-presentation={presentation}
      aria-labelledby={headingId}
    >
      {presentation === "entry" || presentation === "study" ? (
        <h3 id={headingId} ref={purchaseHeading} tabIndex={-1}>
          {t("Order the set")}
        </h3>
      ) : presentation === "page" ? (
        <h2 id={headingId} ref={purchaseHeading} tabIndex={-1}>
          {t("Order the set")}
        </h2>
      ) : titleTreatment ? (
        <SamplePanelTitle
          treatment={titleTreatment}
          headingId={headingId}
          headingRef={purchaseHeading}
        />
      ) : (
        <>
          <p className={styles.eyebrow}>ATOMA / {t("Samples")}</p>
          <h2 id={headingId} ref={purchaseHeading} tabIndex={-1}>
            {t("Sample Set")}
          </h2>
          <p className={styles.setLine}>
            3 × 20 g <span> / {t("60 g total")}</span>
          </p>
        </>
      )}
      {showValueNote && valueDetails()}
      {model.loading ? (
        <div className={styles.status} role="status">
          {t("Opening the sample set…")}
          {presentation !== "panel" && (
            <noscript>
              <p>{t("Enable JavaScript to check availability and order.")}</p>
            </noscript>
          )}
        </div>
      ) : failed ? (
        <div className={styles.status} role="status">
          <p>{t("The sample set couldn’t be loaded.")}</p>
          <button
            className={
              presentation !== "panel" ? styles.retryAction : styles.textButton
            }
            onClick={retrySet}
            disabled={locked}
          >
            <ScrambleText
              text={t("Try again")}
              interactive
              animateOnMount={false}
              wrap
            />{" "}
            ↻
          </button>
        </div>
      ) : !offer ? (
        <div className={styles.status} data-sample-unavailable>
          <p>{t("Ordering is not open yet.")}</p>
          {presentation === "panel" && (
            <p className={styles.detail}>
              {t(
                "Price, shipping and dispatch details will appear here when the set is available.",
              )}
            </p>
          )}
          {presentation === "page" ? (
            <a
              className={styles.contentsLink}
              href="#samples-contents"
              aria-disabled={locked || undefined}
              onClick={(event) => {
                if (locked) event.preventDefault();
              }}
            >
              <span>
                <ScrambleText
                  text={t("See what's included")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 19 19 5M5 5h14v14" />
              </svg>
            </a>
          ) : (
            <AddToCartButton
              updating={model.refreshing}
              available={false}
              pending={false}
              onAdd={() => undefined}
            />
          )}
          {presentation !== "panel" && (
            <details className={styles.orderDetails}>
              <summary>
                <ScrambleText
                  text={t("Ordering information")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
                <span aria-hidden="true" />
              </summary>
              <p className={styles.detail}>
                {t(
                  "Price, shipping and dispatch details will appear here when the set is available.",
                )}
              </p>
            </details>
          )}
        </div>
      ) : (
        <div className={styles.order} data-sample-order>
          <div className={styles.price}>
            {presentation !== "panel" && (
              <span className={styles.eyebrow}>{t("Per set")}</span>
            )}
            {model.refreshing
              ? t("Updating prices…")
              : variant
                ? money(variant.priceMinor, variant.currency)
                : "—"}
          </div>
          {offer.variants.length > 1 || !variant ? (
            <label className={styles.format}>
              {t("Choose a set format")}
              <select
                value={variant?.id ?? ""}
                disabled={locked}
                onChange={(event) => model.selectVariant(event.target.value)}
              >
                {!variant && (
                  <option value="" disabled>
                    {t("Choose a set format")}
                  </option>
                )}
                {offer.variants.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title === "Default Title"
                      ? t("Sample Set")
                      : item.title}
                    {item.available ? "" : ` — ${t("Unavailable")}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className={styles.orderLine}>
            <div className={styles.quantity}>
              <span>{t("Set quantity")}</span>
              <div className={styles.stepper}>
                <button
                  type="button"
                  aria-label={t("Decrease quantity")}
                  disabled={
                    locked ||
                    !available ||
                    !variant ||
                    model.quantity <= variant.minimum
                  }
                  onClick={model.decrementQuantity}
                >
                  −
                </button>
                <output aria-label={t("Set quantity")} aria-live="polite">
                  {model.quantity}
                </output>
                <button
                  type="button"
                  aria-label={t("Increase quantity")}
                  disabled={locked || !available || !model.canIncrement}
                  onClick={model.incrementQuantity}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.total}>
              <span>{t("Total")}</span>
              <output aria-label={t("Sample set total")} aria-live="polite">
                {variant &&
                Number.isSafeInteger(variant.priceMinor * model.quantity)
                  ? money(variant.priceMinor * model.quantity, variant.currency)
                  : "—"}
              </output>
            </div>
          </div>
          {variant && (variant.minimum > 1 || variant.increment > 1) && (
            <p className={styles.detail}>
              {t("Minimum {minimum} · Increments of {increment}", {
                minimum: variant.minimum,
                increment: variant.increment,
              })}
            </p>
          )}
          <AddToCartButton
            updating={model.refreshing}
            available={available}
            pending={pending}
            disabled={locked || !purchasable}
            onAdd={() => {
              if (!locked) void addSet();
            }}
          />
          {cartError && (
            <p className={styles.error} role="alert">
              {cartError}
            </p>
          )}
          <details className={styles.orderDetails}>
            <summary>
              <ScrambleText
                text={t("Ordering information")}
                interactive
                animateOnMount={false}
                wrap
              />
              <span aria-hidden="true" />
            </summary>
            <p className={styles.detail} data-sample-shipping-note>
              {t(
                "Shipping is extra and calculated by Shopify at checkout for your delivery destination.",
              )}
            </p>
            <p className={styles.detail}>
              {presentation === "study"
                ? t(
                    "¥4,500 credit toward your first eligible wholesale order of 1 kg or more after buying the Sample Set.",
                  )
                : creditLink}
            </p>
            <p className={styles.detail}>
              {t(
                "Your credit code is included in your Sample Set order confirmation email. Keep it for when you are ready to order 1 kg or more.",
              )}
            </p>
            <p className={styles.detail}>
              {t("Use the same email as your Sample Set order.")}
            </p>
          </details>
        </div>
      )}
      {showValueNote && presentation === "page" && valueDetails(true)}
    </section>
  );
}

export function Samples() {
  const { t, locale } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const purchase = useSampleSetPurchase();
  const { locked } = purchase;
  const pageRef = useRef<HTMLElement>(null);
  const tastingId = useId();
  const [tastingOpen, setTastingOpen] = useState(false);
  useSamplesMotion(pageRef);
  usePageReveals(pageRef);

  return (
    <div
      className={styles.page}
      data-samples-page
      data-client-reading
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <HomeHeader persistentTheme tone={tone} activePage="samples" />
      <main
        ref={pageRef}
        className={`${styles.content} ${revealStyles.scope}`}
        lang={locale}
      >
        <div className={styles.topline} data-page-enter="text">
          <nav aria-label={t("Breadcrumb")}>
            <Link
              href="/wholesale"
              aria-disabled={locked || undefined}
              onNavigate={(event) => {
                if (locked) event.preventDefault();
              }}
            >
              <ScrambleText
                text={t("Wholesale")}
                interactive
                animateOnMount={false}
                wrap
              />
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t("Samples")}</span>
          </nav>
          <ThemeSwitcher />
        </div>

        <div className={styles.coverTrack} data-samples-cover>
          <section
            className={styles.setLayout}
            aria-labelledby="sample-set-title"
          >
            <header className={styles.setIntroduction} data-page-enter="hero">
              <h1 id="sample-set-title">
                <ScrambleText text={t("Sample Set")} wrap />
              </h1>
              <p className={styles.setDescription}>
                {t("Three matcha · 20 g each")}
              </p>
            </header>

            <div className={styles.setVisual} data-page-enter="visual">
              <SamplesGallery />
            </div>

            <aside
              className={styles.setPurchase}
              id="samples-order"
              tabIndex={-1}
              data-page-enter="text"
            >
              <div className={styles.orderSummary}>
                <span>3 × 20 g</span>
                <span>{t("60 g total")}</span>
              </div>
              <SampleSetPurchase purchase={purchase} presentation="page" />
            </aside>
          </section>
        </div>

        <div className={styles.journey}>
          <SamplesRange disabled={locked} />

          <div
            className={styles.tastingDisclosure}
            data-sample-tasting-disclosure
            data-open={tastingOpen || undefined}
          >
            <button
              type="button"
              className={styles.tastingToggle}
              aria-expanded={tastingOpen}
              aria-controls={tastingId}
              onClick={() => setTastingOpen((open) => !open)}
            >
              <span>{t("Tasting tools")}</span>
              <span aria-hidden="true">{tastingOpen ? "−" : "+"}</span>
            </button>
            <div className={styles.tastingContent} id={tastingId}>
              <SampleTastingTools />
            </div>
          </div>

          <section className={styles.next} aria-labelledby="samples-next">
            <figure
              className={styles.preparationImage}
              data-samples-preparation
              data-page-reveal="fade"
            >
              <Image
                src="/images/samples/prepared-matcha.webp"
                alt={t("A bowl of prepared matcha on a woven mat.")}
                width={1600}
                height={1067}
                sizes="(max-width: 760px) 100vw, 92vw"
              />
            </figure>
            <SampleNextOrder
              catalog={purchase.model.catalog}
              loading={purchase.model.loading}
              disabled={locked}
            />
          </section>
          <div className={styles.returnLine} data-page-reveal="rise">
            <span>{t("One set contains all three matcha.")}</span>
            <a
              className={styles.returnAction}
              href="#samples-order"
              aria-disabled={locked || undefined}
              onClick={(event) => {
                if (locked) event.preventDefault();
              }}
            >
              <span>
                <ScrambleText text={t("Order the set")} interactive />
              </span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 19 19 5M5 5h14v14" />
              </svg>
            </a>
          </div>
        </div>
        <noscript>
          <style>{`[data-samples-cover] { min-height: auto !important; margin-bottom: 0 !important; padding-bottom: 0 !important; } [data-samples-cover] > section { position: relative !important; height: auto !important; } [data-samples-page] [data-sample-value] { display: block !important; } [data-samples-page] [data-sample-value-disclosure] > button { display: none !important; } [data-sample-tasting-disclosure] > button { display: none !important; } [data-sample-tasting-disclosure] > div { display: contents !important; }`}</style>
        </noscript>
      </main>
    </div>
  );
}
