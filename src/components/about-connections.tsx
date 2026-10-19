import Image from "next/image";
import { aboutFarmPhotographs } from "@/lib/about-photo-stories";
import styles from "./about-connections.module.css";

const perspectives = [
  { label: "Growing", photograph: aboutFarmPhotographs.leaves },
  { label: "Working with tea", photograph: aboutFarmPhotographs.team },
  {
    label: "Preparing",
    photograph: {
      src: "/images/samples/prepared-matcha.webp",
      alt: "A bowl of prepared matcha on a woven mat.",
    },
  },
] as const;

export function AboutConnections({ t }: { t: (source: string) => string }) {
  return (
    <section
      className={styles.connections}
      id="about-company"
      aria-labelledby="connections-title"
      data-about-connections
    >
      <header className={styles.heading}>
        <span className={styles.label}>{t("Connections")}</span>
        <h2 id="connections-title">{t("Understanding is shared.")}</h2>
      </header>
      <div className={styles.perspectives} data-about-connections-stage>
        <svg
          className={styles.horizontalLine}
          viewBox="0 0 1000 1"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path className={styles.track} d="M0 .5H1000" />
          <path className={styles.connection} d="M0 .5H1000" pathLength="1" />
        </svg>
        <svg
          className={styles.verticalLine}
          viewBox="0 0 1 1000"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path className={styles.track} d="M.5 0V1000" />
          <path className={styles.connection} d="M.5 0V1000" pathLength="1" />
        </svg>
        {perspectives.map(({ label, photograph }, index) => (
          <figure className={styles.perspective} key={label}>
            <div className={styles.photograph} data-about-mobile-visual>
              <Image
                src={photograph.src}
                alt={t(photograph.alt)}
                fill
                sizes={
                  index === 1
                    ? "(max-width: 760px) 58vw, (max-width: 1400px) 29vw, 405px"
                    : "(max-width: 760px) 35vw, (max-width: 1400px) 29vw, 405px"
                }
              />
            </div>
            <span className={styles.node} aria-hidden="true" />
            <figcaption className={styles.caption}>
              <span aria-hidden="true">0{index + 1}</span>
              {t(label)}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className={styles.observation}>
        {t(
          "Matcha connects the people who grow it, process it and prepare it. We connect buyers with each step, building understanding and relationships from the growing place to the final preparation.",
        )}
      </p>
    </section>
  );
}
