"use client";

import Image from "next/image";
import Link from "next/link";
import { getProductContent } from "@/lib/product-content";
import { CartButton } from "./cart-drawer";
import { ConceptProductDetails } from "./concept-product-details";
import { ConceptProvenance } from "./concept-provenance";
import { ShopMaterialImage } from "./shop-material-image";
import { useProductSelection } from "./use-product-selection";
import styles from "./product-folio-concept.module.css";

export function ProductFolioConcept() {
  const selection = useProductSelection();
  const { catalog, loading, product } = selection;
  const content = getProductContent(product);
  const selectedIndex = catalog?.products.findIndex(
    (item) => item.id === product?.id,
  );
  const selectedNumber = String((selectedIndex ?? 0) + 1).padStart(2, "0");

  return (
    <main className={styles.root} data-tone="light" data-concept="folio">
      <a className={styles.skip} href="#product">
        Skip to the matcha collection
      </a>
      <header className={styles.header}>
        <a
          className={styles.wordmark}
          href="#folio-top"
          aria-label="ATOMA, top"
        >
          ATOMA
        </a>
        <span className={styles.headerNote}>A study in matcha</span>
        <nav className={styles.navigation} aria-label="Page navigation">
          <a href="#product">Product</a>
          <a href="#specifications">Specifications</a>
          <a href="#shop">Shop</a>
          <a href="#origins">Origins</a>
          <a href="#people">People</a>
        </nav>
        <CartButton tone="light" className={styles.cart} />
      </header>

      <section
        className={styles.hero}
        id="folio-top"
        aria-labelledby="folio-title"
      >
        <div className={styles.heroIndex} aria-hidden="true">
          <span>00</span>
          <span>The material</span>
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>ATOMA / Product folio</p>
          <h1 id="folio-title">
            Carefully
            <br />
            specified
            <br />
            matcha.
          </h1>
          <div className={styles.heroActions}>
            <a className={styles.explore} href="#product">
              <span>Find your matcha</span>
              <span aria-hidden="true">↘</span>
            </a>
            <a className={styles.shopLink} href="#shop">
              Shop <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className={styles.tray}>
          <Image
            src="/images/hero/matcha-tray-concept-02.webp"
            alt="Finely milled green matcha powder spread across a silver tray."
            width={1536}
            height={1024}
            sizes="(max-width: 700px) 100vw, 78vw"
            preload
            draggable={false}
          />
        </div>
        <p className={styles.heroAnnotation}>
          Begin with the material.
          <br />
          Choose for the way you serve it.
        </p>
        <div className={styles.heroFoot}>
          <span>Matcha, in focus.</span>
          <a href="#product">
            Explore the collection <span aria-hidden="true">↓</span>
          </a>
          <span className={styles.folioMark}>Introduction</span>
        </div>
      </section>

      <section
        className={styles.collection}
        id="product"
        aria-label="Matcha collection"
        aria-busy={loading}
      >
        <div className={styles.chapter}>
          <span className={styles.chapterNumber} aria-hidden="true">
            01
          </span>
          <div>
            <p className={styles.eyebrow}>The collection</p>
            <h2>Start with your application.</h2>
          </div>
          <p className={styles.chapterNote}>
            Select a matcha to explore its material profile and available
            formats.
          </p>
        </div>

        {loading ? (
          <div className={styles.catalogState} role="status">
            <span className={styles.loadingLine} aria-hidden="true" />
            Loading the collection…
          </div>
        ) : !product ? (
          <div className={styles.catalogState} role="status">
            <p>
              {catalog?.status === "empty"
                ? "The collection is not published yet."
                : "The collection couldn’t be loaded."}
            </p>
            <button type="button" onClick={selection.retry}>
              Try again <span aria-hidden="true">↗</span>
            </button>
          </div>
        ) : (
          <div className={styles.collectionLayout}>
            <div className={styles.productIndex}>
              <p className={styles.indexHeading}>Select a matcha</p>
              <div
                className={styles.choices}
                role="group"
                aria-label="Choose matcha"
              >
                {catalog?.products.map((item, index) => {
                  const itemContent = getProductContent(item);
                  const selected = item.id === product.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.choice}
                      data-concept-product={item.id}
                      aria-label={`Select ${itemContent.name}`}
                      aria-pressed={selected}
                      onClick={() => selection.selectProduct(item.id)}
                    >
                      <span className={styles.choiceNumber} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.choiceText}>
                        <span>{itemContent.name}</span>
                        <span className={styles.choiceApplication}>
                          {itemContent.application}
                        </span>
                      </span>
                      <span className={styles.choiceArrow} aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className={styles.profileNote}>Sample material profiles.</p>
            </div>

            <div
              className={styles.materialSheet}
              data-selected-product={product.id}
            >
              <figure className={styles.materialFigure}>
                <div
                  className={styles.materialImage}
                  key={content.materialImage}
                >
                  <ShopMaterialImage
                    src={content.materialImage}
                    alt={content.materialImageAlt}
                  />
                </div>
                <figcaption className={styles.materialCaption}>
                  <span>{content.application}</span>
                  <span>Material / {selectedNumber}</span>
                </figcaption>
              </figure>
              <div className={styles.materialCopy} aria-live="polite">
                <p className={styles.eyebrow}>{content.name}</p>
                <h3>{content.purpose}</h3>
                <p className={styles.materialSummary}>
                  {content.materialSummary}
                </p>
                <div className={styles.materialActions}>
                  <a className={styles.detailsLink} href="#specifications">
                    View formats &amp; specifications
                    <span aria-hidden="true">↓</span>
                  </a>
                  <a className={styles.shopLink} href="#shop">
                    Shop selection <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        className={styles.specifications}
        id="specifications"
        aria-label="Specifications and purchase"
      >
        <div className={styles.chapter}>
          <span className={styles.chapterNumber} aria-hidden="true">
            02
          </span>
          <div>
            <p className={styles.eyebrow}>The particulars</p>
            <h2>From selection to serving.</h2>
          </div>
          <p className={styles.chapterNote}>
            Explore the profile. Choose your format and quantity.
          </p>
        </div>
        <div className={styles.details}>
          <ConceptProductDetails selection={selection} tone="light" />
        </div>
      </section>

      <div className={styles.provenance}>
        <ConceptProvenance variant="folio" />
      </div>

      <footer className={styles.footer}>
        <a
          className={styles.wordmark}
          href="#folio-top"
          aria-label="ATOMA, top"
        >
          ATOMA
        </a>
        <span>Product folio / Concept 09</span>
        <Link href="/homepage-study">Compare homepages ↗</Link>
        <a href="#folio-top">Back to top ↑</a>
      </footer>
    </main>
  );
}
