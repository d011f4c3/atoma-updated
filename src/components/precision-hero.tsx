"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PrecisionScene } from "./precision-scene";
import { ScrambleText } from "./scramble-text";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import styles from "./precision-hero.module.css";

export function PrecisionHero({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [exploreHovered, setExploreHovered] = useState(false);
  const [entry, setEntry] = useState(0);
  const [informationOpen, setInformationOpen] = useState(false);
  const informationRef = useRef<HTMLDialogElement>(null);
  const cycle = usePeriodicGlitch(exploreHovered);
  const currentRoute = tone === "light" ? "/concept-05/light" : "/concept-05";

  function openInformation() {
    setExploreHovered(false);
    informationRef.current?.showModal();
    setInformationOpen(true);
  }

  return (
    <main className={styles.hero} data-concept="05" data-tone={tone}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="ATOMA home">
          ATOMA
        </Link>
        <span className={styles.headerRule} aria-hidden="true" />
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link
            href={currentRoute}
            className={styles.navItem}
            aria-current="page"
          >
            <span className={styles.navIndex} aria-hidden="true">
              01
            </span>
            <ScrambleText text="MATCHA" delay={200} interactive />
            <span className={styles.sectionMark} aria-hidden="true" />
          </Link>
          <button
            className={styles.navItem}
            type="button"
            onClick={openInformation}
            aria-haspopup="dialog"
            aria-controls="atoma-information"
            aria-expanded={informationOpen}
          >
            <span className={styles.navIndex} aria-hidden="true">
              02
            </span>
            <ScrambleText text="ABOUT" delay={350} interactive />
            <span className={styles.navPlus} aria-hidden="true">
              +
            </span>
          </button>
        </nav>
      </header>

      <div className={styles.stage}>
        <PrecisionScene className={styles.scene} tone={tone} />
        <div className={styles.registration} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <span className={styles.stageRule} aria-hidden="true" />
      </div>

      <section className={styles.content} aria-label="Explore matcha">
        <h1 className={styles.heading}>
          <span>Carefully specified</span>
          <span>matcha.</span>
        </h1>
        <div
          className={styles.explore}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            setExploreHovered(true);
            setEntry((previous) => previous + 1);
          }}
          onPointerLeave={() => setExploreHovered(false)}
          onPointerCancel={() => setExploreHovered(false)}
        >
          <span className={styles.exploreIndex} aria-hidden="true">
            <ScrambleText text="01" delay={900} />
          </span>
          <ScrambleText
            key={`${entry}-${cycle}`}
            text="EXPLORE MATCHA"
            delay={entry ? 0 : 1000}
          />
          <span className={styles.arrow} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 19 19 5M5 5h14v14" />
            </svg>
          </span>
        </div>
      </section>
      <footer className={styles.footer}>
        <span aria-hidden="true">
          ATOMA<span className={styles.slash}>/</span>MATCHA
        </span>
        <nav className={styles.toneNavigation} aria-label="Appearance">
          <Link
            href="/concept-05"
            aria-current={tone === "dark" ? "page" : undefined}
          >
            DARK
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/concept-05/light"
            aria-current={tone === "light" ? "page" : undefined}
          >
            LIGHT
          </Link>
        </nav>
      </footer>
      <dialog
        ref={informationRef}
        id="atoma-information"
        className={styles.information}
        aria-labelledby="atoma-information-title"
        onClose={() => setInformationOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex="0"]',
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            informationRef.current?.close();
        }}
      >
        <div className={styles.informationBody}>
          <div>
            <span className={styles.informationLabel}>ABOUT ATOMA</span>
            <h2 id="atoma-information-title">
              A closer look
              <br />
              at matcha.
            </h2>
          </div>
          <div className={styles.informationCopy}>
            <p>An interface for understanding, selecting, and buying matcha.</p>
            <p>
              From the product to its origin, the focus is on what makes each
              matcha distinct.
            </p>
            <dl>
              <div>
                <dt>PRODUCT</dt>
                <dd>MATCHA</dd>
              </div>
              <div>
                <dt>FORM</dt>
                <dd>FINE POWDER</dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            className={styles.closeInformation}
            onClick={() => informationRef.current?.close()}
          >
            <ScrambleText text="CLOSE" interactive />
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </dialog>
    </main>
  );
}
