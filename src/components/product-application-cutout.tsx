"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./product-application-cutout.module.css";

// The same complete-object windows used by the approved mobile hero.
const crops = {
  ceremonial: { label: "Tea service", x: 60, y: 140, width: 740, height: 584 },
  barista: { label: "Lattes", x: 800, y: 0, width: 550, height: 724 },
  culinary: { label: "Recipes", x: 1370, y: 240, width: 802, height: 484 },
} as const;

/** Contains one transparent application within the parent-provided frame. */
export function ProductApplicationCutout({
  productKey,
}: {
  productKey: ProductKey;
}) {
  const { t } = useStorefrontLocale();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const crop = crops[productKey];
  const cropStyle = {
    "--crop-ratio": `${crop.width} / ${crop.height}`,
    "--crop-aspect": crop.width / crop.height,
    "--image-width": `${(2172 / crop.width) * 100}%`,
    "--image-left": `${(-crop.x / crop.width) * 100}%`,
    "--image-top": `${(-crop.y / crop.height) * 100}%`,
  } as CSSProperties;

  return (
    <div
      className={styles.root}
      data-product-application-cutout={productKey}
      data-image-state={failed ? "failed" : loaded ? "ready" : "loading"}
    >
      {failed ? (
        <p className={styles.fallback} role="status">
          {t("Application image unavailable.")}
        </p>
      ) : (
        <div className={styles.crop} style={cropStyle}>
          <Image
            src="/images/hero/matcha-applications-cutout-v3.webp"
            alt={t(crop.label)}
            width={2172}
            height={724}
            unoptimized
            loading="eager"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
