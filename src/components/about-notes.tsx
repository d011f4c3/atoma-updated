"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { useOrigins } from "./origins-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ThemeSwitcher } from "./theme-switcher";
import styles from "./about-notes.module.css";

const applications = [
  { code: "WZKA-00", name: "Ceremonial Matcha", use: "Tea service" },
  { code: "UJI-00", name: "Barista Matcha", use: "Lattes" },
  { code: "UJI-01", name: "Culinary Matcha", use: "Recipes & baking" },
] as const;

export function AboutNotes() {
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;

    function syncMotion() {
      if (!root) return;
      observer?.disconnect();
      root.dataset.motion = motion.matches ? "off" : "on";
      if (motion.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.entered = "true";
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.1 },
      );
      for (const section of root.querySelectorAll("[data-notes-reveal]"))
        observer.observe(section);
    }

    syncMotion();
    motion.addEventListener("change", syncMotion);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", syncMotion);
    };
  }, []);

  function readFieldNotes() {
    if (busy) return;
    openOrigins({
      tone,
      entry: content.fieldStory.slug,
      returnLabel: "Back to About",
    });
  }

  return (
    <div
      ref={rootRef}
      className={styles.page}
      data-about-notes
      data-tone={tone}
      data-storefront-theme={tone}
      data-motion="off"
    >
      <HomeHeader tone={tone} persistentTheme />
      <div className={styles.edition}>
        <span lang="en">About ATOMA</span>
        <span className={styles.editionNote} lang="en">
          Notes on selection
        </span>
        <ThemeSwitcher />
      </div>

      <main className={styles.notebook} lang="en">
        <section className={styles.opening} aria-labelledby="notes-title">
          <p className={styles.eyebrow}>Material / Application / Place</p>
          <h1 id="notes-title" tabIndex={-1}>
            A few notes
            <br />
            on matcha.
          </h1>
          <p className={styles.lead}>{content.lead}</p>
          <figure className={styles.specimen}>
            <div className={styles.specimenImage}>
              <Image
                src="/images/matcha/tea-service.jpg"
                alt="A narrow stroke of green matcha powder on a pale surface."
                fill
                preload
                sizes="(max-width: 560px) 112px, 192px"
              />
            </div>
            <figcaption>Matcha / A material study</figcaption>
          </figure>
          <a className={styles.contentsLink} href="#notes-selection">
            Begin with the application <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section
          id="notes-selection"
          className={`${styles.entry} ${styles.ruled} ${styles.reveal}`}
          aria-labelledby="notes-selection-title"
          data-notes-reveal
        >
          <aside className={styles.marginNote}>
            <span className={styles.sectionNumber}>01</span>
            <p>How we select</p>
            <dl className={styles.principles}>
              {content.principles.map((principle) => (
                <div key={principle.number}>
                  <dt>{principle.title}</dt>
                  <dd>{principle.text}</dd>
                </div>
              ))}
            </dl>
          </aside>
          <div className={styles.reading}>
            <h2 id="notes-selection-title">{content.approachTitle}</h2>
            <p>
              A cup of matcha, a latte, a recipe. Each asks something different
              of the material. We make those differences clear, so the selection
              begins with what you want to make.
            </p>
            <ul className={styles.applicationList} aria-label="Matcha by use">
              {applications.map((application) => (
                <li key={application.code}>
                  <span className={styles.productCode}>
                    <span aria-hidden="true">◇ </span>
                    {application.code}
                  </span>
                  <h3>{application.name}</h3>
                  <p>{application.use}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className={`${styles.placeEntry} ${styles.ruled} ${styles.reveal}`}
          aria-labelledby="notes-place-title"
          data-notes-reveal
        >
          <div className={styles.placeReading}>
            <p className={styles.sectionLabel}>
              <span className={styles.sectionNumber}>02</span>
              Field notes
            </p>
            <h2 id="notes-place-title">{content.placeTitle}</h2>
            <p>{content.placeBody}</p>
            <button
              className={styles.textAction}
              type="button"
              disabled={busy}
              onClick={readFieldNotes}
            >
              Read the field notes <span aria-hidden="true">↗</span>
            </button>
          </div>
          <figure className={styles.fieldFigure}>
            <div className={styles.fieldImage}>
              <Image
                src={content.fieldStory.image}
                alt={content.fieldStory.imageAlt}
                fill
                sizes="(max-width: 560px) calc(100vw - 40px), (max-width: 900px) 32vw, 272px"
              />
            </div>
            <figcaption>{content.fieldStory.imageCaption}</figcaption>
          </figure>
          <p className={styles.provenance}>{content.provenanceNote}</p>
        </section>

        <section
          className={`${styles.entry} ${styles.ruled} ${styles.reveal}`}
          aria-labelledby="notes-community-title"
          data-notes-reveal
        >
          <aside className={styles.marginNote}>
            <span className={styles.sectionNumber}>03</span>
            <p>{content.community.status}</p>
            <span className={styles.openNote}>An open chapter</span>
          </aside>
          <div className={styles.reading}>
            <h2 id="notes-community-title">{content.community.title}</h2>
            <p>{content.community.body}</p>
            <p className={styles.annotation}>{content.community.note}</p>
          </div>
        </section>

        <section
          className={`${styles.nextPage} ${styles.ruled} ${styles.reveal}`}
          aria-labelledby="notes-next-title"
          data-notes-reveal
        >
          <p className={styles.eyebrow}>From reading to choosing</p>
          <h2 id="notes-next-title">Find the matcha for what you make.</h2>
          <Link
            className={styles.textAction}
            href="/shop"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Explore matcha <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <footer className={styles.footer} lang="en">
        <Link
          className={styles.wordmark}
          href="/"
          aria-label="ATOMA homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          ATOMA
        </Link>
        <span>Notes / About ATOMA</span>
        <a href="#notes-title">Back to top ↑</a>
      </footer>
    </div>
  );
}
