"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import styles from "./selector-study.module.css";

const informationDirections = [
  {
    value: "text",
    name: "Text",
    description: "Plain text keeps the information views understated.",
  },
  {
    value: "tabs",
    name: "Tabs",
    description: "Individual tabs give each information view a clear target.",
  },
  {
    value: "segmented",
    name: "Segmented",
    description: "A joined strip groups the four information views together.",
  },
  {
    value: "menu",
    name: "Menu",
    description:
      "A compact menu reveals the other information views on demand.",
  },
  {
    value: "brackets",
    name: "Brackets",
    description:
      "Small corner brackets mark the active view around a quiet row of text.",
  },
  {
    value: "track",
    name: "Indicator",
    description:
      "A fine moving indicator follows the active information view along a shared track.",
  },
] as const;

type InformationVariant = (typeof informationDirections)[number]["value"];

export function SelectorStudy() {
  const [sectionVariant, setSectionVariant] =
    useState<InformationVariant>("tabs");
  const [tone, setTone] = useState<"dark" | "light">("light");
  const notesRef = useRef<HTMLDetailsElement>(null);
  const { busy } = useCart();
  const id = useId();
  const informationDirection =
    informationDirections.find(
      (direction) => direction.value === sectionVariant,
    ) ?? informationDirections[1];

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      const notes = notesRef.current;
      if (
        notes?.open &&
        event.target instanceof Node &&
        !notes.contains(event.target)
      ) {
        notes.open = false;
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return (
    <div
      className={styles.study}
      data-selector-study
      data-selector-direction="slides"
      data-information-direction={sectionVariant}
      data-tone={tone}
    >
      <header className={styles.toolbar}>
        <h1>Selector study</h1>
        <div className={styles.field}>
          <label htmlFor={`${id}-information`}>Section navigation</label>
          <select
            id={`${id}-information`}
            value={sectionVariant}
            disabled={busy}
            onChange={(event) => {
              if (busy) return;
              setSectionVariant(event.target.value as InformationVariant);
              if (notesRef.current) notesRef.current.open = false;
            }}
          >
            {informationDirections.map((direction) => (
              <option key={direction.value} value={direction.value}>
                {direction.name}
              </option>
            ))}
          </select>
        </div>
        <details
          ref={notesRef}
          className={styles.notes}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !event.currentTarget.open) return;
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              event.currentTarget.open = false;
            }
          }}
        >
          <summary aria-label="About this direction">
            About
            <span className={styles.disclosureMark} aria-hidden="true">
              +
            </span>
          </summary>
          <div className={styles.notePanel}>
            <p className={styles.noteTitle}>{informationDirection.name}</p>
            <p>{informationDirection.description}</p>
            <p className={styles.fixedChoice}>
              Left Slides stay fixed while you compare section navigation.
            </p>
          </div>
        </details>
        <Link
          className={styles.home}
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span className={styles.fullLabel}>Current homepage</span>
          <span className={styles.compactLabel} aria-hidden="true">
            Home
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={setTone}
          selectorVariant="slides"
          sectionSelectorVariant={sectionVariant}
          selectorPlacement="left"
          originPreviewVariant="split"
          startAtSelection
        />
      </div>
    </div>
  );
}
