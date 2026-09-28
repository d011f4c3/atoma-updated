"use client";

import { useId, useRef, useState } from "react";
import { ScrambleText } from "./scramble-text";
import styles from "./sheet-information.module.css";

export function SheetInformation({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const id = useId();
  const dialogId = `${id}-information`;
  const headingId = `${id}-title`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function openInformation() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setOpen(true);
    closeRef.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        data-tone={tone}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
        onClick={openInformation}
      >
        <ScrambleText text="ABOUT ATOMA" interactive />
        <span className={styles.plus} aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        className={styles.dialog}
        data-tone={tone}
        aria-labelledby={headingId}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          // The close button is the sheet's only focusable control.
          if (event.key === "Tab") {
            event.preventDefault();
            closeRef.current?.focus({ preventScroll: true });
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            event.currentTarget.close();
          }
        }}
      >
        <div className={styles.sheet}>
          <div className={styles.sheetHeader}>
            <span>ABOUT ATOMA</span>
            <span className={styles.registration} aria-hidden="true" />
          </div>
          <div className={styles.body}>
            <h2 id={headingId}>
              A closer look
              <br />
              at matcha.
            </h2>
            <div className={styles.copy}>
              <p>
                An interface for understanding, selecting, and buying matcha.
              </p>
              <p>
                From the product to its origin, the focus is on what makes each
                matcha distinct.
              </p>
            </div>
          </div>
          <div className={styles.sheetFooter}>
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              onClick={() => dialogRef.current?.close()}
            >
              <ScrambleText text="CLOSE" interactive />
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
