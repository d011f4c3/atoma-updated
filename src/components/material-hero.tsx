"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { ScrambleText } from "./scramble-text";
import styles from "./material-hero.module.css";

type View = "object" | "material";

const views = [
  { id: "object", number: "01", label: "MATCHA", detail: "OBJECT" },
  { id: "material", number: "02", label: "MATERIAL", detail: "POWDER" },
] as const;

function InspectionGuides() {
  return (
    <svg
      className={styles.guides}
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path className={styles.axis} d="M500 22v556M20 350h960" />
      <path d="M20 40V20h24m912 0h24v20M20 560v20h24m912 0h24v-20" />
      <path d="M20 450h138l72-44m750-216H866l-72 44" />
      <circle cx="230" cy="406" r="3" />
      <circle cx="794" cy="234" r="3" />
      <path d="M490 22h20M490 578h20M20 340v20m960-20v20" />
    </svg>
  );
}

export function MaterialHero() {
  const [view, setView] = useState<View>("object");
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const material = view === "material";

  function moveScene(event: PointerEvent<HTMLButtonElement>) {
    if (
      paused ||
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    sceneRef.current?.style.setProperty("--pointer-x", `${x * 10}px`);
    sceneRef.current?.style.setProperty("--pointer-y", `${y * 7}px`);
  }

  function resetScene() {
    sceneRef.current?.style.setProperty("--pointer-x", "0px");
    sceneRef.current?.style.setProperty("--pointer-y", "0px");
  }

  function closeMenu(restoreFocus = false) {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }

  function selectView(next: View) {
    resetScene();
    setView(next);
    closeMenu(menuOpen);
  }

  function toggleMotion() {
    resetScene();
    setPaused(!paused);
  }

  return (
    <main
      className={styles.hero}
      data-view={view}
      data-motion={paused ? "paused" : "running"}
      data-menu={menuOpen ? "open" : "closed"}
    >
      <header
        className={styles.header}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            event.preventDefault();
            closeMenu(true);
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) closeMenu();
        }}
      >
        <button
          type="button"
          className={styles.wordmark}
          aria-label="ATOMA home"
          onClick={() => selectView("object")}
        >
          ATOMA
        </button>

        <nav className={styles.primaryNav} aria-label="Primary">
          {views.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={styles.navItem}
              aria-label={`View ${item.label.toLowerCase()}`}
              aria-pressed={view === item.id}
              onClick={() => selectView(item.id)}
            >
              <span className={styles.navNumber}>
                <ScrambleText
                  text={item.number}
                  paused={paused}
                  delay={120 + index * 90}
                  interactive
                />
              </span>
              <ScrambleText
                text={item.label}
                paused={paused}
                delay={160 + index * 90}
                interactive
              />
            </button>
          ))}
        </nav>

        <button
          type="button"
          ref={menuButtonRef}
          className={styles.menuButton}
          aria-label={menuOpen ? "Close index" : "Open index"}
          aria-expanded={menuOpen}
          aria-controls="atoma-index"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <ScrambleText
            text={menuOpen ? "CLOSE" : "INDEX"}
            paused={paused}
            delay={320}
            interactive
          />
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>

        <nav
          id="atoma-index"
          className={styles.indexPanel}
          aria-label="Index"
          hidden={!menuOpen}
        >
          {menuOpen &&
            views.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={styles.indexItem}
                aria-pressed={view === item.id}
                onClick={() => selectView(item.id)}
              >
                <span className={styles.indexMeta}>
                  <ScrambleText
                    text={item.number}
                    paused={paused}
                    delay={80 + index * 60}
                    interactive
                  />
                  <span>{item.detail}</span>
                </span>
                <span className={styles.indexTitle}>
                  <ScrambleText
                    text={item.label}
                    paused={paused}
                    delay={120 + index * 60}
                    interactive
                  />
                  <span aria-hidden="true">↗</span>
                </span>
              </button>
            ))}
        </nav>
      </header>

      {menuOpen && (
        <button
          type="button"
          className={styles.menuBackdrop}
          tabIndex={-1}
          aria-label="Dismiss index"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => closeMenu(true)}
        />
      )}

      <section className={styles.experience} aria-label="Explore matcha">
        <div className={styles.stage}>
          <h1 className={styles.heroCopy}>
            <span>Matcha,</span>
            <span>by specification.</span>
          </h1>
          <InspectionGuides />
          <div className={styles.scene} ref={sceneRef}>
            <div className={styles.sceneDrift}>
              <div
                className={`${styles.imageLayer} ${styles.objectLayer}`}
                aria-hidden={material}
              >
                <div className={styles.vesselBase}>
                  <Image
                    src="/images/hero/matcha-vessel-light-v3.webp"
                    alt="An open brushed metal vessel holds fine green matcha, with its lid suspended above."
                    fill
                    preload
                    sizes="(max-width: 700px) 144vw, 80vw"
                    className={styles.objectImage}
                  />
                </div>
                <div className={styles.vesselLid} aria-hidden="true">
                  <Image
                    src="/images/hero/matcha-vessel-light-v3.webp"
                    alt=""
                    fill
                    sizes="(max-width: 700px) 144vw, 80vw"
                    className={styles.objectImage}
                  />
                </div>
              </div>
              <div
                className={`${styles.imageLayer} ${styles.materialLayer}`}
                aria-hidden={!material}
              >
                <div className={styles.aperture}>
                  <Image
                    src="/images/hero/matcha-macro-v2.webp"
                    alt="A close view of smooth, finely sifted green matcha powder."
                    fill
                    sizes="(max-width: 700px) 85vw, 50vw"
                    className={styles.macroImage}
                  />
                </div>
                <span className={styles.apertureRing} aria-hidden="true" />
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.inspectionSurface}
            aria-label={
              material ? "Return to object view" : "Inspect matcha powder"
            }
            onClick={() => selectView(material ? "object" : "material")}
            onPointerMove={moveScene}
            onPointerLeave={resetScene}
            onBlur={resetScene}
          >
            <span className={styles.inspectionHint} aria-hidden="true">
              <span className={styles.plus} />
              <ScrambleText
                text={material ? "VIEW OBJECT" : "INSPECT POWDER"}
                paused={paused}
                interactive
              />
            </span>
          </button>

          <span className={styles.specimenLabel} aria-hidden="true">
            <ScrambleText
              text={material ? "POWDER" : "MATCHA"}
              paused={paused}
              delay={500}
            />
          </span>
          <span className={styles.detailLabel} aria-hidden="true">
            <ScrambleText
              text={material ? "DETAIL" : "OBJECT"}
              paused={paused}
              delay={620}
            />
          </span>
        </div>

        <div className={styles.bottomRow}>
          <div
            className={styles.viewIndex}
            aria-label={`View ${material ? "2" : "1"} of 2`}
          >
            <span className={styles.node} aria-hidden="true" />
            <span aria-hidden="true">
              <ScrambleText
                text={material ? "02" : "01"}
                paused={paused}
                delay={250}
              />
              <span className={styles.indexTotal}> / 02</span>
            </span>
          </div>
          <button
            type="button"
            className={styles.inspectButton}
            onClick={() => selectView(material ? "object" : "material")}
          >
            <ScrambleText
              text={material ? "BACK TO OBJECT" : "INSPECT MATERIAL"}
              paused={paused}
              delay={360}
              interactive
            />
            <span className={styles.arrowBox} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 12h15m-6-6 6 6-6 6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      <div className={styles.footnote}>
        <span className={styles.registration} aria-hidden="true">
          <span className={styles.plus} />
          <span />
          <span className={styles.plus} />
        </span>
        <button
          type="button"
          className={styles.motionButton}
          aria-pressed={paused}
          aria-label={paused ? "Resume ambient motion" : "Pause ambient motion"}
          onClick={toggleMotion}
        >
          <span>{paused ? "MOTION PAUSED" : "MOTION ON"}</span>
          <span
            aria-hidden="true"
            className={paused ? styles.playIcon : styles.pauseIcon}
          />
        </button>
      </div>
      <p className={styles.screenReaderOnly} role="status" aria-live="polite">
        {material
          ? "Material view. A closer look at matcha powder."
          : "Object view. Matcha in an open vessel."}
      </p>
    </main>
  );
}
