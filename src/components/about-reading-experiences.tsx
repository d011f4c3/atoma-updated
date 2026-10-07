import Image from "next/image";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import { ScrambleText } from "./scramble-text";
import styles from "./about-reading-experiences.module.css";

type Subject = "approach" | "place" | "community";
type Actions = { onReadStory: () => void; busy: boolean };
type Mode = "map" | "chapters";
const subjects = [
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

function Passage({
  subject,
  onReadStory,
  busy,
}: Actions & { subject: Subject }) {
  if (subject === "approach")
    return (
      <dl className={styles.principles}>
        {content.principles.map((item) => (
          <div key={item.number}>
            <dt>{item.title}</dt>
            <dd>{item.text}</dd>
          </div>
        ))}
      </dl>
    );
  if (subject === "community")
    return (
      <>
        <p>{content.community.body}</p>
        <p className={styles.note}>{content.community.note}</p>
      </>
    );
  return (
    <div className={styles.place}>
      <div className={styles.placeCopy}>
        <p>{content.placeBody}</p>
        <p className={styles.note}>{content.provenanceNote}</p>
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
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <figure data-about-field-stage>
        <div className={styles.photo}>
          <Image
            src={content.fieldStory.image}
            alt={content.fieldStory.imageAlt}
            fill
            sizes="(max-width: 760px) 85vw, 35vw"
          />
        </div>
        <figcaption>{content.fieldStory.imageCaption}</figcaption>
      </figure>
    </div>
  );
}

function Disclosure({
  subject,
  mode,
  ...actions
}: Actions & { subject: (typeof subjects)[number]; mode: Mode }) {
  return (
    <details className={styles.disclosure} data-about-disclosure={subject.id}>
      <summary
        aria-disabled={actions.busy || undefined}
        onClick={(event) => {
          if (actions.busy) event.preventDefault();
        }}
      >
        <span className={styles.number} aria-hidden="true">
          {subject.number}
        </span>
        <span className={styles.summaryTitle}>
          <span className={styles.label}>
            {subject.id === "community"
              ? content.community.status
              : mode === "map"
                ? "Explore"
                : subject.label}
          </span>
          <h2 id={mode + "-" + subject.id}>
            {mode === "map" ? subject.label : subject.title}
          </h2>
        </span>
        <span className={styles.toggle} aria-hidden="true" />
      </summary>
      <section
        className={styles.passage}
        aria-labelledby={mode + "-" + subject.id}
        data-about-section={subject.id}
        data-community-direction={subject.id === "community" ? "" : undefined}
      >
        {mode === "map" && <h3>{subject.title}</h3>}
        {mode === "chapters" && subject.id === "approach" && (
          <p className={styles.lead}>{content.lead}</p>
        )}
        <Passage subject={subject.id} {...actions} />
      </section>
    </details>
  );
}

export function AboutReadingExperience({
  mode,
  ...actions
}: Actions & { mode: Mode }) {
  return (
    <div
      className={styles.experience}
      data-about-composition={mode}
      data-reading-mode={mode}
    >
      {mode === "map" ? (
        <>
          <div className={styles.mapHeading}>
            <span>About ATOMA</span>
            <span>Explore the connections</span>
          </div>
          <div className={styles.network}>
            <header className={styles.hub}>
              <span className={styles.hubMark} aria-hidden="true">
                ◇
              </span>
              <h1>{content.title}</h1>
              <p>{content.lead}</p>
            </header>
            <div className={styles.branches}>
              {subjects.map((subject) => (
                <Disclosure
                  key={subject.id}
                  mode={mode}
                  subject={subject}
                  {...actions}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <header className={styles.cover}>
            <div>
              <p className={styles.label}>Reading ATOMA</p>
              <h1>
                Three chapters.
                <br />
                One material.
              </h1>
            </div>
            <p className={styles.coverNote}>
              A closer look at our selection,
              <br />
              the places we visit,
              <br />
              and the work ahead.
            </p>
          </header>
          <div className={styles.chapterList}>
            {subjects.map((subject) => (
              <Disclosure
                key={subject.id}
                mode={mode}
                subject={subject}
                {...actions}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
