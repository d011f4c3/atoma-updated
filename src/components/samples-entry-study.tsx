"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  sampleEntryDirections,
  samplePriorityEntries,
  sampleRightEntries,
  type SampleEntryDirection,
  type SampleEntryContext,
  type SampleRightEntry,
} from "@/lib/sample-entry-directions";
import { useCart } from "./cart-drawer";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { SpecimenHero } from "./specimen-hero";
import { Shop } from "./shop";
import styles from "./samples-entry-study.module.css";

export function SamplesEntryStudy({
  initialDirection = "connected",
  initialContext = "explore",
  initialRightEntry = "default",
}: {
  initialDirection?: SampleEntryDirection;
  initialContext?: SampleEntryContext;
  initialRightEntry?: SampleRightEntry;
}) {
  const [direction, setDirection] = useState(initialDirection);
  const [context, setContext] = useState(initialContext);
  const [rightEntry, setRightEntry] = useState(initialRightEntry);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const id = useId();
  const selected = sampleEntryDirections.find(
    (item) => item.value === direction,
  )!;

  function updatePreview(
    nextDirection: SampleEntryDirection,
    nextContext: SampleEntryContext,
    nextRightEntry = rightEntry,
  ) {
    if (busy) return;
    setDirection(nextDirection);
    setContext(nextContext);
    setRightEntry(nextRightEntry);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", nextDirection);
    url.searchParams.set("context", nextContext);
    if (nextRightEntry === "default") url.searchParams.delete("right");
    else url.searchParams.set("right", nextRightEntry);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function changeTone(next: "light" | "dark") {
    if (!busy) setTone(next);
  }

  return (
    <div
      className={styles.study}
      data-samples-entry-study
      data-direction={direction}
      data-context={context}
      data-right-entry={rightEntry}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header
        className={styles.toolbar}
        lang="en"
        data-sample-entry-study-controls
      >
        <p className={styles.title}>
          Sample Set / Entry points<span>Multiple routes, one destination</span>
        </p>
        <div className={styles.field}>
          <label htmlFor={`${id}-direction`}>Entry point direction</label>
          <select
            id={`${id}-direction`}
            value={direction}
            disabled={busy}
            onChange={(event) =>
              updatePreview(event.target.value as SampleEntryDirection, context)
            }
          >
            {sampleEntryDirections.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-context`}>Preview context</label>
          <select
            id={`${id}-context`}
            value={context}
            disabled={busy}
            onChange={(event) =>
              updatePreview(direction, event.target.value as SampleEntryContext)
            }
          >
            <option value="explore">Explore matcha</option>
            <option value="shop">Shop</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-tone`}>Study appearance</label>
          <select
            id={`${id}-tone`}
            value={tone}
            disabled={busy}
            onChange={(event) =>
              changeTone(event.target.value as "light" | "dark")
            }
          >
            <option value="light">Mist</option>
            <option value="dark">Blue hour</option>
          </select>
        </div>
        {context === "explore" && (
          <div className={`${styles.field} ${styles.rightField}`}>
            <label htmlFor={`${id}-right`}>Right-side sample entry</label>
            <select
              id={`${id}-right`}
              value={rightEntry}
              disabled={busy}
              onChange={(event) =>
                updatePreview(
                  direction,
                  context,
                  event.target.value as SampleRightEntry,
                )
              }
            >
              {sampleRightEntries.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Link
          href="/samples-panel-study"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Panel study ↗
        </Link>
        <p className={styles.note}>
          {context === "explore" && rightEntry !== "default"
            ? sampleRightEntries.find((item) => item.value === rightEntry)!
                .description
            : selected.description}
        </p>
        <p className={styles.destination}>
          All sample links open{" "}
          <Link
            href="/samples"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            /samples ↗
          </Link>
        </p>
        {context === "explore" && (
          <div
            className={styles.rightOptions}
            role="group"
            aria-label="New right-side studies"
          >
            {samplePriorityEntries.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={rightEntry === item.value}
                disabled={busy}
                onClick={() => updatePreview(direction, context, item.value)}
              >
                <span>{item.name}</span>
                <span aria-hidden="true">
                  {rightEntry === item.value ? "−" : "+"}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>
      <div
        data-entry-context="explore"
        hidden={context !== "explore"}
        inert={context !== "explore"}
      >
        <SpecimenHero
          contextVisible={context === "explore"}
          tone={tone}
          onToneChange={changeTone}
          startAtSelection
          materialObject="silver-bag"
          introductionVariant="specimen"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          originPreviewVariant="panorama"
          overviewStudyVariant="folded"
          shopPreviewVariant="refined"
          shopExplorationLayout="compact"
          productCodePlacement="register"
          sampleEntryDirection={direction}
          sampleEntryScope={rightEntry === "default" ? "all" : "left"}
          sampleRightEntry={rightEntry}
        />
      </div>
      <div
        data-entry-context="shop"
        hidden={context !== "shop"}
        inert={context !== "shop"}
      >
        <Shop
          sampleEntryDirection={direction}
          studyTone={tone}
          onStudyToneChange={changeTone}
        />
      </div>
    </div>
  );
}
