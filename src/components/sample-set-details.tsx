"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-set-details.module.css";

export function SampleSetDetails({
  disabled = false,
  className,
}: {
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useDialogScrollLock(open);
  const dismiss = useDialogDismiss(() => dialog.current?.close());

  useEffect(() => {
    if (!open || !dialog.current || dialog.current.open) return;
    dialog.current.showModal();
    dialog.current.scrollTop = 0;
    close.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={className}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-dialog`}
        data-sample-details-trigger
        onClick={() => {
          if (!disabled && !document.querySelector("dialog[open]"))
            setOpen(true);
        }}
      >
        {t("Sample Set details")} <span aria-hidden="true">↗</span>
      </button>
      <dialog
        ref={dialog}
        id={`${id}-dialog`}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        data-sample-set-details
        {...dismiss}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <header className={styles.header}>
          <h2 id={`${id}-title`}>{t("Sample Set details")}</h2>
          <button
            ref={close}
            type="button"
            onClick={() => dialog.current?.close()}
          >
            {t("Close details")} <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={styles.body}>
          <p className={styles.measure} id={`${id}-description`}>
            {t("Three matcha · 20 g each")} <span aria-hidden="true">/</span>{" "}
            {t("60 g total")}
          </p>
          <section aria-labelledby={`${id}-contents`}>
            <h3 id={`${id}-contents`}>{t("In the set")}</h3>
            <ul className={styles.contents}>
              {SAMPLE_SET_CONTENTS.map((item) => (
                <li key={item.key}>
                  <div>
                    <span className={styles.name}>{t(item.name)}</span>
                    <span className={styles.application}>
                      {t(item.application)}
                    </span>
                  </div>
                  <span className={styles.weight}>{item.grams} g</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby={`${id}-tasting`}>
            <h3 id={`${id}-tasting`}>
              {t("Compare in your own preparation.")}
            </h3>
            <p>
              {t(
                "Prepare each sample in the drink or recipe you intend to serve.",
              )}{" "}
              {t(
                "Keep the recipe consistent while comparing flavour and texture.",
              )}
            </p>
          </section>
          <section aria-labelledby={`${id}-after`}>
            <h3 id={`${id}-after`}>{t("After your samples")}</h3>
            <p>
              {t(
                "After tasting, use your emailed code for ¥4,500 credit toward your first eligible wholesale order of 1 kg or more. Use the same email as your Sample Set order.",
              )}
            </p>
          </section>
        </div>
        <footer className={styles.footer}>
          <button type="button" onClick={() => dialog.current?.close()}>
            <span>{t("Back to order")}</span>
            <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </dialog>
    </>
  );
}
