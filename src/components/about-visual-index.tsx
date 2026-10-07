"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import styles from "./about-visual-index.module.css";

const subjects = [
  { id: "about", number: "01", label: "About", title: content.title },
  {
    id: "selection",
    number: "02",
    label: "Selection",
    title: content.approachTitle,
  },
  { id: "place", number: "03", label: "Place", title: content.placeTitle },
  {
    id: "community",
    number: "04",
    label: "Community",
    title: content.community.title,
  },
] as const;
type Subject = (typeof subjects)[number]["id"];

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 16 16 4M4 4h12v12" />
    </svg>
  );
}

export function AboutVisualIndex({
  onReadStory,
  busy,
}: {
  onReadStory: () => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState<Subject | null>(null);
  const id = useId();
  const triggers = useRef<Partial<Record<Subject, HTMLButtonElement | null>>>(
    {},
  );

  function close() {
    if (busy || !selected) return;
    const trigger = triggers.current[selected];
    setSelected(null);
    trigger?.focus();
  }

  return (
    <div
      className={styles.index}
      data-about-composition="visual-index"
      lang="en"
    >
      <header className={styles.heading}>
        <h1>About ATOMA</h1>
        <p>Select a subject</p>
      </header>

      <div className={styles.sheet}>
        {subjects.map((subject) => (
          <button
            key={subject.id}
            ref={(element) => {
              triggers.current[subject.id] = element;
            }}
            className={styles.tile}
            type="button"
            id={`${id}-subject-${subject.id}`}
            aria-controls={`${id}-passage-${subject.id}`}
            aria-expanded={selected === subject.id}
            aria-label={
              subject.id === "community"
                ? `${subject.label} — ${content.community.status}`
                : subject.label
            }
            disabled={busy}
            data-about-index={subject.id}
            data-about-subject-button={
              subject.id === "selection" ? "approach" : subject.id
            }
            onClick={() =>
              setSelected((current) =>
                current === subject.id ? null : subject.id,
              )
            }
          >
            <span className={styles.tileLabel}>
              <span>{subject.number}</span>
              <span>{subject.label}</span>
            </span>

            {subject.id === "about" && (
              <span className={styles.statement}>{content.title}</span>
            )}
            {subject.id === "selection" && (
              <span className={styles.selection}>
                {content.principles.map((principle) => (
                  <span key={principle.number}>{principle.title}</span>
                ))}
              </span>
            )}
            {subject.id === "place" && (
              <span className={styles.field} data-about-field-stage>
                <span className={styles.imageFrame}>
                  <Image
                    src={content.fieldStory.image}
                    alt={content.fieldStory.imageAlt}
                    fill
                    sizes="(max-width: 760px) 42vw, 23vw"
                  />
                </span>
                <span className={styles.caption}>
                  {content.fieldStory.imageCaption}
                </span>
              </span>
            )}
            {subject.id === "community" && (
              <span className={styles.communityTitle}>
                {content.community.title}
              </span>
            )}

            <span className={styles.tileFoot}>
              <span>
                {subject.id === "community"
                  ? content.community.status
                  : selected === subject.id
                    ? "Close"
                    : "Read"}
              </span>
              <span className={styles.indicator} aria-hidden="true">
                {selected === subject.id ? "−" : "+"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.passages}>
        {subjects.map((subject) => (
          <section
            key={subject.id}
            className={styles.passage}
            id={`${id}-passage-${subject.id}`}
            aria-labelledby={`${id}-heading-${subject.id}`}
            hidden={selected !== subject.id}
            data-about-section={
              subject.id === "selection" ? "approach" : subject.id
            }
            data-community-direction={
              subject.id === "community" ? "" : undefined
            }
          >
            <header className={styles.passageHeading}>
              <p className={styles.label}>
                {subject.number} /{" "}
                {subject.id === "community"
                  ? content.community.status
                  : subject.label}
              </p>
              <h2 id={`${id}-heading-${subject.id}`}>{subject.title}</h2>
              <button
                className={styles.close}
                type="button"
                disabled={busy}
                onClick={close}
                aria-label={`Close ${subject.label.toLowerCase()}`}
              >
                Close <span aria-hidden="true">−</span>
              </button>
            </header>
            <div className={styles.copy}>
              {subject.id === "about" && <p>{content.lead}</p>}
              {subject.id === "selection" && (
                <dl className={styles.principles}>
                  {content.principles.map((principle) => (
                    <div key={principle.number}>
                      <dt>{principle.title}</dt>
                      <dd>{principle.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {subject.id === "place" && (
                <>
                  <p>{content.placeBody}</p>
                  <button
                    className={styles.action}
                    type="button"
                    onClick={onReadStory}
                    disabled={busy}
                    data-about-field-story
                  >
                    Read the fieldnotes <Arrow />
                  </button>
                  <p className={styles.note}>{content.provenanceNote}</p>
                </>
              )}
              {subject.id === "community" && (
                <>
                  <p>{content.community.body}</p>
                  <p className={styles.note}>{content.community.note}</p>
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
