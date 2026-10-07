"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import styles from "./about-sequence.module.css";

const steps = [
  {
    id: "approach",
    number: "01",
    label: "Selection",
    title: content.approachTitle,
  },
  { id: "place", number: "02", label: "Place", title: content.placeTitle },
  {
    id: "community",
    number: "03",
    label: "Community",
    title: content.community.title,
  },
] as const;

export function AboutSequence({
  onReadStory,
  busy,
}: {
  onReadStory: () => void;
  busy: boolean;
}) {
  const [active, setActive] = useState(0);
  const currentStep = steps[active] ?? steps[0];
  const id = useId();
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  const focusPending = useRef(false);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    headings.current[active]?.focus();
  }, [active]);

  function selectStep(index: number) {
    if (busy || index === active || index < 0 || index >= steps.length) return;
    focusPending.current = true;
    setActive(index);
  }

  return (
    <div
      className={styles.sequence}
      data-about-composition="sequence"
      lang="en"
    >
      <header className={styles.heading}>
        <p className={styles.label}>About ATOMA / A guided reading</p>
        <h1>{content.title}</h1>
      </header>

      <nav className={styles.progress} aria-label="About reading steps">
        <ol>
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                className={styles.stepButton}
                type="button"
                aria-current={active === index ? "step" : undefined}
                aria-controls={`${id}-${step.id}`}
                disabled={busy}
                data-about-sequence-step={step.id}
                data-about-subject-button={step.id}
                onClick={() => selectStep(index)}
              >
                <span className={styles.stepNumber} aria-hidden="true">
                  {step.number}
                </span>
                <span>{step.label}</span>
                <span className={styles.marker} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.pages}>
        {steps.map((step, index) => (
          <section
            className={styles.page}
            key={step.id}
            id={`${id}-${step.id}`}
            aria-labelledby={`${id}-${step.id}-title`}
            hidden={active !== index}
            data-about-section={step.id}
            data-community-direction={step.id === "community" ? "" : undefined}
          >
            <div className={styles.copy}>
              <p className={styles.label}>
                {step.number} /{" "}
                {step.id === "community"
                  ? content.community.status
                  : step.label}
              </p>
              <h2
                id={`${id}-${step.id}-title`}
                ref={(element) => {
                  headings.current[index] = element;
                }}
                tabIndex={-1}
              >
                {step.title}
              </h2>
              {step.id === "approach" && <p>{content.lead}</p>}
              {step.id === "place" && (
                <>
                  <p>{content.placeBody}</p>
                  <p className={styles.note}>{content.provenanceNote}</p>
                  <button
                    className={styles.action}
                    type="button"
                    disabled={busy}
                    onClick={onReadStory}
                    data-about-field-story
                  >
                    Read the fieldnotes <span aria-hidden="true">↗</span>
                  </button>
                </>
              )}
              {step.id === "community" && (
                <p className={styles.note}>{content.community.note}</p>
              )}
            </div>

            {step.id === "approach" && (
              <dl className={styles.principles}>
                {content.principles.map((principle) => (
                  <div key={principle.number}>
                    <dt>
                      <span aria-hidden="true">{principle.number}</span>
                      {principle.title}
                    </dt>
                    <dd>{principle.text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {step.id === "place" && (
              <figure className={styles.field} data-about-field-stage>
                <div className={styles.photo}>
                  <Image
                    src={content.fieldStory.image}
                    alt={content.fieldStory.imageAlt}
                    fill
                    sizes="(max-width: 760px) 88vw, 48vw"
                  />
                </div>
                <figcaption>{content.fieldStory.imageCaption}</figcaption>
              </figure>
            )}
            {step.id === "community" && (
              <div className={styles.future}>
                <span className={styles.futureMark} aria-hidden="true">
                  ◇
                </span>
                <p>{content.community.body}</p>
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className={styles.navigation}>
        <button
          type="button"
          aria-label="Previous section"
          disabled={busy || active === 0}
          onClick={() => selectStep(active - 1)}
          data-about-sequence-previous
        >
          <span aria-hidden="true">←</span> Previous
        </button>
        <p role="status" aria-live="polite" aria-atomic="true">
          <span className={styles.statusLabel}>{currentStep.label} · </span>
          {currentStep.number} / 03
        </p>
        <button
          type="button"
          aria-label="Next section"
          disabled={busy || active === steps.length - 1}
          onClick={() => selectStep(active + 1)}
          data-about-sequence-next
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
