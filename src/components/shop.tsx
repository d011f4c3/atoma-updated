"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog-types";
import { translate, type Locale } from "@/lib/i18n";
import type { SampleEntryDirection } from "@/lib/sample-entry-directions";
import { getProductContent } from "@/lib/product-content";
import { getProductDisplayIndex } from "@/lib/product-display-index";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import {
  getProductOfferSummary,
  productFormatLabel,
} from "@/lib/product-comparison";
import { money } from "@/lib/product-selection";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import {
  matchesShopCategory,
  type ShopCategory,
} from "@/lib/shop-category-filter";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader } from "./home-header";
import { useProductSelection } from "./use-product-selection";
import { ShopMaterialImage } from "./shop-material-image";
import { SampleEntryLink } from "./sample-entry-link";
import { ScrambleText } from "./scramble-text";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";
import styles from "./shop.module.css";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useCart } from "./cart-drawer";
import { useSavedMatcha } from "./use-saved-matcha";
import { ProductComparison } from "./product-comparison";

type ShopProps = {
  productClarity?: boolean;
  sampleEntryDirection?: SampleEntryDirection;
  studyTone?: "light" | "dark";
  onStudyToneChange?: (tone: "light" | "dark") => void;
  categoryFilter?: {
    category: ShopCategory;
    locale?: Locale;
    onClear: () => void;
    controls: (context: {
      products: CatalogProduct[];
      loading: boolean;
      disabled: boolean;
    }) => ReactNode;
  };
};

