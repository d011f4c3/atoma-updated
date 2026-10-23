"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useRef, useState, type CSSProperties } from "react";
import {
  createWholesaleLibrary,
  searchWholesaleLibrary,
  type WholesaleLibraryEntry,
} from "@/lib/wholesale-library";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { FoilPouch } from "./sample-foil-trio";
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

const wholesaleReasons = [
  {
    title: "Selected for your menu",
    description:
      "Flavour, texture and application guide our selection, from tea service to lattes and recipes.",
  },
  {
    title: "Try it in your kitchen",
    description:
      "Taste all three matchas in the Sample Set and compare them in your own drinks and dishes.",
  },
  {
    title: "Know your matcha",
    description:
      "Clear tasting profiles, preparation guidance and origin notes help you choose with confidence.",
  },
] as const;

export function NewWholesale() {
  const { t, locale } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const cart = useCart();
  const { surfaceSelections, rememberJourney } = useHomepageJourney();
  const model = useProductSelection();
  const productDialog = useWholesaleDialog();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const imageMode = params.get("image") === "powder" ? "powder" : "application";
  const [searchOpen, setSearchOpen] = useState(false);
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

  function updateLibraryParam(key: "q" | "image", value: string) {
    if (cart.navigationBusy) return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(
      window.history.state?.atomaWholesaleDialog
        ? { atomaWholesaleDialog: window.history.state.atomaWholesaleDialog }
        : null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function updateSearch(value: string) {
    updateLibraryParam("q", value);
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
    return `/wholesale?${next.toString()}`;
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
        <header className={styles.introduction}>
          <div>
            <p className={styles.eyebrow} data-page-enter="text">
              {t("Wholesale")}
            </p>
            <h1
              ref={heading}
              tabIndex={-1}
              data-wholesale-collection-heading
              data-page-enter="hero"
            >
              <ScrambleText text={t("Matcha for your menu.")} wrap />
            </h1>
            <p className={styles.introCopy} data-page-enter="text">
              {t("For lattes, tea service and recipes.")}
            </p>
          </div>
          <Link
            className={styles.samples}
            href="/samples"
            data-page-enter="text"
            data-page-motion="composed"
            aria-disabled={cart.navigationBusy || undefined}
            onClick={(event) => {
              if (cart.navigationBusy) event.preventDefault();
            }}
            onNavigate={(event) => {
              if (cart.navigationBusy) event.preventDefault();
            }}
          >
            <span className={styles.sampleImage} aria-hidden="true">
              {SAMPLE_SET_CONTENTS.map((item) => (
                <span key={item.key}>
                  <FoilPouch item={item} />
                </span>
              ))}
            </span>
            <span className={styles.sampleCopy}>
              <span className={styles.sampleTitle}>
                {t("Find your matcha.")}
              </span>
              <span className={styles.sampleSize}>
                {t("Three matcha · 20 g each")}
              </span>
              <span className={styles.sampleAction}>
                {t("Try the Sample Set")} <span aria-hidden="true">↗</span>
              </span>
            </span>
          </Link>
        </header>

        {/* A permanent library toolbar. Verified future facets can join search
            here without changing product identity, layout or purchase state. */}
        <div
          className={styles.toolbar}
          data-wholesale-library-tools
          data-page-enter="text"
          data-page-motion="composed"
        >
          <h2>
            {t("The collection")} <span aria-hidden="true">/</span>{" "}
            <span data-wholesale-count aria-live="polite">
              {model.loading ? "—" : String(results.length).padStart(2, "0")}
            </span>
          </h2>
          <div
            className={styles.imageModes}
            role="group"
            aria-label={t("Product imagery")}
            data-wholesale-image-toggle
          >
            {(["application", "powder"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={imageMode === mode}
                disabled={cart.navigationBusy}
                data-wholesale-image-mode={mode}
                onClick={() =>
                  updateLibraryParam("image", mode === "powder" ? mode : "")
                }
              >
                {t(mode === "application" ? "Application" : "Powder")}
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
              placeholder={t("Search matcha")}
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
                  const blocked = cart.navigationBusy || !entry.href;
                  return (
                    <article
                      key={`${entry.product.id}-${index}`}
                      className={styles.product}
                      hidden={!visibleEntries.has(entry)}
                      data-wholesale-product={entry.product.handle}
                      data-known={Boolean(entry.productKey) || undefined}
                      data-page-reveal="rise"
                      data-page-reveal-initial
                      data-page-motion="composed"
                      onFocusCapture={(event) => {
                        event.currentTarget
                          .querySelector("[data-wholesale-image-motion]")
                          ?.setAttribute("data-wholesale-image-settled", "");
                      }}
                      style={
                        {
                          "--page-reveal-delay": `${(index % 3) * 100}ms`,
                        } as CSSProperties
                      }
                    >
                      <div className={styles.visual}>
                        <div className={styles.productCaption}>
                          <span>{entry.application}</span>
                          {entry.code && (
                            <span className={styles.code}>◇ {entry.code}</span>
                          )}
                        </div>
                        <Link
                          href={entry.href ?? "#"}
                          className={styles.material}
                          data-wholesale-image={
                            entry.productKey ? imageMode : "material"
                          }
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
                          <div
                            key={entry.productKey ? imageMode : "material"}
                            className={styles.productImage}
                            data-wholesale-image-motion
                            onAnimationEnd={(event) => {
                              if (event.target === event.currentTarget)
                                event.currentTarget.setAttribute(
                                  "data-wholesale-image-settled",
                                  "",
                                );
                            }}
                          >
                            {entry.productKey && imageMode === "application" ? (
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
                          </div>
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
                            <span aria-hidden="true">+</span>
                          </Link>
                        )}
                      </div>
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
                      </header>
                      {entry.flavour && (
                        <p className={styles.flavour}>{entry.flavour}</p>
                      )}
                      <div
                        className={styles.purchaseRegion}
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

        <section
          className={styles.why}
          aria-labelledby={`${searchId}-why`}
          data-wholesale-why
        >
          <div
            className={styles.whyIntroduction}
            data-page-reveal="rise"
            data-page-reveal-initial
          >
            <h2 id={`${searchId}-why`}>{t("Why ATOMA")}</h2>
            <p>{t("Japanese matcha, selected for the way you work.")}</p>
          </div>
          <div className={styles.whyReasons}>
            {wholesaleReasons.map((reason, index) => (
              <div
                key={reason.title}
                className={styles.whyReason}
                data-wholesale-why-reason
                data-page-reveal="rise"
                data-page-reveal-initial
                style={
                  { "--page-reveal-delay": `${index * 100}ms` } as CSSProperties
                }
              >
                <h3>{t(reason.title)}</h3>
                <p>{t(reason.description)}</p>
              </div>
            ))}
          </div>
          <Link
            href="/samples"
            className={styles.whyAction}
            data-wholesale-why-action
            data-page-reveal="rise"
            data-page-reveal-initial
            data-page-motion="composed"
            aria-disabled={cart.navigationBusy || undefined}
            onClick={(event) => {
              if (cart.navigationBusy) event.preventDefault();
            }}
            onNavigate={(event) => {
              if (cart.navigationBusy) event.preventDefault();
            }}
          >
            {t("Try the Sample Set")}
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
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
