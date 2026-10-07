import Image from "next/image";
import type { ReactNode } from "react";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import { ScrambleText } from "./scramble-text";
import { AboutReadingExperience } from "./about-reading-experiences";
import { AboutVisualIndex } from "./about-visual-index";
import { AboutBroadside } from "./about-broadside";
import { AboutSequence } from "./about-sequence";
import styles from "./about-fieldnotes.module.css";

export type AboutFieldnotesLayout =
  "fieldnotes" | "compact" | "ledger" | "columns" | "broadside" | "sequence";
type Actions = { onReadStory: () => void; busy: boolean };
type Subject = "approach" | "place" | "community";

const chapters = {
  approach: {
    number: "01",
    label: "Our approach",
    title: content.approachTitle,
  },
  place: { number: "02", label: "Place", title: content.placeTitle },
  community: {
    number: "03",
    label: content.community.status,
    title: content.community.title,
  },
} as const;

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 16 16 4M4 4h12v12" />
    </svg>
  );
}

function Introduction({ withLead = true }: { withLead?: boolean }) {
  return (
    <header className={styles.introduction}>
      <h1>{content.title}</h1>
      {withLead && <p className={styles.lead}>{content.lead}</p>}
    </header>
  );
}

function Chapter({
  subject,
  children,
}: {
  subject: Subject;
  children: ReactNode;
}) {
  const chapter = chapters[subject];
  return (
    <section
      className={styles.chapter}
      aria-labelledby={"about-" + subject}
      data-about-section={subject}
      data-community-direction={subject === "community" ? "" : undefined}
    >
      <header className={styles.chapterHeading}>
        <p className={styles.sectionLabel}>
          <span aria-hidden="true">{chapter.number}</span>
          {chapter.label}
        </p>
        <h2 id={"about-" + subject} tabIndex={-1}>
          {chapter.title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Principles() {
  return (
    <dl className={styles.principles}>
      {content.principles.map((item) => (
        <div key={item.number} className={styles.principle}>
          <dt>{item.title}</dt>
          <dd>{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

function Landscape() {
  const field = content.fieldStory;
  return (
    <figure className={styles.landscape} data-about-field-stage>
      <div className={styles.imageMount}>
        <div className={styles.landscapeFrame}>
          <Image
            src={field.image}
            alt={field.imageAlt}
            fill
            sizes="(max-width: 760px) 90vw, (max-width: 1400px) 75vw, 1120px"
          />
        </div>
      </div>
      <figcaption>
        <span>{field.imageCaption}</span>
        <span className={styles.handwritten}>{field.title}</span>
      </figcaption>
    </figure>
  );
}

function Leaf() {
  const leaf = content.fieldStory.sections.find(
    (section) => section.id === "leaf",
  );
  if (!leaf?.image || !leaf.imageAlt) return null;
  return (
    <figure className={styles.leaf}>
      <div className={styles.leafFrame}>
        <Image
          src={leaf.image}
          alt={leaf.imageAlt}
          fill
          sizes="(max-width: 760px) 75vw, 30vw"
        />
      </div>
      <figcaption>{leaf.imageCaption}</figcaption>
    </figure>
  );
}

function PlaceText({ onReadStory, busy }: Actions) {
  return (
    <div className={styles.readingColumn}>
      <p>{content.placeBody}</p>
      <button
        className={styles.action}
        type="button"
        disabled={busy}
        onClick={onReadStory}
        data-about-field-story
      >
        <ScrambleText
          text="Read the fieldnotes"
          interactive
          animateOnMount={false}
          paused={busy}
        />
        <Arrow />
      </button>
    </div>
  );
}

function ImageNote() {
  return <p className={styles.imageNote}>{content.provenanceNote}</p>;
}

function CommunityText() {
  return (
    <div className={styles.readingColumn}>
      <p>{content.community.body}</p>
      <p className={styles.note}>{content.community.note}</p>
    </div>
  );
}

// Each direction owns its sequence and composition. Only editorial primitives
// are shared, so the alternatives cannot collapse into one opening template.
function Essay(actions: Actions) {
  return (
    <div className={styles.essay} data-about-composition="essay">
      <Introduction />
      <Landscape />
      <Chapter subject="approach">
        <Principles />
      </Chapter>
      <Chapter subject="place">
        <div className={styles.essayPlace}>
          <PlaceText {...actions} />
          <Leaf />
          <ImageNote />
        </div>
      </Chapter>
      <Chapter subject="community">
        <CommunityText />
      </Chapter>
    </div>
  );
}

export function AboutFieldnotes({
  layout = "fieldnotes",
  ...actions
}: Actions & { layout?: AboutFieldnotesLayout }) {
  return (
    <article
      className={layout === "fieldnotes" ? styles.article : styles.alternative}
      data-about-direction={layout}
      data-layout={layout}
      lang="en"
    >
      {layout === "fieldnotes" ? (
        <>
          <div className={styles.runningTitle}>
            <span>
              <span className={styles.register} aria-hidden="true" />
              About ATOMA
            </span>
            <span>Material / Place / Community</span>
          </div>
          <Essay {...actions} />
        </>
      ) : layout === "columns" ? (
        <AboutVisualIndex {...actions} />
      ) : layout === "broadside" ? (
        <AboutBroadside {...actions} />
      ) : layout === "sequence" ? (
        <AboutSequence {...actions} />
      ) : (
        <AboutReadingExperience
          mode={layout === "compact" ? "map" : "chapters"}
          {...actions}
        />
      )}
    </article>
  );
}