export function Shop({
  productClarity = false,
  sampleEntryDirection,
  studyTone,
  onStudyToneChange,
  categoryFilter,
}: ShopProps = {}) {
  const { t } = useStorefrontLocale();
  const { tone: storefrontTone } = useStorefrontTheme();
  const tone = studyTone ?? storefrontTone;
  const localTheme = Boolean(studyTone || onStudyToneChange);
  const pageRef = useRef<HTMLElement>(null);
  usePageReveals(pageRef, !localTheme);
  const { busy } = useCart();
  const { catalog, products, loading, refreshing, retry } =
    useProductSelection();
  const categoryLoading = loading || refreshing;
  const categoryDisabled =
    busy || categoryLoading || catalog?.status !== "ready";
  const matchCount = categoryFilter
    ? products.filter((product) =>
        matchesShopCategory(product.handle, categoryFilter.category),
      ).length
    : products.length;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const collectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const saved = useSavedMatcha();
  const [clearFailed, setClearFailed] = useState(false);
  const savedMatcha = SAMPLE_SET_CONTENTS.find(
    (item) => item.productHandle === saved.productHandle,
  );
  const savedHref = savedMatcha
    ? oneKilogramProductUrl(savedMatcha.productHandle)
    : null;

  function retryCollection() {
    headingRef.current?.focus({ preventScroll: true });
    retry();
  }

  return (
    <main
      ref={pageRef}
      className={
        localTheme ? styles.shop : `${styles.shop} ${revealStyles.scope}`
      }
      data-tone={tone}
      data-storefront-theme={tone}
      data-canonical-shop={!localTheme || undefined}
      data-sample-entry-shop={sampleEntryDirection}
      data-product-clarity={productClarity || undefined}
      data-client-reading={productClarity || undefined}
    >
      <HomeHeader
        persistentTheme={!localTheme}
        samplesEntry={Boolean(sampleEntryDirection)}
        tone={tone}
        activePage="shop"
      />
      <div className={styles.content}>
        <header
          className={styles.intro}
          data-page-enter={!localTheme ? "text" : undefined}
        >
          <div>
            <p className={styles.eyebrow}>
              <ScrambleText text={t("SHOP / MATCHA")} periodic wrap />
            </p>
            <h1 ref={headingRef} tabIndex={-1}>
              <ScrambleText text={t("Find your matcha.")} wrap />
            </h1>
          </div>
          <p className={styles.introCopy}>
            <ScrambleText text={t("For the way you make it.")} periodic wrap />
            <br />
            <ScrambleText
              text={t("Explore the collection, choose your format.")}
              periodic
              wrap
            />
            {(!sampleEntryDirection || sampleEntryDirection === "quiet") && (
              <Link
                className={styles.samplesLink}
                data-sample-entry-point={
                  sampleEntryDirection ? "intro" : undefined
                }
                href="/samples"
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
                onNavigate={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                <ScrambleText text={t("Start with samples")} interactive />{" "}
                <span aria-hidden="true">↗</span>
              </Link>
            )}
          </p>
        </header>
        {savedMatcha && savedHref && (
          <aside className={styles.savedMatcha} data-shop-saved-matcha>
            <span className={styles.savedLabel}>{t("Your saved matcha")}</span>
            <div className={styles.savedIdentity}>
              <span>{t(savedMatcha.name)}</span>
              <span>{t("Saved on this device")}</span>
            </div>
            <div className={styles.savedActions}>
              <Link
                href={savedHref}
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
                onNavigate={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                <span>
                  {t("View 1 kg of {name}", { name: t(savedMatcha.name) })
                    .split(/(1 kg)/)
                    .map((part, index) =>
                      part === "1 kg" ? (
                        part
                      ) : (
                        <ScrambleText
                          key={index}
                          text={part}
                          interactive
                          animateOnMount={false}
                          wrap
                        />
                      ),
                    )}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
              <button
                type="button"
                disabled={busy || !saved.ready}
                onClick={() => {
                  const cleared = saved.clearMatcha();
                  setClearFailed(!cleared);
                  if (cleared)
                    collectionHeadingRef.current?.focus({
                      preventScroll: true,
                    });
                }}
              >
                <ScrambleText
                  text={t("Clear saved matcha")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </button>
            </div>
            {clearFailed && (
              <p className={styles.savedError} role="alert">
                {t("Your saved choice could not be cleared on this device.")}
              </p>
            )}
          </aside>
        )}
        {sampleEntryDirection === "featured" && (
          <div className={styles.sampleFeature}>
            <SampleEntryLink
              variant="feature"
              point="collection"
              disabled={busy}
            />
          </div>
        )}
        {categoryFilter?.controls({
          products,
          loading: categoryLoading,
          disabled: categoryDisabled,
        })}
        <div className={styles.collectionHeader}>
          <h2 ref={collectionHeadingRef} tabIndex={-1}>
            <ScrambleText text={t("THE COLLECTION")} periodic wrap />
          </h2>
          <span
            aria-live="polite"
            lang={
              categoryFilter && !categoryLoading && catalog?.status === "ready"
                ? (categoryFilter.locale ?? "en")
                : undefined
            }
          >
            {loading || (categoryFilter && refreshing)
              ? t("LOADING…")
              : categoryFilter && catalog?.status === "ready"
                ? translate(
                    categoryFilter.locale ?? "en",
                    "{count} of {total} matcha",
                    {
                      count: String(matchCount).padStart(2, "0"),
                      total: String(products.length).padStart(2, "0"),
                    },
                  )
                : t(
                    products.length === 1 ||
                      sampleEntryDirection === "connected"
                      ? "{count} MATCHA"
                      : "{count} SELECTIONS",
                    { count: String(products.length).padStart(2, "0") },
                  )}
          </span>
        </div>
        {loading ? (
          <div className={styles.state} role="status">
            <span className={styles.loader} aria-hidden="true" />
            {t("Opening the collection…")}
          </div>
        ) : catalog?.status === "unavailable" || !catalog ? (
          <div className={styles.state} role="status">
            <h2>{t("The collection couldn’t be loaded.")}</h2>
            <p>{t("Please try again.")}</p>
            <button
              className={styles.retry}
              type="button"
              onClick={retryCollection}
            >
              <ScrambleText text={t("Try again")} interactive />
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.state} role="status">
            <h2>{t("The next selection is taking shape.")}</h2>
            <p>{t("There are no matcha available to browse just yet.")}</p>
          </div>
        ) : (
          <section
            className={styles.collection}
            aria-label={t("Matcha collection")}
          >
            {sampleEntryDirection === "connected" && (
              <SampleEntryLink
                variant="collection"
                point="collection"
                disabled={busy}
              />
            )}
            {products.map((product) => (
              <ShopProduct
                key={product.id}
                product={product}
                clarity={productClarity}
                refreshing={refreshing}
                disabled={busy}
                hidden={
                  categoryFilter
                    ? !matchesShopCategory(
                        product.handle,
                        categoryFilter.category,
                      )
                    : undefined
                }
              />
            ))}
            {categoryFilter && matchCount === 0 && (
              <div
                className={`${styles.state} ${styles.filteredEmpty}`}
                role="status"
                data-shop-category-empty
                lang={categoryFilter.locale ?? "en"}
              >
                <h2>
                  {translate(
                    categoryFilter.locale ?? "en",
                    "No matcha in this category.",
                  )}
                </h2>
                <p>
                  {translate(
                    categoryFilter.locale ?? "en",
                    "Clear the category to view the collection.",
                  )}
                </p>
                <button
                  className={styles.retry}
                  type="button"
                  disabled={categoryDisabled}
                  onClick={() => {
                    if (categoryDisabled) return;
                    collectionHeadingRef.current?.focus({
                      preventScroll: true,
                    });
                    categoryFilter.onClear();
                  }}
                >
                  <ScrambleText
                    text={translate(
                      categoryFilter.locale ?? "en",
                      "Clear category",
                    )}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </button>
              </div>
            )}
          </section>
        )}
        {productClarity && catalog?.status === "ready" && (
          <ProductComparison
            products={products}
            refreshing={refreshing}
            disabled={busy}
          />
        )}
        {sampleEntryDirection && (
          <div className={styles.sampleFooter}>
            <SampleEntryLink
              variant={sampleEntryDirection === "quiet" ? "bar" : "note"}
              point="footer"
              disabled={busy}
            />
          </div>
        )}
        <div className={styles.explore}>
          <span>
            <ScrambleText
              text={t("A closer look at the material.")}
              periodic
              wrap
            />
          </span>
          <Link href="/">
            <ScrambleText text={t("Explore matcha")} interactive />
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <footer className={styles.footer}>
        <span>
          <ScrambleText text={t("ATOMA / MATCHA")} periodic wrap />
        </span>
        {localTheme ? (
          <button
            className={styles.studyTheme}
            type="button"
            role="switch"
            aria-label={t("Dark mode")}
            aria-checked={tone === "dark"}
            title={t(
              tone === "dark" ? "Switch to light mode" : "Switch to dark mode",
            )}
            disabled={busy || !onStudyToneChange}
            onClick={() => {
              if (!busy)
                onStudyToneChange?.(tone === "dark" ? "light" : "dark");
            }}
            data-study-shop-theme
          >
            {t(
              tone === "dark" ? "Switch to light mode" : "Switch to dark mode",
            )}
            <span aria-hidden="true">{tone === "dark" ? "◐" : "◑"}</span>
          </button>
        ) : (
          <ThemeSwitcher showLanguage={false} />
        )}
      </footer>
    </main>
  );
}

function ShopProduct({
  product,
  hidden,
  clarity = false,
  refreshing = false,
  disabled = false,
}: {
  product: CatalogProduct;
  hidden?: boolean;
  clarity?: boolean;
  refreshing?: boolean;
  disabled?: boolean;
}) {
  const { locale, t } = useStorefrontLocale();
  const codeId = useId();
  const content = getProductContent(product, locale);
  const displayIndex = getProductDisplayIndex(product.handle);
  const availableVariants = product.variants.filter(
    (variant) => variant.available,
  );
  const available = availableVariants.length > 0;
  const priceCurrency = availableVariants[0]?.currency;
  const comparablePrices = availableVariants.every(
    (variant) =>
      Number.isSafeInteger(variant.priceMinor) &&
      variant.priceMinor >= 0 &&
      variant.currency === priceCurrency,
  );
  const fromVariant = comparablePrices
    ? availableVariants.reduce<CatalogVariant | undefined>(
        (lowest, variant) =>
          !lowest || variant.priceMinor < lowest.priceMinor ? variant : lowest,
        undefined,
      )
    : undefined;
  const formatCount = product.variants.length;
  const href = `/shop/${encodeURIComponent(product.handle)}`;

  if (clarity) {
    const offer = getProductOfferSummary(product);
    const application = getProductApplicationImage(product.handle);
    const blocked = disabled || refreshing;
    return (
      <article
        className={`${styles.product} ${styles.clearProduct}`}
        data-available={refreshing ? undefined : offer.available}
        data-shop-product={product.id}
        hidden={hidden}
      >
        <Link
          className={styles.productLink}
          href={href}
          aria-label={t("View {name}", { name: content.name })}
          aria-describedby={displayIndex ? codeId : undefined}
          aria-disabled={blocked || undefined}
          onClick={(event) => {
            if (blocked) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (blocked) event.preventDefault();
          }}
        >
          <div className={styles.productIdentity}>
            <h2 data-shop-product-name>
              <ScrambleText text={content.name} interactive wrap />
            </h2>
            {displayIndex && (
              <span
                className={styles.productCode}
                id={codeId}
                data-shop-product-code={displayIndex}
              >
                <span className={styles.srOnly}>{t("Product code")} </span>
                {displayIndex}
              </span>
            )}
          </div>
          <p className={styles.application}>{content.application}</p>
          <div className={styles.material} data-page-enter="visual">
            <ShopMaterialImage
              src={content.materialImage}
              alt={content.materialImageAlt}
            />
          </div>
          <div className={styles.productBody}>
            <p className={styles.description} data-shop-description>
              {application ? t(application.usage) : content.purpose}
            </p>
            <div className={styles.clearFacts}>
              <span className={styles.factLabel}>{t("Format")}</span>
              <div className={styles.formatList} data-shop-formats>
                {refreshing
                  ? t("Updating prices…")
                  : offer.formats.length === 0
                    ? t("No published format")
                    : offer.formats.map((format) => (
                        <span key={format.id}>
                          {productFormatLabel(format, locale)}
                          {!format.available && (
                            <span className={styles.formatUnavailable}>
                              {" "}
                              · {t("Unavailable")}
                            </span>
                          )}
                        </span>
                      ))}
              </div>
              <span
                className={styles.price}
                data-shop-from-price
                aria-live="polite"
              >
                {refreshing
                  ? t("Updating prices…")
                  : offer.fromVariant
                    ? t("From {price}", {
                        price: money(
                          offer.fromVariant.priceMinor,
                          offer.fromVariant.currency,
                        ),
                      })
                    : offer.available
                      ? t("View pricing")
                      : t("Currently unavailable")}
              </span>
            </div>
            <span className={styles.viewProduct}>
              <ScrambleText
                text={t("View {name}", { name: content.name })}
                interactive
                animateOnMount={false}
                wrap
              />
              <span aria-hidden="true">↗</span>
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article
      className={styles.product}
      data-available={available}
      data-shop-product={product.id}
      hidden={hidden}
    >
      <Link
        className={styles.productLink}
        href={href}
        aria-label={t("View {name}", { name: content.name })}
        aria-describedby={displayIndex ? codeId : undefined}
      >
        <div className={styles.productTopline}>
          <span>{content.application}</span>
          <span className={styles.availability}>
            <span aria-hidden="true" />
            {available ? t("Available") : t("Unavailable")}
          </span>
        </div>
        <div className={styles.material}>
          <ShopMaterialImage
            src={content.materialImage}
            alt={content.materialImageAlt}
          />
        </div>
        <div className={styles.productBody}>
          <div className={styles.productIdentity}>
            <h2 data-shop-product-name>
              <ScrambleText
                text={content.name}
                interactive
                animateOnMount={false}
                wrap
              />
            </h2>
            {displayIndex && (
              <span
                className={styles.productCode}
                id={codeId}
                data-shop-product-code={displayIndex}
              >
                <span className={styles.srOnly}>{t("Product code")} </span>
                {displayIndex}
              </span>
            )}
          </div>
          <p className={styles.purpose}>{content.purpose}</p>
          <div className={styles.productFacts}>
            <span className={styles.price} data-shop-from-price>
              {fromVariant
                ? t("From {price}", {
                    price: money(fromVariant.priceMinor, fromVariant.currency),
                  })
                : available
                  ? t("View pricing")
                  : t("Currently unavailable")}
            </span>
            <span className={styles.formatCount}>
              {formatCount === 0
                ? t("No published format")
                : t(formatCount === 1 ? "{count} format" : "{count} formats", {
                    count: formatCount,
                  })}
            </span>
          </div>
          <span className={styles.viewProduct}>
            <ScrambleText
              text={t("View matcha")}
              interactive
              animateOnMount={false}
              wrap
            />{" "}
            <span aria-hidden="true">↗</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
