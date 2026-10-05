"use client";

import Link from "next/link";
import { getProductContent } from "@/lib/product-content";
import { CartButton } from "./cart-drawer";
import { ConceptProductDetails } from "./concept-product-details";
import { ConceptProvenance } from "./concept-provenance";
import { ShopMaterialImage } from "./shop-material-image";
import { useProductSelection } from "./use-product-selection";
import styles from "./material-index-concept.module.css";

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={down ? styles.downArrow : styles.arrow}
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function MaterialIndexConcept() {
  const selection = useProductSelection();
  const {
    catalog,
    loading,
    product,
    variant,
    priceLabel,
    selectProduct,
    retry,
  } = selection;
  const content = getProductContent(product);
  const products = catalog?.products ?? [];
  const position = products.findIndex((item) => item.id === product?.id);
  const unavailable = catalog?.status === "unavailable";

  return (
    <main className={styles.page} data-concept="08" data-tone="dark">
      <a className={styles.skip} href="#product">
        Skip to product
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="ATOMA home">
          ATOMA
        </Link>
        <nav className={styles.navigation} aria-label="Page navigation">
          <a href="#product">Product</a>
          <a href="#specifications">Specifications</a>
          <a href="#shop">Shop</a>
          <a href="#origins">Origins</a>
          <a href="#people">People</a>
        </nav>
        <CartButton tone="dark" className={styles.cart} />
      </header>

      <section
        id="product"
        className={styles.hero}
        aria-labelledby="index-title"
      >
        <div className={styles.masthead}>
          <div>
            <span className={styles.eyebrow}>Product / Material index</span>
            <h1 id="index-title">Matcha, specified by use.</h1>
          </div>
          <p>
            Begin with the material.
            <br />
            Choose it for the way you serve.
          </p>
        </div>

        <div className={styles.workbench}>
          <div className={styles.selectionRail}>
            <div className={styles.railHeading}>
              <span>Selection</span>
              <span aria-label={`${products.length} materials`}>
                {loading ? "—" : String(products.length).padStart(2, "0")}
              </span>
            </div>
            <div
              className={styles.materials}
              role="group"
              aria-label="Select matcha"
              aria-busy={loading}
            >
              {products.map((item, index) => {
                const itemContent = getProductContent(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.material}
                    data-concept-product={item.id}
                    aria-pressed={item.id === product?.id}
                    onClick={() => selectProduct(item.id)}
                  >
                    <span className={styles.materialNumber} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.materialName}>
                      {itemContent.name}
                    </span>
                    <span className={styles.materialUse}>
                      {itemContent.application}
                    </span>
                    <span className={styles.selectionMark} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            {!products.length && (
              <div className={styles.catalogState} role="status">
                <p>
                  {loading
                    ? "Loading the selection…"
                    : unavailable
                      ? "The selection could not be loaded."
                      : "No matcha is currently listed."}
                </p>
                {unavailable && !loading && (
                  <button type="button" onClick={retry}>
                    Try again <span aria-hidden="true">↗</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <figure className={styles.specimen}>
            <div className={styles.specimenHeader} aria-hidden="true">
              <span>Powder specimen</span>
              <span>
                {position < 0 ? "—" : String(position + 1).padStart(2, "0")}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.axisHorizontal} aria-hidden="true" />
              <span className={styles.axisVertical} aria-hidden="true" />
              <span className={styles.aperture} aria-hidden="true" />
              <span className={styles.registration} aria-hidden="true" />
              {product ? (
                <div className={styles.photograph} key={content.materialImage}>
                  <ShopMaterialImage
                    src={content.materialImage}
                    alt={content.materialImageAlt}
                  />
                </div>
              ) : (
                <span className={styles.waiting}>
                  {loading ? "Loading material" : "Material not available"}
                </span>
              )}
            </div>
            <figcaption>
              <span>{product ? content.application : "Matcha"}</span>
              <span>Illustrative material image</span>
            </figcaption>
          </figure>

          <div className={styles.selected}>
            <div className={styles.selectedCopy}>
              <span className={styles.eyebrow}>Selected matcha</span>
              <h2 data-selected-product>
                {product ? content.name : "Your selection"}
              </h2>
              {product && (
                <dl className={styles.selectionFacts}>
                  <div>
                    <dt>Application</dt>
                    <dd>{content.application}</dd>
                  </div>
                  {variant && (
                    <div>
                      <dt>Format</dt>
                      <dd>{variant.title}</dd>
                    </div>
                  )}
                  {priceLabel && (
                    <div className={styles.total}>
                      <dt>Selection total</dt>
                      <dd>{priceLabel}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
            <div className={styles.actions}>
              <a className={styles.explore} href="#specifications">
                <span>Explore specifications</span>
                <Arrow down />
              </a>
              <a className={styles.shop} href="#shop">
                <span>Shop selected matcha</span>
                <Arrow />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.heroFooter}>
          <span>Choose the material. Refine the serving.</span>
          <a href="#specifications">
            Specifications &amp; selection <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section
        id="specifications"
        className={styles.specifications}
        aria-label="Specifications and shop"
      >
        <ConceptProductDetails selection={selection} tone="dark" />
      </section>
      <div className={styles.provenance}>
        <ConceptProvenance variant="index" />
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>ATOMA</span>
        <Link href="/homepage-study">
          Compare homepages <span aria-hidden="true">↗</span>
        </Link>
        <a href="#product">
          Back to product <span aria-hidden="true">↑</span>
        </a>
      </footer>
    </main>
  );
}
