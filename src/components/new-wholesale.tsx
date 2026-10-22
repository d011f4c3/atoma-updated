"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import {
  createWholesaleLibrary,
  searchWholesaleLibrary,
  type WholesaleLibraryEntry,
} from "@/lib/wholesale-library";
import { money } from "@/lib/product-selection";
import { useCart } from "./cart-drawer";
import { useHomepageJourney } from "./homepage-journey-provider";
import { HomeHeader } from "./home-header";
import { ProductApplicationCutout } from "./product-application-cutout";
import { ShopMaterialImage } from "./shop-material-image";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useProductSelection } from "./use-product-selection";
import { usePageReveals } from "./use-page-reveals";
import { NewWholesaleDialog, useWholesaleDialog } from "./new-wholesale-dialog";
import {
  NewWholesalePurchase,
  NewWholesalePurchaseProvider,
} from "./new-wholesale-purchase";
import revealStyles from "./page-reveals.module.css";
import styles from "./new-wholesale.module.css";

export function NewWholesale() {
  const { t, locale } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const cart = useCart();
  const { surfaceSelections, rememberJourney } = useHomepageJourney();
  const model = useProductSelection();
  const productDialog = useWholesaleDialog();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [imagery, setImagery] = useState<"material" | "application">(
    "material",
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const searchToggle = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  usePageReveals(pageRef, !model.loading);
  const library = createWholesaleLibrary(model.products, locale);
  const results = searchWholesaleLibrary(library, query);
  const visibleEntries = new Set(results);
  const ready = model.catalog?.status === "ready";
  const pricesReady =
    ready &&
    !model.loading &&
    !model.refreshing &&
    !cart.destinationReviewRequired &&
    !cart.reviewRequired;
  const searchVisible = searchOpen || Boolean(query);

  function updateSearch(value: string) {
    if (cart.navigationBusy) return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    window.history.replaceState(
      window.history.state?.atomaWholesaleDialog
        ? { atomaWholesaleDialog: window.history.state.atomaWholesaleDialog }
        : null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function clearSearch() {
    setSearchOpen(true);
    updateSearch("");
    requestAnimationFrame(() => searchInput.current?.focus());
  }

  function quickViewHref(entry: WholesaleLibraryEntry) {
    if (!entry.productKey) return entry.href ?? "#";
    const next = new URLSearchParams(params.toString());
    next.set("matcha", entry.productKey);
    return `/new-wholesale?${next.toString()}`;
  }

  function rememberProduct(entry: WholesaleLibraryEntry) {
    const selection =
      surfaceSelections["new-wholesale"]?.[entry.product.handle];
    if (selection) rememberJourney({ selection });
  }

  return (
    <main
      ref={pageRef}
      className={`${styles.page} ${revealStyles.scope}`}
      data-new-wholesale
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <HomeHeader persistentTheme tone={tone} activePage="shop" />
      <div className={styles.content}>
        <header className={styles.introduction} data-page-enter="text">
          <div>
            <p className={styles.eyebrow}>{t("Wholesale")}</p>
            <h1 ref={heading} tabIndex={-1} data-wholesale-collection-heading>
              <ScrambleText text={t("Matcha for your menu.")} wrap />
            </h1>
          </div>
          <p className={styles.introCopy}>
            {t(
              "A clear view of the matcha. A considered choice for what you make.",
            )}
          </p>
        </header>

        {/* A permanent library toolbar. Verified future facets can join search
            here without changing product identity, layout or purchase state. */}
        <div className={styles.toolbar} data-wholesale-library-tools>
          <h2>
            {t("The collection")} <span aria-hidden="true">/</span>{" "}
            <span data-wholesale-count aria-live="polite">
              {model.loading ? "—" : String(results.length).padStart(2, "0")}
            </span>
          </h2>
          <div
            className={styles.viewControls}
            aria-label={t("Product imagery")}
          >
            {(["material", "application"] as const).map((view) => (
              <button
                type="button"
                key={view}
                aria-pressed={imagery === view}
                disabled={cart.navigationBusy}
                data-wholesale-imagery={view}
                onClick={() => setImagery(view)}
              >
                {t(view === "material" ? "Matcha" : "In use")}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.searchToggle}
            ref={searchToggle}
            aria-expanded={searchVisible}
            aria-controls={searchId}
            disabled={cart.navigationBusy}
            data-wholesale-search-toggle
            onClick={() => {
              if (searchVisible) {
                updateSearch("");
                setSearchOpen(false);
              } else {
                setSearchOpen(true);
                requestAnimationFrame(() => searchInput.current?.focus());
              }
            }}
          >
            <SearchIcon />
            <span>{t("Search")}</span>
          </button>
          <form
            role="search"
            id={searchId}
            className={styles.search}
            data-open={searchVisible || undefined}
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor={`${searchId}-input`}>
              <SearchIcon />
              <span className={styles.srOnly}>{t("Search matcha")}</span>
            </label>
            <input
              ref={searchInput}
              id={`${searchId}-input`}
              data-wholesale-search
              type="search"
              value={query}
              placeholder={t("Name, code or application")}
              autoComplete="off"
              disabled={cart.navigationBusy}
              onChange={(event) => updateSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                if (query) clearSearch();
                else if (searchToggle.current?.getClientRects().length) {
                  setSearchOpen(false);
                  searchToggle.current.focus();
                }
              }}
            />
            {query && (
              <button
                type="button"
                data-wholesale-clear-search
                aria-label={t("Clear search")}
                disabled={cart.navigationBusy}
                onClick={clearSearch}
              >
                ×
              </button>
            )}
          </form>
        </div>

        {model.loading ? (
          <div
            className={styles.state}
            role="status"
            data-wholesale-status="loading"
          >
            <p>{t("Loading the collection…")}</p>
          </div>
        ) : !ready ? (
          <div
            className={styles.state}
            role="status"
            data-wholesale-status={
              model.catalog?.status === "empty" ? "empty" : "error"
            }
          >
            <p>
              {t(
                model.catalog?.status === "empty"
                  ? "The collection is being prepared."
                  : "The collection couldn’t be loaded. Please try again.",
              )}
            </p>
            <button
              type="button"
              disabled={cart.navigationBusy}
              onClick={() => {
                heading.current?.focus();
                model.retry();
              }}
            >
              {t("Try again")} <span aria-hidden="true">↗</span>
            </button>
          </div>
        ) : (
          <>
            <NewWholesalePurchaseProvider>
              <div
                className={styles.collection}
                data-wholesale-collection
                data-large-library={library.length > 3 || undefined}
              >
                {library.map((entry, index) => {
                  const variant = entry.offer?.fromVariant;
                  const format =
                    variant?.title === "Default Title"
                      ? t("Standard")
                      : variant?.title;
                  const price = !pricesReady
                    ? t("Updating prices…")
                    : variant
                      ? money(variant.priceMinor, variant.currency)
                      : t("Currently unavailable");
                  const blocked = cart.navigationBusy || !entry.href;
                  const expanded = openOrder === entry.product.handle;
                  const purchaseId = `${searchId}-order-${index}`;
                  return (
                    <article
                      key={`${entry.product.id}-${index}`}
                      className={styles.product}
                      hidden={!visibleEntries.has(entry)}
                      data-wholesale-product={entry.product.handle}
                      data-known={Boolean(entry.productKey) || undefined}
                      data-order-open={expanded || undefined}
                    >
                      <div className={styles.productIdentity}>
                        <Link
                          href={entry.href ?? "#"}
                          className={styles.material}
                          data-wholesale-image={imagery}
                          data-wholesale-direct-link="image"
                          aria-label={t("View {name}", { name: entry.name })}
                          aria-disabled={blocked || undefined}
                          onClick={(event) => {
                            if (blocked) event.preventDefault();
                          }}
                          onNavigate={(event) => {
                            if (blocked) event.preventDefault();
                            else rememberProduct(entry);
                          }}
                        >
                          {imagery === "application" && entry.productKey ? (
                            <ProductApplicationCutout
                              productKey={entry.productKey}
                            />
                          ) : entry.materialImage ? (
                            <div
                              className={styles.powder}
                              data-known={
                                Boolean(entry.productKey) || undefined
                              }
                            >
                              <ShopMaterialImage
                                src={entry.materialImage}
                                alt={entry.materialAlt}
                              />
                            </div>
                          ) : (
                            <span className={styles.materialFallback}>
                              {entry.code ?? t("Matcha")}
                            </span>
                          )}
                        </Link>
                        <header className={styles.identity}>
                          <h3>
                            <Link
                              href={entry.href ?? "#"}
                              data-wholesale-direct-link="name"
                              aria-disabled={blocked || undefined}
                              onClick={(event) => {
                                if (blocked) event.preventDefault();
                              }}
                              onNavigate={(event) => {
                                if (blocked) event.preventDefault();
                                else rememberProduct(entry);
                              }}
                            >
                              {entry.name}
                            </Link>
                          </h3>
                          {entry.code && (
                            <p className={styles.code}>◇ {entry.code}</p>
                          )}
                        </header>
                      </div>
                      <div className={styles.profile}>
                        {entry.application && (
                          <p className={styles.application}>
                            {entry.application}
                          </p>
                        )}
                        {entry.flavour && (
                          <p className={styles.flavour}>{entry.flavour}</p>
                        )}
                        {entry.origin && (
                          <p className={styles.origin}>
                            <span>{entry.origin.label}</span>{" "}
                            {entry.origin.value}
                          </p>
                        )}
                      </div>
                      <div className={styles.productActions}>
                        <Link
                          href={entry.href ?? "#"}
                          className={styles.details}
                          data-wholesale-direct-link="details"
                          aria-label={t("View {name}", { name: entry.name })}
                          aria-disabled={blocked || undefined}
                          onClick={(event) => {
                            if (blocked) event.preventDefault();
                          }}
                          onNavigate={(event) => {
                            if (blocked) event.preventDefault();
                            else rememberProduct(entry);
                          }}
                        >
                          <span>{t("View matcha")}</span>
                          <span aria-hidden="true">↗</span>
                        </Link>
                        {entry.productKey && (
                          <Link
                            href={quickViewHref(entry)}
                            className={styles.quickView}
                            aria-label={`${t("Quick view")} · ${entry.name}`}
                            aria-disabled={blocked || undefined}
                            aria-haspopup={
                              entry.productKey ? "dialog" : undefined
                            }
                            data-wholesale-product-trigger={entry.productKey}
                            onClick={(event) => {
                              if (blocked) {
                                event.preventDefault();
                                return;
                              }
                              if (
                                entry.productKey &&
                                !event.metaKey &&
                                !event.ctrlKey &&
                                !event.shiftKey &&
                                !event.altKey &&
                                event.button === 0
                              ) {
                                event.preventDefault();
                                productDialog.openProduct(
                                  entry.productKey,
                                  event.currentTarget,
                                );
                              }
                            }}
                            onNavigate={(event) => {
                              if (blocked) event.preventDefault();
                            }}
                          >
                            <span>{t("Quick view")}</span>{" "}
                            <span aria-hidden="true">+</span>
                          </Link>
                        )}
                      </div>
                      <div className={styles.mobileOrder}>
                        <div className={styles.price} data-wholesale-price>
                          <span>
                            {entry.offer?.available &&
                            entry.product.variants.length > 1
                              ? `${t("From")} `
                              : ""}
                            {price}
                          </span>
                          {pricesReady && variant && (
                            <span className={styles.format}>
                              {t("Per {format}", {
                                format: format ?? t("Standard"),
                              })}
                            </span>
                          )}
                        </div>
                        {entry.status === "ready" && (
                          <button
                            type="button"
                            className={styles.orderToggle}
                            data-wholesale-order-toggle
                            aria-expanded={expanded}
                            aria-controls={purchaseId}
                            disabled={cart.navigationBusy}
                            onClick={() =>
                              setOpenOrder(
                                expanded ? null : entry.product.handle,
                              )
                            }
                          >
                            {t("Order")}{" "}
                            <span aria-hidden="true">
                              {expanded ? "−" : "+"}
                            </span>
                          </button>
                        )}
                      </div>
                      <div
                        className={styles.purchaseRegion}
                        id={purchaseId}
                        data-wholesale-purchase-region
                      >
                        {entry.status === "ready" ? (
                          <NewWholesalePurchase
                            product={entry.product}
                            pricesReady={pricesReady}
                            refreshing={model.refreshing}
                          />
                        ) : (
                          <p>{t("Currently unavailable")}</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </NewWholesalePurchaseProvider>
            {!results.length && (
              <div
                className={styles.state}
                role="status"
                data-wholesale-status="no-results"
              >
                <p>{t("No matcha found.")}</p>
                <button
                  type="button"
                  data-wholesale-clear-search
                  disabled={cart.navigationBusy}
                  onClick={clearSearch}
                >
                  {t("Clear search")} <span aria-hidden="true">↗</span>
                </button>
              </div>
            )}
          </>
        )}

        <Link
          className={styles.samples}
          href="/samples"
          aria-disabled={cart.navigationBusy || undefined}
          onClick={(event) => {
            if (cart.navigationBusy) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (cart.navigationBusy) event.preventDefault();
          }}
        >
          <div>
            <span className={styles.eyebrow}>{t("The Sample Set")}</span>
            <span className={styles.sampleTitle}>
              {t("Find your matcha. Try all three.")}
            </span>
          </div>
          <span className={styles.sampleSize}>
            {t("Three matcha · 20 g each")}
          </span>
          <span className={styles.sampleAction}>
            {t("Explore the set")} <span aria-hidden="true">↗</span>
          </span>
        </Link>
      </div>
      <NewWholesaleDialog controller={productDialog} />
    </main>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
