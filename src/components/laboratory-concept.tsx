"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import mobileHeroSource from "../../public/images/concept-04/laboratory-matcha-mobile.png";
import { getProductContent } from "@/lib/product-content";
import { CartButton, useCart } from "./cart-drawer";
import { ScrambleText } from "./scramble-text";
import { ShopMaterialImage } from "./shop-material-image";
import { LaboratoryCollection } from "./laboratory-collection";
import { LaboratoryDetails } from "./laboratory-details";
import { useProductSelection } from "./use-product-selection";
import styles from "./laboratory-concept.module.css";

const heroImage = {
  alt: "An illustrative aluminum case containing a matcha bowl, whisk, scoop and canister, arranged on a cool grey work surface.",
  fill: true,
  sizes: "100vw",
  loading: "eager" as const,
  fetchPriority: "high" as const,
};
const { props: desktopHero } = getImageProps({
  ...heroImage,
  src: "/images/concept-04/laboratory-matcha-hero.png",
});
const { props: mobileHero } = getImageProps({
  ...heroImage,
  src: mobileHeroSource,
});
type View = "experience" | "specifications" | "origins" | "shop";
const views: View[] = ["experience", "specifications", "origins", "shop"];

export function LaboratoryConcept() {
  const selection = useProductSelection();
  const { product, catalog, loading } = selection;
  const products = catalog?.status === "ready" ? catalog.products : [];
  const content = getProductContent(product);
  const { busy } = useCart();
  const [pending, setPending] = useState(false);
  const [view, setView] = useState<View>("experience");
  const [material, setMaterial] = useState(false);
  const pane = useRef<HTMLDivElement>(null);
  const id = useId();
  const locked = pending || busy;
  const selectedIndex = products.findIndex((item) => item.id === product?.id);

  function changeView(next: View) {
    if (locked) return;
    if (next !== "experience") setMaterial(true);
    setView(next);
    requestAnimationFrame(() => pane.current?.focus({ preventScroll: true }));
  }

  return (
    <main
      className={styles.page}
      data-tone="light"
      data-concept="04"
      data-view={view}
      data-material={material}
    >
      <a className={styles.skip} href={`#${id}-selection`}>
        Skip to matcha selection
      </a>
      <div className={styles.photograph} aria-hidden={material}>
        <picture>
          <source
            media="(max-width: 700px), (max-width: 1000px) and (orientation: portrait)"
            srcSet={mobileHero.srcSet}
            sizes={mobileHero.sizes}
          />
          <img
            {...desktopHero}
            alt={desktopHero.alt}
            className={styles.heroImage}
          />
        </picture>
      </div>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="ATOMA home">
          ATOMA<span aria-hidden="true">+</span>
        </Link>
        <nav className={styles.navigation} aria-label="Explore selected matcha">
          {views.map((item) => (
            <button
              key={item}
              type="button"
              disabled={locked}
              aria-pressed={view === item}
              aria-controls={`${id}-pane`}
              onClick={() => changeView(item)}
            >
              <ScrambleText text={item} interactive />
            </button>
          ))}
        </nav>
        <CartButton tone="light" className={styles.cart} />
      </header>

      <div className={styles.workspace}>
        <div className={styles.meta} aria-hidden="true">
          <span>
            <ScrambleText text="MATERIAL / MATCHA" periodic />
          </span>
          <span>
            {product
              ? `${String(selectedIndex + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}`
              : "—"}
          </span>
        </div>
        {material && product && (
          <figure className={styles.materialStage}>
            <div className={styles.materialCaption}>
              <span>{content.name}</span>
              <span>{content.application}</span>
            </div>
            <div className={styles.powder} key={product.id}>
              <ShopMaterialImage
                src={content.materialImage}
                alt={content.materialImageAlt}
              />
            </div>
            <figcaption>
              <span>Matcha powder</span>
              <span className={styles.cross} aria-hidden="true" />
            </figcaption>
          </figure>
        )}
        <div
          className={styles.pane}
          id={`${id}-pane`}
          ref={pane}
          tabIndex={-1}
          role="region"
          aria-label={`${view} / ${product ? content.name : "Matcha"}`}
        >
          <div hidden={view !== "experience"} className={styles.introduction}>
            <p className={styles.eyebrow}>
              <span className={styles.cross} aria-hidden="true" />
              Material, precisely.
            </p>
            <h1>{product ? content.name : "A closer look at matcha."}</h1>
            <p className={styles.introCopy}>
              {product
                ? content.application
                : "Matcha. From powder to preparation."}
            </p>
            <button
              className={styles.entry}
              type="button"
              disabled={locked || !product}
              onClick={() => changeView("shop")}
            >
              <ScrambleText text="SHOP THIS MATCHA" interactive />
              <span aria-hidden="true">↗</span>
            </button>
            <button
              className={styles.secondary}
              type="button"
              disabled={locked || !product}
              onClick={() => changeView("specifications")}
            >
              Explore specifications <span aria-hidden="true">+</span>
            </button>
          </div>
          <div hidden={view !== "shop"}>
            <LaboratoryCollection
              selection={selection}
              onPendingChange={setPending}
            />
          </div>
          <div hidden={view !== "specifications"}>
            {product && (
              <LaboratoryDetails
                key={`${product.id}-specifications`}
                content={content}
                view="specifications"
              />
            )}
          </div>
          <div hidden={view !== "origins"}>
            {product && (
              <LaboratoryDetails
                key={`${product.id}-origins`}
                content={content}
                view="origins"
              />
            )}
          </div>
          {!product && (
            <div className={styles.state} role="status">
              <p>
                {loading
                  ? "Opening the selection…"
                  : catalog?.status === "empty"
                    ? "The next selection is taking shape."
                    : "The selection couldn’t be loaded."}
              </p>
              {!loading && catalog?.status !== "empty" && (
                <button type="button" onClick={selection.retry}>
                  Try again ↻
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <section
        className={styles.selector}
        id={`${id}-selection`}
        tabIndex={-1}
        aria-label="Matcha selection"
      >
        <div className={styles.selectorLabel}>
          <span>Select your matcha</span>
          <span aria-hidden="true">↓</span>
        </div>
        <div
          className={styles.products}
          role="group"
          aria-label="Choose matcha"
          aria-busy={loading}
        >
          {products.map((item, index) => {
            const itemContent = getProductContent(item);
            const available = item.variants.some((option) => option.available);
            return (
              <button
                type="button"
                key={item.id}
                disabled={locked}
                aria-label={`Select ${itemContent.name}`}
                aria-pressed={item.id === product?.id}
                onClick={() => {
                  if (!locked && item.id !== product?.id) {
                    selection.selectProduct(item.id);
                    setMaterial(true);
                  }
                }}
              >
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.productCopy}>
                  <strong>{itemContent.name}</strong>
                  <small>
                    {available
                      ? itemContent.application
                      : "Currently unavailable"}
                  </small>
                </span>
                <span className={styles.selectionMark} aria-hidden="true">
                  {item.id === product?.id ? "●" : "○"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className={styles.footer}>
        <span>ATOMA / MATCHA</span>
        <span>POWDER. FORM. PREPARATION.</span>
        <span>CONCEPT 04</span>
      </footer>
    </main>
  );
}
