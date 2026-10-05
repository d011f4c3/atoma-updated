import styles from "./concept-provenance.module.css";

/** Editorial structure only: no product-linked provenance is published. */
export function ConceptProvenance({ variant }: { variant: "index" | "folio" }) {
  return (
    <div className={styles.root} data-variant={variant}>
      <section
        className={styles.chapter}
        id="origins"
        aria-labelledby="concept-origins-heading"
      >
        <div className={styles.chapterIndex}>
          <span>03</span>
          <span>Origin journal</span>
        </div>
        <div className={styles.content}>
          <div className={styles.editorial}>
            <p className={styles.eyebrow}>Beyond the material</p>
            <h2 id="concept-origins-heading">
              Every material
              <br />
              begins somewhere.
            </h2>
            <p>
              The landscape. The growing conditions. The field. A closer look at
              the place behind the powder.
            </p>
            <div className={styles.status}>
              <span aria-hidden="true">○</span> Origin stories / Not yet
              published
            </div>
            <a href="#people">
              Meet the next chapter <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div
            className={styles.originDiagram}
            aria-label="Origin journal outline: region, locality, field. No product origin records published."
          >
            <div className={styles.region}>
              <span>Region</span>
              <span>—</span>
              <div className={styles.locality}>
                <span>Locality</span>
                <span>—</span>
                <div className={styles.field}>
                  <span>Field</span>
                  <span>—</span>
                </div>
              </div>
            </div>
            <p>Place → Closer → Specific</p>
          </div>
        </div>
      </section>
      <section
        className={styles.chapter}
        id="people"
        aria-labelledby="concept-people-heading"
      >
        <div className={styles.chapterIndex}>
          <span>04</span>
          <span>People & practice</span>
        </div>
        <div className={styles.content}>
          <div className={styles.editorial}>
            <p className={styles.eyebrow}>Behind the material</p>
            <h2 id="concept-people-heading">
              The hands.
              <br />
              The knowledge.
              <br />
              The work.
            </h2>
            <p>
              A space for the people behind matcha, told through their own words
              and the work they do.
            </p>
            <div className={styles.status}>
              <span aria-hidden="true">○</span> Producer stories / Not yet
              published
            </div>
          </div>
          <div className={styles.journal}>
            <p className={styles.eyebrow}>A future field journal</p>
            <div>
              <span>01</span>
              <span>Conversations</span>
              <span aria-hidden="true">—</span>
            </div>
            <div>
              <span>02</span>
              <span>Working notes</span>
              <span aria-hidden="true">—</span>
            </div>
            <div>
              <span>03</span>
              <span>Life in the field</span>
              <span aria-hidden="true">—</span>
            </div>
            <p className={styles.note}>
              No producer profiles have been published for this collection.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
