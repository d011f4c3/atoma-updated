"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getProductApplicationImage,
  type ProductApplicationImageCollection,
} from "@/lib/product-application-imagery";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./product-application-image.module.css";

export function ProductApplicationImage({
  handle,
  presentation = "overview",
  collection = "reference",
  sizes,
}: {
  handle: string;
  presentation?: "overview" | "retail";
  collection?: ProductApplicationImageCollection;
  sizes?: string;
}) {
  const { t } = useStorefrontLocale();
  const reference = getProductApplicationImage(handle, collection);
  // Source-keyed events cannot apply a previous tea's late load/error to the
  // currently selected image. Only this image subtree changes, never the scene.
  const [loadedSource, setLoadedSource] = useState<string>();
  const [failedSource, setFailedSource] = useState<string>();
  const failed = Boolean(reference && failedSource === reference.src);
  const imageState = !reference
    ? "unavailable"
    : failed
      ? "failed"
      : loadedSource === reference.src
        ? "ready"
        : "loading";

  return (
    <figure
      className={styles.root}
      data-product-application-image={reference?.productKey ?? "unknown"}
      data-presentation={presentation}
      data-image-collection={collection}
      data-image-state={imageState}
    >
      <div className={styles.frame}>
        {reference && !failed ? (
          <Image
            key={reference.src}
            src={reference.src}
            alt={t(
              collection === "canonical"
                ? reference.alt
                : {
                    ceremonial: "Tea service",
                    barista: "Lattes",
                    culinary: "Recipes & baking",
                  }[reference.productKey],
            )}
            fill
            sizes={
              sizes ??
              (presentation === "retail"
                ? "(max-width: 760px) calc(100vw - 40px), 50vw"
                : "(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 42vw, 32vw")
            }
            loading={presentation === "retail" ? "eager" : "lazy"}
            fetchPriority={presentation === "retail" ? "high" : undefined}
            onLoad={() => setLoadedSource(reference.src)}
            onError={() => setFailedSource(reference.src)}
          />
        ) : (
          <p
            className={styles.fallback}
            role="status"
            data-product-application-fallback
          >
            {t("Application image unavailable.")}
          </p>
        )}
      </div>
    </figure>
  );
}
