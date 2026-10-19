"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { SAMPLE_SET_CONTENTS, type SampleSetContent } from "@/lib/sample-set";
import { PouchSticker } from "./pouch-sticker";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import styles from "./sample-foil-trio.module.css";

/** The inspection reader and physical pouch share the same live print. */
function SampleSticker({
  item,
  attached = false,
}: {
  item: SampleSetContent;
  attached?: boolean;
}) {
  return (
    <PouchSticker
      title={item.name}
      application={item.application}
      productHandle={item.productHandle}
      format={`${item.grams} g`}
      sample
      attached={attached}
    />
  );
}

function FoilPouch({ item }: { item: SampleSetContent }) {
  return (
    <span className={styles.pouch}>
      <Image
        src="/images/samples/foil-pouch-sticker-v3.png"
        alt=""
        width={1024}
        height={1536}
        className={styles.foil}
        sizes="(max-width: 760px) 200px, 380px"
        loading="eager"
        draggable={false}
      />
      <span className={styles.attachedLabel}>
        <SampleSticker item={item} attached />
      </span>
    </span>
  );
}

/** Label inspection is deliberately separate from the customer's order. */
export function SampleFoilTrio({
  disabled = false,
  contained = false,
  compact = false,
}: {
  disabled?: boolean;
  contained?: boolean;
  compact?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [inspected, setInspected] = useState<SampleSetContent | null>(null);
  useDialogScrollLock(Boolean(inspected));
  const dismiss = useDialogDismiss(() => dialogRef.current?.close());

  useEffect(() => {
    if (inspected && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [inspected]);

  function tilt(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 8}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 10}deg`);
  }

  return (
    <div
      className={styles.trio}
      data-foil-trio
      data-contained={contained || undefined}
      data-compact={compact || undefined}
    >
      <div className={styles.stage}>
        {SAMPLE_SET_CONTENTS.map((item) => (
          <button
            className={styles.packet}
            data-pouch={item.key}
            key={item.key}
            type="button"
            disabled={disabled}
            aria-label={t("Inspect {name} label", { name: t(item.name) })}
            aria-haspopup="dialog"
            onPointerMove={tilt}
            onPointerLeave={(event) => {
              event.currentTarget.style.removeProperty("--tilt-x");
              event.currentTarget.style.removeProperty("--tilt-y");
            }}
            onClick={(event) => {
              openerRef.current = event.currentTarget;
              setInspected(item);
            }}
          >
            <span className={styles.packetMotion} aria-hidden="true">
              <FoilPouch item={item} />
            </span>
            <span className={styles.packetHint} aria-hidden="true">
              +
            </span>
          </button>
        ))}
      </div>
      {compact && (
        <ul className={styles.contents}>
          {SAMPLE_SET_CONTENTS.map((item) => (
            <li key={item.key}>
              <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
              <span>{t(item.application)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.legend}>
        <span>{t("Three matcha · 20 g each")}</span>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          onClick={(event) => {
            openerRef.current = event.currentTarget;
            setInspected(SAMPLE_SET_CONTENTS[0] ?? null);
          }}
        >
          <span className={styles.desktopHint}>{t("Inspect a label")}</span>
          <span className={styles.mobileHint}>{t("Tap to see more")}</span>{" "}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        data-sample-label-dialog
        {...dismiss}
        onClose={() => {
          setInspected(null);
          openerRef.current?.focus({ preventScroll: true });
        }}
      >
        {inspected && (
          <>
            <header className={styles.dialogHeader}>
              <h2 id={`${id}-title`}>
                <span>ATOMA /</span> <span>{t("Sample labels")}</span>
              </h2>
              <button type="button" onClick={() => dialogRef.current?.close()}>
                {t("Close label")} <span aria-hidden="true">×</span>
              </button>
            </header>
            <div className={styles.inspection}>
              <div className={styles.inspectedPouch} aria-hidden="true">
                <FoilPouch item={inspected} />
              </div>
              <div className={styles.labelDetail}>
                <SampleSticker item={inspected} />
                <Link
                  href={`/shop/${inspected.productHandle}`}
                  className={styles.productLink}
                >
                  {t("Explore this matcha")} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <div
                className={styles.labelChoices}
                role="group"
                aria-label={t("Choose a label")}
              >
                {SAMPLE_SET_CONTENTS.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    aria-pressed={item.key === inspected.key}
                    onClick={() => setInspected(item)}
                  >
                    <span>{item.productCode}</span>
                    {t(item.name.replace(/ Matcha$/, ""))}
                  </button>
                ))}
              </div>
              <p id={`${id}-description`}>
                {t("All three matcha are included in your set.")}
              </p>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
