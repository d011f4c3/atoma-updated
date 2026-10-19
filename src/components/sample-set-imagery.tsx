"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { ShopMaterialImage } from "./shop-material-image";
import { SampleFoilTrio } from "./sample-foil-trio";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-set-imagery.module.css";

export type SampleImageryVariant =
  "sachets" | "box" | "landscape" | "set" | "focus" | "spread" | "register";

export const sampleImageryOptions = [
  {
    value: "sachets",
    name: "Foil trio",
    description:
      "Silver foil with live ATOMA paper labels. Lift a pouch and inspect its label and product QR code.",
  },
  {
    value: "box",
    name: "Open set",
    description:
      "Packaging concept: an open box containing three sachets. The box and sachet format are unconfirmed.",
  },
  {
    value: "landscape",
    name: "Powder landscape",
    description:
      "Generated material illustration: a sculptural powder landscape, not exact photography of the three teas.",
  },
  {
    value: "set",
    name: "Set portrait",
    description: "Three complete swatches, held together at an equal scale.",
  },
  {
    value: "focus",
    name: "Focal study",
    description:
      "One larger swatch at a time. The labels preview each tea without changing the set.",
  },
  {
    value: "spread",
    name: "Open arrangement",
    description:
      "Three separate swatches across one open, diagonal composition.",
  },
  {
    value: "register",
    name: "Horizontal register",
    description:
      "Three horizontal photographic rows with their product records.",
  },
] as const satisfies readonly {
  value: SampleImageryVariant;
  name: string;
  description: string;
}[];

const concepts = [
  {
    variant: "box",
    src: "/images/samples/study/open-set.png",
    alt: "Generated packaging concept showing an open box containing three sample sachets. Physical packaging is unconfirmed.",
  },
  {
    variant: "landscape",
    src: "/images/samples/study/powder-landscape.png",
    alt: "Generated material illustration showing a sculptural landscape of loose matcha powder.",
  },
] as const;

/** Visual inspection never changes the selected order. */
export function SampleSetImagery({
  variant = "set",
  disabled = false,
}: {
  variant?: SampleImageryVariant;
  disabled?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const [focused, setFocused] = useState<string>("ceremonial");
  const id = useId();
  const concept = concepts.some((item) => item.variant === variant);

  if (variant === "sachets") {
    return (
      <figure
        className={styles.imagery}
        data-sample-set-imagery
        data-variant={variant}
        aria-label={t("Sample Set")}
      >
        <SampleFoilTrio disabled={disabled} contained />
      </figure>
    );
  }

  return (
    <figure
      className={styles.imagery}
      data-sample-set-imagery
      data-variant={variant}
      data-concept={concept || undefined}
      data-preview={focused}
      aria-labelledby={`${id}-title`}
    >
      <figcaption className={styles.heading}>
        <span id={`${id}-title`}>{t("Sample Set")}</span>
        <span>{t("Three matcha · 20 g each")}</span>
      </figcaption>
      <div className={styles.scene}>
        {SAMPLE_SET_CONTENTS.map((item) => (
          <div
            className={styles.material}
            key={item.key}
            data-sample-set-material={item.key}
            data-active={focused === item.key || undefined}
            aria-hidden={
              concept || (variant === "focus" && focused !== item.key)
                ? true
                : undefined
            }
          >
            <div className={styles.photograph}>
              <ShopMaterialImage src={item.image} alt={t(item.imageAlt)} />
            </div>
            <span className={styles.recordLabel}>
              <span>{item.productCode}</span>
              <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
            </span>
          </div>
        ))}
        {concept &&
          concepts.map((item) => (
            <div
              className={styles.conceptImage}
              data-concept-image={item.variant}
              data-active={variant === item.variant || undefined}
              aria-hidden={variant !== item.variant || undefined}
              key={item.variant}
              lang="en"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                loading="eager"
                sizes="(max-width: 760px) 92vw, (max-width: 1440px) 49vw, 760px"
              />
            </div>
          ))}
      </div>
      <ul
        className={styles.labels}
        aria-label={t("Included in the set")}
        hidden={concept}
      >
        {SAMPLE_SET_CONTENTS.map((item) => (
          <li key={item.key}>
            {variant === "focus" ? (
              <button
                type="button"
                disabled={disabled}
                aria-pressed={focused === item.key}
                onClick={() => setFocused(item.key)}
              >
                <span>{item.productCode}</span>
                <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
              </button>
            ) : (
              <span className={styles.label}>
                <span>{item.productCode}</span>
                <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {concept && (
        <div className={styles.conceptDisclosure} lang="en">
          <span>
            {variant === "landscape"
              ? "Generated illustration"
              : "Packaging concept"}
          </span>
          <p>
            {variant === "landscape"
              ? "A material illustration, not an exact tea photograph."
              : "Physical sample packaging is unconfirmed."}
          </p>
        </div>
      )}
      <noscript>
        <style>{`[data-sample-set-imagery] [data-pending="true"] img { opacity: 1 !important; }`}</style>
      </noscript>
    </figure>
  );
}
