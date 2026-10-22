"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { HERO_CX_APPLICATIONS } from "./hero-cx-layout-types";
import { ScrambleText } from "./scramble-text";
import { SpecimenField } from "./specimen-field";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./hero-cx-material.module.css";

const materialSource = "/images/hero/matcha-tray-concept-02.webp";
type ImageState = "loading" | "ready" | "failed";

export type HeroCxMaterialProps = {
  tone: "light" | "dark";
  selectedKey?: ProductKey;
  busy: boolean;
  onVisit: (key: ProductKey) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  sampleAction: ReactNode;
};

function MaterialImage({ src }: { src: string }) {
  const { t } = useStorefrontLocale();
  const [state, setState] = useState<ImageState>("loading");

  return (
    <div
      className={styles.materialObject}
      data-cx-hero-image
      data-image-source={src}
      data-image-state={state}
    >
      {state === "failed" ? (
        <p
          className={styles.fallback}
          role="status"
          data-cx-hero-image-fallback
        >
          {t("Material image unavailable.")}
        </p>
      ) : (
        <Image
          src={src}
          alt={t(
            "An overhead view of fine green matcha in a shallow rectangular metal tray.",
          )}
          fill
          sizes="(max-width: 760px) 100vw, 70vw"
          loading="eager"
          fetchPriority="high"
          className={styles.materialImage}
          draggable={false}
          onLoad={() => setState("ready")}
          onError={() => setState("failed")}
        />
      )}
    </div>
  );
}

function ApplicationThumbnail({
  productKey,
  src,
  alt,
}: {
  productKey: ProductKey;
  src: string | undefined;
  alt: string | undefined;
}) {
  const { t } = useStorefrontLocale();
  const [state, setState] = useState<ImageState>("loading");

  return (
    <span
      className={styles.thumbnail}
      data-cx-application-image={productKey}
      data-image-source={src}
      data-image-state={src ? state : "unavailable"}
    >
      {src && alt && state !== "failed" ? (
        <Image
          src={src}
          alt={t(alt)}
          fill
          sizes="(max-width: 760px) 24vw, 10vw"
          loading="eager"
          className={styles.thumbnailImage}
          draggable={false}
          onLoad={() => setState("ready")}
          onError={() => setState("failed")}
        />
      ) : (
        <span
          className={styles.fallback}
          data-cx-application-image-fallback
          role="img"
          aria-label={t("Application image unavailable.")}
        >
          <span aria-hidden="true">—</span>
        </span>
      )}
    </span>
  );
}

function resetMaterial(element: HTMLDivElement | null) {
  element?.style.setProperty("--material-x", "0px");
  element?.style.setProperty("--material-y", "0px");
  element?.style.setProperty("--material-rotate", "0deg");
}

export function HeroCxMaterial({
  tone,
  selectedKey,
  busy,
  onVisit,
  headingRef,
  sampleAction,
}: HeroCxMaterialProps) {
  const { t } = useStorefrontLocale();
  const materialRef = useRef<HTMLDivElement>(null);
  const pointerMotion = useRef(false);

  useEffect(() => {
    const material = materialRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const synchronize = () => {
      pointerMotion.current = finePointer.matches && !reducedMotion.matches;
      if (material) {
        material.dataset.motionEnabled = String(pointerMotion.current);
      }
      if (!pointerMotion.current) resetMaterial(material);
    };
    const reset = () => resetMaterial(material);
    synchronize();
    reducedMotion.addEventListener("change", synchronize);
    finePointer.addEventListener("change", synchronize);
    window.addEventListener("blur", reset);
    return () => {
      pointerMotion.current = false;
      reducedMotion.removeEventListener("change", synchronize);
      finePointer.removeEventListener("change", synchronize);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, []);

  function moveMaterial(event: PointerEvent<HTMLDivElement>) {
    if (!pointerMotion.current || event.pointerType !== "mouse") return;
    const material = event.currentTarget;
    const bounds = material.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = Math.max(
      -1,
      Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2),
    );
    const y = Math.max(
      -1,
      Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2),
    );
    material.style.setProperty("--material-x", `${x * 10}px`);
    material.style.setProperty("--material-y", `${y * 6}px`);
    material.style.setProperty("--material-rotate", `${x}deg`);
  }

  return (
    <section
      className={styles.hero}
      data-cx-layout-material
      data-tone={tone}
      aria-labelledby="cx-heading"
    >
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>{t("Japanese matcha")}</p>
        <h1
          id="cx-heading"
          className={styles.heading}
          ref={headingRef}
          tabIndex={-1}
        >
          <ScrambleText
            text={t("Matcha for the way you make it.")}
            animateOnMount={false}
            periodic
            wrap
            visibleOnly
            durationMs={350}
            mobileDurationMs={350}
          />
        </h1>
        <p className={styles.description}>
          {t("Japanese matcha for tea service, lattes and recipes.")}
        </p>
        <div className={styles.sampleEntry}>{sampleAction}</div>
      </div>

      <div
        ref={materialRef}
        className={styles.material}
        data-cx-material-motion
        onPointerMove={moveMaterial}
        onPointerLeave={() => resetMaterial(materialRef.current)}
        onPointerCancel={() => resetMaterial(materialRef.current)}
      >
        <SpecimenField className={styles.field} />
        <div className={styles.materialLight} aria-hidden="true" />
        <MaterialImage key={materialSource} src={materialSource} />
        <div className={styles.registration} aria-hidden="true">
          <span className={styles.corner} />
          <span className={styles.corner} />
          <span className={styles.corner} />
          <span className={styles.corner} />
        </div>
        <p className={styles.materialCaption}>{t("Matcha / Material study")}</p>
      </div>

      <nav
        className={styles.applications}
        aria-label={t("Explore the three matcha")}
      >
        {SAMPLE_SET_CONTENTS.map((item) => {
          const image = getProductApplicationImage(item.productHandle);
          return (
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
              <ApplicationThumbnail
                key={image?.src ?? item.key}
                productKey={item.key}
                src={image?.src}
                alt={image?.alt}
              />
              <span className={styles.linkCopy}>
                <span
                  className={styles.applicationName}
                  data-cx-application-name
                >
                  {t(HERO_CX_APPLICATIONS[item.key])}
                </span>
                <span
                  className={styles.productName}
                  data-cx-application-product
                >
                  {t(item.name)}
                </span>
                <span className={styles.code}>◇ {item.productCode}</span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          );
        })}
      </nav>

      <p className={styles.reference} data-cx-hero-reference>
        {t(
          "Bowl photo · Latte & cake AI references · Product photography pending",
        )}
      </p>
    </section>
  );
}
