"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { ScrambleText } from "./scramble-text";
import { SheetInformation } from "./sheet-information";
import styles from "./inspection-stage-hero.module.css";

type View = "object" | "powder" | "surface";

const views = [
  { id: "object", number: "01", label: "Object" },
  { id: "powder", number: "02", label: "Powder" },
  { id: "surface", number: "03", label: "Surface" },
] as const;

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function documentIsHidden() {
  return document.hidden;
}

function serverIsHidden() {
  return false;
}

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={back ? "M19 12H5m6-6-6 6 6 6" : "M5 12h14m-6-6 6 6-6 6"} />
    </svg>
  );
}

export function InspectionStageHero() {
  const [view, setView] = useState<View>("object");
  const [position, setPosition] = useState(50);
  const hidden = useSyncExternalStore(
    subscribeToVisibility,
    documentIsHidden,
    serverIsHidden,
  );
  const surface = view === "surface";
  const activeView = views.find((item) => item.id === view) ?? views[0];
  const nextView: View =
    view === "object" ? "powder" : view === "powder" ? "surface" : "object";
  const nextLabel = surface
    ? "RETURN TO OBJECT"
    : view === "object"
      ? "EXAMINE THE POWDER"
      : "INSPECT THE SURFACE";

  function selectView(next: View) {
    setView(next);
    setPosition(50);
  }

  return (
    <main
      className={styles.hero}
      data-concept="07"
      data-view={view}
      data-visibility={hidden ? "hidden" : "visible"}
      style={{ "--surface-position": `${position}%` } as CSSProperties}
    >
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="ATOMA home">
          ATOMA
        </Link>
        <span className={styles.headerRule} aria-hidden="true" />
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link href="/concept-07" aria-current="page">
            <span className={styles.currentMark} aria-hidden="true" />
            <ScrambleText text="MATCHA" delay={180} interactive />
          </Link>
          <SheetInformation tone="light" />
        </nav>
      </header>

      <section className={styles.stage} aria-label="Explore matcha">
        <div className={styles.introduction}>
          <span className={styles.eyebrow}>
            <ScrambleText text="ATOMA / MATCHA" delay={260} />
          </span>
          <h1>
            Carefully specified
            <br />
            matcha.
          </h1>
        </div>

        <div className={styles.plate} aria-hidden="true">
          <div className={styles.plateEdge} />
          <div className={styles.centerLine} />
          <div className={styles.guideRail} />
          <div className={styles.guideRail} />
        </div>

        <div className={styles.imageWindow}>
          <div className={styles.vesselLayer} aria-hidden={view !== "object"}>
            <div className={styles.vesselAssembly}>
              <div className={styles.vesselBase}>
                <Image
                  src="/images/hero/matcha-vessel-light-v3.webp"
                  alt="Fine green matcha in a silver vessel with its lid suspended above."
                  fill
                  preload
                  sizes="(max-width: 700px) 130vw, 80vw"
                />
              </div>
              <div className={styles.vesselLid} aria-hidden="true">
                <Image
                  src="/images/hero/matcha-vessel-light-v3.webp"
                  alt=""
                  fill
                  sizes="(max-width: 700px) 130vw, 80vw"
                />
              </div>
            </div>
          </div>
          <div className={styles.trayLayer} aria-hidden={view !== "powder"}>
            <div className={styles.trayMotion}>
              <Image
                src="/images/hero/matcha-tray-concept-02.webp"
                alt="Fine green matcha presented in a shallow silver tray."
                fill
                sizes="(max-width: 700px) 110vw, 80vw"
                className={styles.trayImage}
              />
            </div>
          </div>
          <div className={styles.surfaceLayer} aria-hidden={!surface}>
            <Image
              src="/images/hero/matcha-macro-v2.webp"
              alt="A close view of softly ridged, finely sifted matcha powder."
              fill
              sizes="(max-width: 700px) 90vw, 65vw"
              className={styles.surfaceImage}
            />
            <span className={styles.surfaceCenter} aria-hidden="true" />
          </div>
        </div>

        <span className={styles.edgeLabel} aria-hidden="true">
          <ScrambleText text={`MATCHA / ${view.toUpperCase()}`} delay={500} />
        </span>
        <div className={styles.viewReadout} aria-hidden="true">
          <span className={styles.readoutLabel}>VIEW</span>
          <ScrambleText text={activeView.number} delay={420} />
          <span className={styles.readoutTotal}>/ 03</span>
        </div>
        <div className={styles.registration} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.stageBottom}>
          <button
            type="button"
            className={styles.inspectButton}
            onClick={() => selectView(nextView)}
          >
            <span className={styles.inspectIcon} aria-hidden="true">
              {surface ? "−" : "+"}
            </span>
            <ScrambleText text={nextLabel} delay={720} interactive />
          </button>
          {surface && (
            <label className={styles.panControl}>
              <span>MOVE THROUGH THE SURFACE</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={position}
                aria-label="Surface view position"
                aria-valuetext={
                  position < 35 ? "Left" : position > 65 ? "Right" : "Centre"
                }
                onChange={(event) => setPosition(Number(event.target.value))}
              />
            </label>
          )}
        </div>
      </section>

      <footer className={styles.controls}>
        <div className={styles.controlLabel}>
          <span className={styles.controlDot} aria-hidden="true" />
          <span>TAKE A CLOSER LOOK</span>
        </div>
        <div
          className={styles.viewControls}
          role="group"
          aria-label="Matcha views"
        >
          {views.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={view === item.id}
              onClick={() => selectView(item.id)}
            >
              <span className={styles.viewNumber} aria-hidden="true">
                <ScrambleText text={item.number} delay={460} interactive />
              </span>
              <ScrambleText
                text={item.label.toUpperCase()}
                delay={540}
                interactive
              />
              <span className={styles.selectedMark} aria-hidden="true" />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.nextView}
          aria-label={nextLabel.toLowerCase()}
          onClick={() => selectView(nextView)}
        >
          <Arrow back={surface} />
        </button>
      </footer>
      <p className={styles.screenReaderOnly} role="status" aria-live="polite">
        {surface
          ? "Surface view. Use the slider to move across the matcha image."
          : view === "object"
            ? "Object view. Matcha in a silver vessel with its lid suspended above."
            : "Powder view. Matcha in a shallow silver tray."}
      </p>
    </main>
  );
}
