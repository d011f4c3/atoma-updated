"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LabelCard, type LabelCardProps } from "./label-card";
import styles from "./silver-bag-scene.module.css";

export type SilverBagSceneProps = Omit<
  LabelCardProps,
  "presentation" | "annotation"
> & {
  onReady?: () => void;
  interactive?: boolean;
  appearance?: "product" | "hero";
};

/** Photographic packaging with editable, material-specific live ink. */
export function SilverBagScene({
  title,
  application,
  format,
  quantity,
  reference,
  profile,
  showReference = false,
  visible = true,
  expanded = false,
  tone = "dark",
  onEditReference,
  onReady,
  interactive = true,
  appearance = "product",
}: SilverBagSceneProps) {
  const { t } = useStorefrontLocale();
  const readyRef = useRef(onReady);
  const notifiedRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  const markReady = useCallback(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    setReady(true);
    readyRef.current?.();
  }, []);

  return (
    <div
      className={styles.scene}
      data-silver-bag
      data-appearance={appearance}
      data-tone={tone}
      data-expanded={expanded}
      data-visible={visible}
      data-ready={ready}
      data-image-failed={failed}
      data-interactive={interactive}
      role="group"
      aria-label={t("{name} in a silver resealable bag", {
        name: title || t("Matcha"),
      })}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className={styles.object}>
        {failed && <div className={styles.fallbackBag} aria-hidden="true" />}
        <Image
          src={
            appearance === "hero"
              ? "/images/product-exploration/silver-bag-hero-v3.png"
              : "/images/product-exploration/silver-bag.png"
          }
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 80vw, 48vw"
          className={styles.photograph}
          draggable={false}
          onLoad={markReady}
          onError={() => {
            setFailed(true);
            markReady();
          }}
        />
        <div className={styles.ink}>
          <LabelCard
            presentation="ink"
            title={title}
            application={application}
            format={format}
            quantity={quantity}
            annotation={t("Matcha")}
            reference={reference}
            profile={profile}
            showReference={showReference}
            visible={visible}
            expanded={expanded}
            tone={tone}
            onEditReference={
              interactive && showReference ? onEditReference : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
