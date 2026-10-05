"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProductContent } from "@/lib/product-content";
import styles from "./laboratory-details.module.css";

type LaboratoryDetailsProps = {
  content: ProductContent;
  view: "specifications" | "origins";
};

export function LaboratoryDetails(props: LaboratoryDetailsProps) {
  return (
    <DetailsPanel key={`${props.content.name}:${props.view}`} {...props} />
  );
}

function DetailsPanel({ content, view }: LaboratoryDetailsProps) {
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selected =
    activeIndex === null ? null : content.materialProfile[activeIndex];

  useEffect(() => {
    if (activeIndex === null) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [activeIndex]);

  return (
    <section
      ref={panelRef}
      className={styles.panel}
      aria-labelledby={`${id}-heading`}
      tabIndex={-1}
    >
      <header className={styles.heading}>
        <p className={styles.product}>{content.name}</p>
        <h2 id={`${id}-heading`}>
          {view === "specifications" ? "Specifications" : "Origin notes"}
        </h2>
      </header>

      {view === "specifications" ? (
        <>
          <div className={styles.properties}>
            {content.materialProfile.map((property, index) => (
              <button
                key={property.label}
                className={styles.property}
                type="button"
                aria-haspopup="dialog"
                aria-controls={`${id}-dialog`}
                aria-expanded={activeIndex === index}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setActiveIndex(index);
                }}
              >
                <span className={styles.label}>{property.label}</span>
                <span className={styles.value}>{property.value}</span>
                <span className={styles.plus} aria-hidden="true">
                  +
                </span>
              </button>
            ))}
          </div>
          <p className={styles.disclosure}>
            <span>Sample material profile</span>
            Illustrative notes. Not lot measurements.
          </p>
        </>
      ) : (
        <div className={styles.origin}>
          {content.originNote ? (
            <p>{content.originNote}</p>
          ) : (
            <>
              <p className={styles.status}>Not yet published</p>
              <p>
                Verified origin details for this selection have not yet been
                published.
              </p>
            </>
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        id={`${id}-dialog`}
        className={styles.dialog}
        aria-labelledby={`${id}-property`}
        aria-describedby={`${id}-explanation`}
        onClose={() => {
          setActiveIndex(null);
          const trigger = triggerRef.current;
          if (trigger?.isConnected && trigger.getClientRects().length > 0) {
            trigger.focus({ preventScroll: true });
          } else if (panelRef.current?.isConnected) {
            panelRef.current.focus({ preventScroll: true });
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.stopPropagation();
          if (event.key === "Tab") {
            event.preventDefault();
            closeRef.current?.focus();
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
        <div className={styles.dialogHeader}>
          <p>{content.name}</p>
          <button
            ref={closeRef}
            className={styles.close}
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <h3 id={`${id}-property`}>{selected?.label}</h3>
        <p className={styles.reading}>{selected?.value}</p>
        <p id={`${id}-explanation`} className={styles.explanation}>
          {selected?.explanation}
        </p>
        <p className={styles.dialogDisclosure}>Sample material profile</p>
      </dialog>
    </section>
  );
}
