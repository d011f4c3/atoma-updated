"use client";

import { useId, useRef, useState } from "react";
import type { ProductContent } from "@/lib/product-content";
import { MaterialProfile } from "./material-profile";
import { ScrambleText } from "./scramble-text";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import styles from "./product-information.module.css";

export function ProductInformation({ content }: { content: ProductContent }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const dismiss = useDialogDismiss();
  useDialogScrollLock(open);

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
          closeRef.current?.focus({ preventScroll: true });
        }}
      >
        <ScrambleText text="Material & use" interactive />{" "}
        <span aria-hidden="true">+</span>
      </button>
      <dialog
        {...dismiss}
        ref={dialogRef}
        id={id}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.stopPropagation();
          if (event.key !== "Tab") return;
          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), summary, a[href], input:not(:disabled), [tabindex="0"]',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className={styles.header}>
          <span>
            <ScrambleText text="A CLOSER LOOK" periodic wrap />
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            <ScrambleText text="Back to selection" interactive />{" "}
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.body}>
          <span className={styles.eyebrow}>
            <ScrambleText text={content.application} periodic wrap />
          </span>
          <h2 id={`${id}-title`}>{content.name}</h2>
          <p className={styles.introduction}>
            <ScrambleText text={content.summary} periodic wrap />
          </p>
          <MaterialProfile content={content} />
          <details className={styles.preparation}>
            <summary>
              <ScrambleText text="Use & preparation" interactive />{" "}
              <span aria-hidden="true">+</span>
            </summary>
            <div className={styles.preparationBody}>
              <p>
                <ScrambleText text={content.preparation} periodic wrap />
              </p>
              {content.sections.map((section) => (
                <section key={section.id}>
                  <h3>{section.title}</h3>
                  <p>
                    <ScrambleText text={section.body} periodic wrap />
                  </p>
                </section>
              ))}
              <section>
                <h3>What to look for</h3>
                <ul>
                  {content.lookFor.map((item) => (
                    <li key={item}>
                      <ScrambleText text={item} periodic wrap />
                    </li>
                  ))}
                </ul>
              </section>
              <p className={styles.selectionNote}>
                <ScrambleText text={content.selectionNote} periodic wrap />
              </p>
            </div>
          </details>
        </div>
      </dialog>
    </>
  );
}
