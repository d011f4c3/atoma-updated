import Image from "next/image";
import { aboutFarmPhotographs } from "@/lib/about-photo-stories";
import styles from "./about-approach.module.css";

const principles = [
  {
    number: "01",
    id: "character",
    title: "Character",
    text: "Understand the matcha itself. Its flavour, its texture, and how it behaves in preparation.",
    photograph: aboutFarmPhotographs.leaves,
  },
  {
    number: "02",
    id: "application",
    title: "Application",
    text: "Selected for a specific use — from tea served with water to lattes and recipes.",
    photograph: {
      src: "/images/about/preparation-whisk.webp",
      alt: "A person holding a tea bowl with a bamboo whisk and tea scoop.",
      width: 1200,
      height: 1800,
    },
  },
  {
    number: "03",
    id: "origin",
    title: "Origin",
    text: "Look closer at place, process and people. The material becomes more specific as you go deeper.",
    photograph: aboutFarmPhotographs.landscape,
  },
] as const;

/** Reading stays in normal flow; the photographic sequence uses a reserved stage. */
export function AboutApproach({ t }: { t: (source: string) => string }) {
  return (
    <section
      id="about-approach"
      className={styles.approach}
      aria-labelledby="approach-title"
      data-about-approach
    >
      <header
        className={styles.heading}
        data-about-reveal="rise"
        data-page-reveal="rise"
      >
        <h2 id="approach-title">{t("Our approach")}</h2>
        <span aria-hidden="true">01 — 03</span>
      </header>
      <noscript>
        <style>{`
          [data-about-approach] [data-approach-stage] { display: none !important; }
          [data-about-approach] [data-approach-sequence] { display: block !important; padding-top: 0 !important; }
          [data-about-approach] [data-approach-step] { min-height: 0 !important; padding-block: 2rem !important; }
          [data-about-approach] [data-approach-inline] { display: block !important; position: relative; aspect-ratio: 1; overflow: clip; }
          [data-about-approach] [data-approach-inline] img { display: block; width: 100%; height: 100%; object-fit: cover; }
          @media (min-width: 900px) and (min-height: 650px) {
            [data-about-approach] [data-approach-step] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-content: initial; align-items: center; gap: 2rem; }
          }
        `}</style>
      </noscript>
      <div className={styles.sequence} data-approach-sequence>
        <div className={styles.principles}>
          {principles.map((principle) => (
            <article
              className={styles.step}
              key={principle.id}
              data-approach-step={principle.id}
            >
              <div
                className={styles.copy}
                data-about-reveal="rise"
                data-page-reveal="rise"
              >
                <span className={styles.number} aria-hidden="true">
                  {principle.number}
                </span>
                <h3>{t(principle.title)}</h3>
                <p>{t(principle.text)}</p>
              </div>
              <figure
                className={styles.inlineImage}
                data-approach-inline
                data-about-mobile-visual
                data-about-reveal="fade"
                data-page-reveal="fade"
              >
                <Image
                  src={principle.photograph.src}
                  alt={t(principle.photograph.alt)}
                  width={principle.photograph.width}
                  height={principle.photograph.height}
                  sizes="(max-width: 760px) 90vw, 45vw"
                />
              </figure>
            </article>
          ))}
        </div>
        <div
          className={styles.stage}
          data-approach-stage
          data-page-reveal="fade"
          aria-hidden="true"
        >
          <div className={styles.labels}>
            {principles.map((principle) => (
              <span key={principle.id} data-approach-label={principle.id}>
                <span>{principle.number}</span>
                {t(principle.title)}
              </span>
            ))}
          </div>
          <div className={styles.frame}>
            {principles.map((principle) => (
              <figure
                className={`${styles.plane} ${styles[principle.id]}`}
                key={principle.id}
                data-approach-photo={principle.id}
              >
                <Image
                  src={principle.photograph.src}
                  alt=""
                  loading="eager"
                  width={principle.photograph.width}
                  height={principle.photograph.height}
                  sizes="(max-width: 1400px) 55vw, 740px"
                />
              </figure>
            ))}
          </div>
          <div className={styles.track}>
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
