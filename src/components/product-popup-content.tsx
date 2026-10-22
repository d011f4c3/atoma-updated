"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import type { ProductContent } from "@/lib/product-content";
import type { SampleSetContent } from "@/lib/sample-set";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { ProductApplicationCutout } from "./product-application-cutout";
import { ShopMaterialImage } from "./shop-material-image";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./product-popup-content.module.css";

/** A product folio with a quiet reading pane and its own purchase area. */
export function ProductPopupContent({
  identity,
  content,
  headingId,
  purchase,
}: {
  identity: SampleSetContent;
  content: ProductContent;
  headingId: string;
  purchase: ReactNode;
}) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const [image, setImage] = useState<"application" | "matcha">("application");
  const [view, setView] = useState<"overview" | "preparation">("overview");
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const application = getProductApplicationImage(
    identity.productHandle,
    "canonical",
  );
  const flavour = content.materialProfile[1];
  const supporting = content.materialProfile.filter((_, index) => index !== 1);

  return (
    <div className={styles.body}>
      <div className={styles.reader} data-product-popup-reading>
        <div
          className={styles.media}
          data-new-hero-product-information
          data-popup-image={image}
        >
          <div className={styles.application} hidden={image !== "application"}>
            <ProductApplicationCutout productKey={identity.key} />
          </div>
          <figure
            className={styles.swatch}
            data-new-hero-product-swatch
            hidden={image !== "matcha"}
          >
            <ShopMaterialImage
              src={identity.image}
              alt={t(identity.imageAlt)}
            />
          </figure>
          <div className={styles.mediaControls} aria-label={t("The matcha")}>
            {(["application", "matcha"] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={image === choice}
                data-popup-image-choice={choice}
                onClick={() => setImage(choice)}
              >
                <ScrambleText
                  text={t(choice === "application" ? "Application" : "Matcha")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </button>
            ))}
          </div>
        </div>
        <div className={styles.content} data-product-popup-detail-scroll>
          <header className={styles.identity}>
            <p className={styles.code} data-new-hero-product-code>
              ◇ {identity.productCode}
            </p>
            <h2 id={headingId} data-new-hero-product-name>
              {t(identity.name)}
            </h2>
            {application && (
              <p className={styles.usage} data-new-hero-product-overview>
                {t(application.usage)}
              </p>
            )}
          </header>
          <div className={styles.reading} data-new-hero-product-reading>
            <div
              className={styles.tabs}
              role="tablist"
              aria-label={t("Product details")}
            >
              {(["overview", "preparation"] as const).map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`${id}-${tab}-tab`}
                  aria-selected={view === tab}
                  aria-controls={`${id}-${tab}`}
                  tabIndex={view === tab ? 0 : -1}
                  ref={(node) => {
                    tabs.current[index] = node;
                  }}
                  data-popup-info-tab={tab}
                  onClick={() => setView(tab)}
                  onKeyDown={(event) => {
                    if (
                      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    )
                      return;
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 1
                          : 1 - index;
                    setView(next === 0 ? "overview" : "preparation");
                    tabs.current[next]?.focus();
                  }}
                >
                  <ScrambleText
                    text={t(tab === "overview" ? "Overview" : "Preparation")}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </button>
              ))}
            </div>
            <div
              className={styles.panel}
              role="tabpanel"
              tabIndex={0}
              id={`${id}-overview`}
              aria-labelledby={`${id}-overview-tab`}
              hidden={view !== "overview"}
            >
              {flavour && <p className={styles.flavour}>{flavour.value}</p>}
              <dl className={styles.highlights}>
                {supporting.map((property) => (
                  <div key={property.label}>
                    <dt>{property.label}</dt>
                    <dd>{property.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div
              className={`${styles.panel} ${styles.preparation}`}
              role="tabpanel"
              tabIndex={0}
              id={`${id}-preparation`}
              aria-labelledby={`${id}-preparation-tab`}
              hidden={view !== "preparation"}
              data-new-hero-product-profile={identity.key}
            >
              <p>{content.preparation}</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.order}>{purchase}</div>
    </div>
  );
}
