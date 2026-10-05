"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { getProductContent } from "@/lib/product-content";
import { CartButton, useCart } from "./cart-drawer";
import { ConceptProductDetails } from "./concept-product-details";
import { FocusedSpecifications } from "./focused-specifications";
import { ShopMaterialImage } from "./shop-material-image";
import { useProductSelection } from "./use-product-selection";
import styles from "./focused-index-concept.module.css";

type ProductView = "overview" | "specifications" | "shop";
type Story = "origins" | "people";

export function FocusedIndexConcept() {
  const selection = useProductSelection();
  const { busy } = useCart();
  const { product, catalog, loading } = selection;
  const content = getProductContent(product);
  const products = catalog?.products ?? [];
  const [view, setView] = useState<ProductView>("specifications");
  const [story, setStory] = useState<Story>("origins");
  const id = useId();
  const paneRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDialogElement>(null);
  const storyCloseRef = useRef<HTMLButtonElement>(null);
  const storyTriggerRef = useRef<HTMLButtonElement | null>(null);

  function changeView(next: ProductView) {
    if (busy) return;
    setView(next);
    requestAnimationFrame(() => {
      const target = next === "overview" ? visualRef.current : paneRef.current;
      target?.focus({ preventScroll: true });
    });
  }

  function openStory(next: Story, trigger: HTMLButtonElement) {
    if (busy) return;
    storyTriggerRef.current = trigger;
    setStory(next);
    if (!storyRef.current?.open) storyRef.current?.showModal();
    storyCloseRef.current?.focus({ preventScroll: true });
  }

  return (
    <main
      className={styles.page}
      data-concept="08-focus"
      data-tone="dark"
      data-focus-view={view}
    >
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="ATOMA home">
          ATOMA
        </Link>
        <span className={styles.headerTitle}>Material index</span>
        <nav className={styles.headerNav} aria-label="Collection information">
          <button
            type="button"
            disabled={busy}
            aria-haspopup="dialog"
            aria-controls={`${id}-story`}
            onClick={(event) => openStory("origins", event.currentTarget)}
          >
            Origins
          </button>
          <button
            type="button"
            disabled={busy}
            aria-haspopup="dialog"
            aria-controls={`${id}-story`}
            onClick={(event) => openStory("people", event.currentTarget)}
          >
            People
          </button>
          <CartButton tone="dark" className={styles.cart} />
        </nav>
      </header>

      <div className={styles.workspace}>
        <div className={styles.views} role="group" aria-label="Product view">
          {(["overview", "specifications", "shop"] as const).map((item) => (
            <button
              type="button"
              key={item}
              disabled={busy}
              aria-pressed={view === item}
              aria-controls={
                item === "overview" ? `${id}-visual` : `${id}-pane`
              }
              onClick={() => changeView(item)}
            >
              {item === "overview"
                ? "Overview"
                : item === "specifications"
                  ? "Specifications"
                  : "Shop"}
            </button>
          ))}
        </div>

        <section
          ref={visualRef}
          id={`${id}-visual`}
          className={styles.visual}
          aria-labelledby={`${id}-material`}
          tabIndex={-1}
        >
          <div className={styles.visualHeader}>
            <div>
              <span className={styles.eyebrow}>Selected material</span>
              <h1 id={`${id}-material`} data-selected-product>
                {product ? content.name : "Matcha"}
              </h1>
            </div>
            {product && (
              <span className={styles.application}>{content.application}</span>
            )}
          </div>
          <figure className={styles.specimen}>
            <div className={styles.field}>
              <span className={styles.aperture} aria-hidden="true" />
              <span className={styles.crosshair} aria-hidden="true" />
              {product ? (
                <div key={content.materialImage} className={styles.photograph}>
                  <ShopMaterialImage
                    src={content.materialImage}
                    alt={content.materialImageAlt}
                  />
                </div>
              ) : (
                <span className={styles.waiting}>
                  {loading ? "Loading the material…" : "Material not available"}
                </span>
              )}
            </div>
            <figcaption>
              <span>Powder specimen</span>
              <span>Illustrative material image</span>
            </figcaption>
          </figure>
          <div className={styles.mobileOverviewActions}>
            <button
              type="button"
              disabled={busy}
              onClick={() => changeView("specifications")}
            >
              Specifications <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => changeView("shop")}
            >
              Shop selection <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <div className={styles.selector}>
          <div className={styles.selectorHeading}>
            <span>Select matcha</span>
            <span>
              {loading ? "—" : String(products.length).padStart(2, "0")}
            </span>
          </div>
          <div
            className={styles.products}
            role="group"
            aria-label="Select matcha"
            aria-busy={loading}
          >
            {products.map((item, index) => {
              const itemContent = getProductContent(item);
              return (
                <button
                  type="button"
                  key={item.id}
                  disabled={busy}
                  data-concept-product={item.id}
                  aria-pressed={item.id === product?.id}
                  onClick={() => {
                    if (!busy) selection.selectProduct(item.id);
                  }}
                >
                  <span className={styles.productIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.productName}>{itemContent.name}</span>
                  <span className={styles.productUse}>
                    {itemContent.application}
                  </span>
                </button>
              );
            })}
          </div>
          {!products.length && (
            <div className={styles.catalogState} role="status">
              <span>
                {loading
                  ? "Loading the collection…"
                  : catalog?.status === "empty"
                    ? "No matcha is currently listed."
                    : "The collection could not be loaded."}
              </span>
              {!loading && catalog?.status !== "empty" && (
                <button type="button" onClick={selection.retry}>
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        <div
          ref={paneRef}
          id={`${id}-pane`}
          className={styles.pane}
          role="region"
          aria-label={
            view === "shop"
              ? "Shop selected matcha"
              : view === "overview"
                ? "Material overview"
                : "Specifications"
          }
          tabIndex={-1}
        >
          <div
            hidden={view !== "specifications"}
            data-focus-pane="specifications"
          >
            <FocusedSpecifications product={product} />
          </div>
          <div hidden={view !== "shop"} data-focus-pane="shop">
            <ConceptProductDetails
              selection={selection}
              tone="dark"
              view="shop"
              onExplore={() => changeView("overview")}
            />
          </div>
          <div hidden={view !== "overview"} data-focus-pane="overview">
            <div className={styles.overview}>
              <span className={styles.eyebrow}>Material / Overview</span>
              <h2>{product ? content.application : "Your selection"}</h2>
              <p>{content.materialSummary}</p>
              <p className={styles.disclosure}>
                Illustrative sensory notes. Explore all seven properties in
                Specifications.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => changeView("specifications")}
              >
                Explore specifications <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => changeView("shop")}
              >
                Shop selected matcha <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Link href="/concept-08">
          Scrolling version <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/homepage-study">
          Compare homepages <span aria-hidden="true">↗</span>
        </Link>
      </footer>

      <dialog
        ref={storyRef}
        id={`${id}-story`}
        className={styles.story}
        aria-labelledby={`${id}-story-title`}
        onClose={() => storyTriggerRef.current?.focus({ preventScroll: true })}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            storyCloseRef.current?.focus({ preventScroll: true });
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            storyRef.current?.close();
        }}
      >
        <div className={styles.storyHeader}>
          <span>
            {story === "origins" ? "Origin journal" : "People & practice"}
          </span>
          <button
            ref={storyCloseRef}
            type="button"
            onClick={() => storyRef.current?.close()}
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.storyBody}>
          <span className={styles.eyebrow}>Not yet published</span>
          <h2 id={`${id}-story-title`}>
            {story === "origins" ? "Origins" : "People"}
          </h2>
          <p>
            {story === "origins"
              ? "No product-linked origin records have been published for this collection."
              : "No producer profiles have been published for this collection."}
          </p>
        </div>
      </dialog>
    </main>
  );
}
