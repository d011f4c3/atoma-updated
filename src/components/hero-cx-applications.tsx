"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode, type RefObject } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { HERO_CX_APPLICATIONS } from "./hero-cx-layout-types";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./hero-cx-applications.module.css";

export type HeroCxApplicationsProps = {
  tone: "light" | "dark";
  selectedKey?: ProductKey;
  busy: boolean;
  onVisit: (key: ProductKey) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  sampleAction: ReactNode;
};

function ApplicationScene({ src }: { src: string }) {
  const { t } = useStorefrontLocale();
  const [imageState, setImageState] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  return (
    <div
      className={styles.scene}
      data-cx-hero-image
      data-image-state={imageState}
      data-image-source={src}
    >
      {imageState === "failed" ? (
        <p
          className={styles.fallback}
          role="status"
          data-cx-hero-image-fallback
        >
          {t("Application image unavailable.")}
        </p>
      ) : (
        <Image
          src={src}
          alt={t(
            "Composition reference showing prepared matcha, an iced latte and matcha cake.",
          )}
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          className={styles.sceneImage}
          onLoad={() => setImageState("ready")}
          onError={() => setImageState("failed")}
        />
      )}
    </div>
  );
}

export function HeroCxApplications({
  tone,
  selectedKey,
  busy,
  onVisit,
  headingRef,
  sampleAction,
}: HeroCxApplicationsProps) {
  const { t } = useStorefrontLocale();
  const source =
    tone === "dark"
      ? "/images/applications/matcha-hero-applications-v2-dark.webp"
      : "/images/applications/matcha-hero-applications-v2.webp";

  return (
    <section
      className={styles.hero}
      data-cx-layout-applications
      data-tone={tone}
      aria-labelledby="cx-heading"
    >
      <div className={styles.introduction}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>{t("Japanese matcha")}</p>
          <h1 id="cx-heading" ref={headingRef} tabIndex={-1}>
            {t("Matcha for the way you make it.")}
          </h1>
        </header>
        <div className={styles.summary}>
          <p className={styles.description}>
            {t("Japanese matcha for tea service, lattes and recipes.")}
          </p>
          <div className={styles.sampleEntry}>{sampleAction}</div>
        </div>
      </div>

      {/* Theme changes reset only the image state, never the native navigation. */}
      <ApplicationScene key={source} src={source} />

      <nav
        className={styles.applications}
        aria-label={t("Explore the three matcha")}
      >
        {SAMPLE_SET_CONTENTS.map((item) => (
          <Link
            key={item.key}
            className={styles.applicationLink}
            href={`/shop/${encodeURIComponent(item.productHandle)}`}
            aria-label={`${t(item.name)} · ${t(HERO_CX_APPLICATIONS[item.key])}`}
            aria-disabled={busy || undefined}
            data-cx-product-link={item.key}
            data-cx-application={item.key}
            data-selected={selectedKey === item.key}
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
            <span className={styles.code}>
              ◇ {item.productCode} <span aria-hidden="true">↗</span>
            </span>
          </Link>
        ))}
      </nav>

      <p className={styles.reference} data-cx-hero-reference>
        {t("AI composition reference · Product photography pending")}
      </p>
    </section>
  );
}
