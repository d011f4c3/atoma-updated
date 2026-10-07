"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./about-content.module.css";

const entries = [
  {
    number: "01",
    title: "Character",
    text: "Understand the matcha itself. Its flavour, its texture, and how it behaves in preparation.",
  },
  {
    number: "02",
    title: "Application",
    text: "Selected for a specific use — from tea served with water to lattes and recipes.",
  },
  {
    number: "03",
    title: "Origin",
    text: "Look closer at place, process and people. The material becomes more specific as you go deeper.",
  },
];

export function AboutContent({ headingId }: { headingId: string }) {
  const { t } = useStorefrontLocale();
  return (
    <div className={styles.root} data-about-content>
      <div className={styles.introduction}>
        <h2 id={headingId} className={styles.heading}>
          {t("Matcha,")} <br />
          {t("in detail.")}
        </h2>
        <p className={styles.lead}>
          {t(
            "ATOMA approaches matcha as a material. Flavour, texture and performance define the starting point; intended use gives them context.",
          )}
        </p>
      </div>
      <div className={styles.entries}>
        {entries.map((entry) => (
          <section key={entry.number} className={styles.entry}>
            <div className={styles.entryHeading}>
              <span className={styles.number} aria-hidden="true">
                {entry.number}
              </span>
              <h3>{t(entry.title)}</h3>
            </div>
            <p>{t(entry.text)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
