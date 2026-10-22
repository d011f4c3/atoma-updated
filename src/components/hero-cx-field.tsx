"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { HERO_CX_APPLICATIONS } from "./hero-cx-layout-types";
import { PowderScene } from "./powder-scene";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./hero-cx-field.module.css";

const powderIndices: Record<ProductKey, number> = {
  ceremonial: 2,
  barista: 1,
  culinary: 0,
};

export type HeroCxFieldProps = {
  tone: "light" | "dark";
  selectedKey?: ProductKey;
  busy: boolean;
  onVisit: (key: ProductKey) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  sampleAction: ReactNode;
};

export function HeroCxField({
  tone,
  selectedKey,
  busy,
  onVisit,
  headingRef,
  sampleAction,
}: HeroCxFieldProps) {
  const { t } = useStorefrontLocale();
  const applicationsRef = useRef<HTMLElement>(null);
  const [hoverKey, setHoverKey] = useState<ProductKey>();
  const previewKey = hoverKey ?? selectedKey ?? "ceremonial";
  const preview = SAMPLE_SET_CONTENTS.find((item) => item.key === previewKey)!;

  function leaveField() {
    const focused =
      applicationsRef.current?.querySelector<HTMLAnchorElement>("a:focus");
    if (!focused) {
      setHoverKey(undefined);
      return;
    }
    const key = focused.dataset.cxProductLink;
    if (key === "ceremonial" || key === "barista" || key === "culinary") {
      setHoverKey(key);
    }
  }

  return (
    <section
      className={styles.hero}
      data-cx-layout-field
      data-tone={tone}
      aria-labelledby="cx-heading"
    >
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>{t("Japanese matcha")}</p>
        <h1
          id="cx-heading"
          className={styles.heading}
          ref={headingRef}
          tabIndex={-1}
        >
          {t("Matcha for the way you make it.")}
        </h1>
        <p className={styles.description}>
          {t("Japanese matcha for tea service, lattes and recipes.")}
        </p>
      </header>

      <div className={styles.field} onPointerLeave={leaveField}>
        <div
          className={styles.powder}
          data-cx-field-powder
          data-preview={previewKey}
        >
          <PowderScene
            title={t(preview.name)}
            selectionIndex={powderIndices[previewKey]}
            entryFromTray={false}
            enterPowder
            tone={tone}
          />
        </div>
        <p className={styles.annotation}>{t("Explore by application")}</p>
        <nav
          ref={applicationsRef}
          className={styles.applications}
          aria-label={t("Explore the three matcha")}
          onBlur={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              setHoverKey(undefined);
            }
          }}
        >
          {SAMPLE_SET_CONTENTS.map((item) => (
            <Link
              key={item.key}
              className={styles.applicationLink}
              href={`/shop/${encodeURIComponent(item.productHandle)}`}
              aria-label={`${t(item.name)} · ${t(HERO_CX_APPLICATIONS[item.key])}`}
              aria-disabled={busy || undefined}
              data-key={item.key}
              data-cx-product-link={item.key}
              data-cx-application={item.key}
              data-selected={selectedKey === item.key}
              data-preview={previewKey === item.key}
              onPointerEnter={(event) => {
                if (
                  event.pointerType === "mouse" &&
                  window.matchMedia("(hover: hover) and (pointer: fine)")
                    .matches
                ) {
                  setHoverKey(item.key);
                }
              }}
              onFocus={() => setHoverKey(item.key)}
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
              onNavigate={(event) => {
                if (busy) {
                  event.preventDefault();
                  return;
                }
                onVisit(item.key);
              }}
            >
              <span className={styles.applicationName} data-cx-application-name>
                {t(HERO_CX_APPLICATIONS[item.key])}
              </span>
              <span className={styles.productName} data-cx-application-product>
                {t(item.name)}
              </span>
              <span className={styles.code}>◇ {item.productCode}</span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.sampleEntry}>{sampleAction}</div>
      <p className={styles.reference} data-cx-hero-reference>
        {t("Matcha / Material study")}
      </p>
    </section>
  );
}
