"use client";

import { SampleFoilTrio } from "./sample-foil-trio";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./samples-gallery.module.css";

/** Every pouch shown here is included in the same set. */
export function SamplesGallery() {
  const { t } = useStorefrontLocale();

  return (
    <figure className={styles.gallery} data-sample-gallery data-preview="all">
      <SampleFoilTrio />
      <figcaption className={styles.caption} data-sample-gallery-caption>
        {t("One set contains all three matcha.")}
      </figcaption>
    </figure>
  );
}
