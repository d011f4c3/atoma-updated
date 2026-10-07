import Image from "next/image";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import styles from "./about-broadside.module.css";

export function AboutBroadside({
  onReadStory,
  busy,
}: {
  onReadStory: () => void;
  busy: boolean;
}) {
  const field = content.fieldStory;

  return (
    <div className={styles.broadside} data-about-composition="broadside">
      <div className={styles.masthead}>
        <span>About ATOMA</span>
        <span>Selection / Place / Community</span>
      </div>

      <div className={styles.sheet}>
        <header className={styles.statement}>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </header>

        <section
          className={styles.approach}
          aria-labelledby="broadside-approach"
          data-about-section="approach"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.label}>01 / Our approach</p>
            <h2 id="broadside-approach">{content.approachTitle}</h2>
          </div>
          <dl className={styles.principles}>
            {content.principles.map((principle) => (
              <div key={principle.number}>
                <dt>{principle.title}</dt>
                <dd>{principle.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className={styles.place}
          aria-labelledby="broadside-place"
          data-about-section="place"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.label}>02 / Place</p>
            <h2 id="broadside-place">{content.placeTitle}</h2>
          </div>
          <figure data-about-field-stage>
            <div className={styles.photo}>
              <Image
                src={field.image}
                alt={field.imageAlt}
                fill
                sizes="(max-width: 760px) 90vw, (max-width: 1366px) 30vw, 400px"
              />
            </div>
            <figcaption>{field.imageCaption}</figcaption>
          </figure>
          <p>{content.placeBody}</p>
          <button
            className={styles.action}
            type="button"
            disabled={busy}
            onClick={onReadStory}
            data-about-field-story
          >
            Read the fieldnotes <span aria-hidden="true">↗</span>
          </button>
          <p className={styles.note}>{content.provenanceNote}</p>
        </section>

        <section
          className={styles.community}
          aria-labelledby="broadside-community"
          data-about-section="community"
          data-community-direction
        >
          <div className={styles.future}>
            <span className={styles.register} aria-hidden="true" />
            <p className={styles.label}>03 / {content.community.status}</p>
          </div>
          <h2 id="broadside-community">{content.community.title}</h2>
          <div>
            <p>{content.community.body}</p>
            <p className={styles.note}>{content.community.note}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
