"use client";

import Link from "next/link";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { ShopMaterialImage } from "./shop-material-image";
import { SampleSetPurchase, useSampleSetPurchase } from "./samples";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-selection-content.module.css";

export function SampleSelectionMaterial() {
  const { t } = useStorefrontLocale();
  return (
    <div className={styles.material} data-sample-set-material>
      <div className={styles.triptych}>
        {SAMPLE_SET_CONTENTS.map((item) => (
          <figure key={item.key}>
            <div className={styles.powder}>
              <ShopMaterialImage
                src={item.image}
                alt={t(item.imageAlt)}
                showWhilePreparing
              />
            </div>
            <figcaption>
              <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
              <span>{item.grams} g</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className={styles.caption}>
        <span>{t("One set contains all three matcha.")}</span>
        <span>{t("60 g total")}</span>
      </div>
    </div>
  );
}

export function SampleSelectionInformation({
  onClose,
}: {
  onClose: () => void;
}) {
  const { t } = useStorefrontLocale();
  const purchase = useSampleSetPurchase();
  return (
    <div className={styles.information} data-sample-set-information>
      <div className={styles.topline}>
        <span>{t("Samples")}</span>
        <button
          type="button"
          onClick={onClose}
          disabled={purchase.locked}
          aria-label={t("Back to overview")}
        >
          ×
        </button>
      </div>
      <div className={styles.scroll}>
        <p className={styles.intro}>
          {t(
            "Try the range in your own preparations, with 20 g of each matcha.",
          )}
        </p>
        <div className={styles.contents}>
          {SAMPLE_SET_CONTENTS.map((item) => (
            <div key={item.key}>
              <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
              <span>{t(item.application)}</span>
              <span>{item.grams} g</span>
            </div>
          ))}
        </div>
        <SampleSetPurchase
          purchase={purchase}
          className={styles.purchase}
          titleTreatment="plain"
        />
        <Link
          className={styles.link}
          href="/samples"
          aria-disabled={purchase.locked || undefined}
          onClick={(event) => {
            if (purchase.locked) event.preventDefault();
          }}
        >
          {t("Explore the Sample Set")} <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}
