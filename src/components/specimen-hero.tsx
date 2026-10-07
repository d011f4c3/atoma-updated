"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import type { ProductCodePlacement } from "@/lib/product-display-index";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ProductConfigurator,
  type ProductLabelSnapshot,
} from "./product-configurator";
import type { OriginPreviewVariant } from "./origin-preview";
import type { OverviewStudyVariant } from "./overview-study-panel";
import type { ShopPreviewVariant } from "./shop-preview";
import type { ShopExplorationLayout } from "./shop-exploration-panel";
import type {
  VisualSelectorVariant,
  VisualSectionVariant,
} from "./visual-product-selectors";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader, type NavigationVariant } from "./home-header";
import { ScrambleText } from "./scramble-text";
import { SpecimenField } from "./specimen-field";
import { SilverBagScene } from "./silver-bag-scene";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { HeroLoader } from "./hero-loader";
import { useHeroLoading } from "./use-hero-loading";
import {
  HeroStudyIntroduction,
  type HeroIntroductionDirection,
} from "./hero-study-introduction";
import styles from "./specimen-hero.module.css";
import {
  HeroStudy2Introduction,
  type HeroStudy2Direction,
} from "./hero-study-2-introduction";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

export function SpecimenHero({
  tone: initialTone = "dark",
  storefrontTheme = false,
  initialLoader = false,
  navigationVariant = "default",
  onToneChange,
  selectorVariant = "current",
  sectionSelectorVariant = "current",
  selectorPlacement = "right",
  startAtSelection = false,
  initialProductHandle,
  originPreviewVariant = "current",
  overviewStudyVariant = "current",
  shopPreviewVariant = "current",
  shopExplorationLayout,
  productCodePlacement,
  initialView = "overview",
  materialObject = "powder",
  introductionVariant = "current",
  introductionStudy2Variant,
}: {
  tone?: "dark" | "light";
  storefrontTheme?: boolean;
  initialLoader?: boolean;
  navigationVariant?: NavigationVariant;
  onToneChange?: (tone: "dark" | "light") => void;
  selectorVariant?: "current" | VisualSelectorVariant;
  sectionSelectorVariant?: "current" | VisualSectionVariant;
  selectorPlacement?: "left" | "right";
  startAtSelection?: boolean;
  initialProductHandle?: string;
  originPreviewVariant?: "current" | OriginPreviewVariant;
  overviewStudyVariant?: OverviewStudyVariant;
  shopPreviewVariant?: "current" | "refined" | ShopPreviewVariant;
  shopExplorationLayout?: ShopExplorationLayout;
  productCodePlacement?: ProductCodePlacement;
  initialView?: "overview" | "specifications" | "origins" | "builder";
  materialObject?: "powder" | "silver-bag";
  introductionVariant?: "current" | HeroIntroductionDirection;
  introductionStudy2Variant?: HeroStudy2Direction;
}) {
  const { t } = useStorefrontLocale();
  const theme = useStorefrontTheme();
  const persistentTheme = storefrontTheme && !onToneChange;
  const tone = persistentTheme ? theme.tone : initialTone;
  const heroRef = useRef<HTMLElement>(null);
  const [heroAssetReady, setHeroAssetReady] = useState(false);
  const markHeroReady = useCallback(() => setHeroAssetReady(true), []);
  const intro = useHeroLoading(
    initialLoader && !startAtSelection,
    heroAssetReady,
    heroRef,
  );
  const [exploring, setExploring] = useState(startAtSelection);
  const [opened, setOpened] = useState(startAtSelection);
  const [bagLabel, setBagLabel] = useState<ProductLabelSnapshot>({
    title: "Matcha",
    application: "",
    format: "",
    quantity: 0,
    reference: "",
  });
  const productRequest = useRef(initialProductHandle);
  const [enterPowder, setEnterPowder] = useState(startAtSelection);
  const [handoff, setHandoff] = useState<
    "idle" | "loading" | "moving" | "revealing" | "complete"
  >(startAtSelection ? "complete" : "idle");
  const [trayFrame, setTrayFrame] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const handoffRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const sceneReadyRef = useRef(false);
  const revealHandoffRef = useRef<(() => void) | null>(null);
  const onSceneReady = useCallback(() => {
    sceneReadyRef.current = true;
    revealHandoffRef.current?.();
  }, []);
  const selectionTriggerRef = useRef<HTMLElement | null>(null);
  const exploreRef = useRef<HTMLButtonElement>(null);
  function openSelection() {
    if (exploring) return;
    selectionTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const bounds = trayRef.current?.getBoundingClientRect();
    if (bounds)
      setTrayFrame({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });
    setHandoff("moving");
    setEnterPowder(false);
    setOpened(true);
    setExploring(true);
  }
  function closeSelection() {
    setHandoff("idle");
    setEnterPowder(false);
    setExploring(false);
    requestAnimationFrame(() => {
      const previous = selectionTriggerRef.current;
      const target =
        previous?.isConnected && previous.getClientRects().length
          ? previous
          : exploreRef.current;
      target?.focus({ preventScroll: true });
    });
  }
  const stageRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const hoverCycle = usePeriodicGlitch(hovered);

  useEffect(() => {
    if (
      !initialProductHandle ||
      productRequest.current === initialProductHandle
    )
      return;
    productRequest.current = initialProductHandle;
    const frame = requestAnimationFrame(() => {
      setOpened(true);
      setEnterPowder(true);
      setHandoff("complete");
      setExploring(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialProductHandle]);

  useEffect(() => {
    // Sample the material and prepare the renderer while the visitor reads the
    // hero. It remains inert and hidden until the same in-place flow is opened.
    if ("requestIdleCallback" in window) {
      const task = window.requestIdleCallback(() => setOpened(true), {
        timeout: 400,
      });
      return () => window.cancelIdleCallback(task);
    }
    const task = setTimeout(() => setOpened(true), 100);
    return () => clearTimeout(task);
  }, []);

  useLayoutEffect(() => {
    if (!exploring || !trayFrame) return;
    const tray = handoffRef.current;
    const destination = selectionRef.current?.querySelector<HTMLElement>(
      "[data-product-object]",
    );
    if (!tray || !destination) return;
    let cancelled = false;
    let arrived = false;
    let released = false;
    let movement: Animation | undefined;
    let dissolve: Animation | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      if (!cancelled) setHandoff("complete");
    };
    if (materialObject === "silver-bag") {
      // Hold the photographed package at its exact opening position while the
      // material is prepared. A short dissolve avoids resizing a bag into a
      // differently shaped powder frame or constructing another WebGL scene.
      const revealBag = () => {
        if (cancelled || released || !sceneReadyRef.current) return;
        released = true;
        setEnterPowder(true);
        setHandoff("revealing");
        if (motion.matches) {
          finish();
          return;
        }
        try {
          dissolve = tray.animate(
            [
              { opacity: 1, transform: "translateY(0) scale(1)" },
              { opacity: 0, transform: "translateY(-10px) scale(0.98)" },
            ],
            {
              duration: 480,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "forwards",
            },
          );
          void dissolve.finished.then(finish, finish);
        } catch {
          finish();
        }
      };
      const settle = () => {
        if (motion.matches && released) finish();
      };
      revealHandoffRef.current = revealBag;
      revealBag();
      motion.addEventListener("change", settle);
      return () => {
        cancelled = true;
        if (revealHandoffRef.current === revealBag)
          revealHandoffRef.current = null;
        dissolve?.cancel();
        motion.removeEventListener("change", settle);
      };
    }
    const reveal = () => {
      if (cancelled || !arrived || released || !sceneReadyRef.current) return;
      released = true;
      // Start the pigment and metal dissolve together, in this same turn. A
      // second render/timer would add a visible pause at the destination.
      setEnterPowder(true);
      if (motion.matches) {
        finish();
        return;
      }
      setHandoff("revealing");
      try {
        dissolve = tray.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 220,
          fill: "forwards",
        });
        void dissolve.finished.then(finish, finish);
      } catch {
        finish();
      }
    };
    revealHandoffRef.current = reveal;
    const commitDestination = () => {
      const bounds = destination.getBoundingClientRect();
      Object.assign(tray.style, {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      });
    };
    const arrive = () => {
      if (cancelled) return;
      commitDestination();
      arrived = true;
      movement?.cancel();
      movement = undefined;
      if (sceneReadyRef.current) reveal();
      else setHandoff("loading");
    };
    async function move() {
      if (motion.matches) {
        arrive();
        return;
      }
      const bounds = destination!.getBoundingClientRect();
      const sourceImage = trayRef.current?.querySelector("img");
      const aspect =
        sourceImage?.naturalWidth && sourceImage.naturalHeight
          ? sourceImage.naturalWidth / sourceImage.naturalHeight
          : trayFrame!.width / trayFrame!.height;
      const sourceWidth = Math.min(
        trayFrame!.width,
        trayFrame!.height * aspect,
      );
      const targetWidth = Math.min(bounds.width, bounds.height * aspect);
      const offsetX =
        bounds.left +
        bounds.width / 2 -
        (trayFrame!.left + trayFrame!.width / 2);
      const offsetY =
        bounds.top +
        bounds.height / 2 -
        (trayFrame!.top + trayFrame!.height / 2);
      try {
        // Move the contained photograph with a compositor transform. Resizing
        // its layout box each frame competes with texture/scene initialization.
        movement = tray!.animate(
          [
            {
              transform: "translate(0px, 0px) scale(1)",
            },
            {
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${targetWidth / sourceWidth})`,
            },
          ],
          {
            duration: 620,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          },
        );
        await movement.finished;
        if (!cancelled && !arrived) arrive();
      } catch {
        // The photograph still covers a cold renderer when motion is skipped.
        if (!cancelled && !arrived) arrive();
      }
    }
    const synchronize = () => {
      if (!arrived) arrive();
      else if (!released) commitDestination();
      if (released && motion.matches) finish();
    };
    void move();
    window.addEventListener("resize", synchronize);
    motion.addEventListener("change", synchronize);
    return () => {
      cancelled = true;
      if (revealHandoffRef.current === reveal) revealHandoffRef.current = null;
      movement?.cancel();
      dissolve?.cancel();
      window.removeEventListener("resize", synchronize);
      motion.removeEventListener("change", synchronize);
    };
  }, [exploring, trayFrame, materialObject]);

  useEffect(() => {
    const synchronize = () => setVisible(!document.hidden);
    synchronize();
    document.addEventListener("visibilitychange", synchronize);
    return () => document.removeEventListener("visibilitychange", synchronize);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const cue = cueRef.current;
    if (!stage || !cue) return;

    const pointerPreference = window.matchMedia(
      "(any-hover: hover) and (any-pointer: fine)",
    );
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame: number | undefined;
    let active = false;
    let pointerX = 0;
    let pointerY = 0;

    const cancelFrame = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    };

    const reset = () => {
      cancelFrame();
      active = false;
      setHovered(false);
      stage.style.removeProperty("--pointer-x");
      stage.style.removeProperty("--pointer-y");
      stage.style.removeProperty("--field-x");
      stage.style.removeProperty("--field-y");
      stage.style.removeProperty("--light-x");
      stage.style.removeProperty("--light-y");
    };

    const positionCue = () => {
      frame = undefined;
      const bounds = stage.getBoundingClientRect();
      // Keep the entire annotation inside the frame, including at its corners.
      const insetX = Math.min(cue.offsetWidth / 2 + 12, bounds.width / 2);
      const insetY = Math.min(cue.offsetHeight / 2 + 12, bounds.height / 2);
      const x = Math.max(
        insetX,
        Math.min(bounds.width - insetX, pointerX - bounds.left),
      );
      const y = Math.max(
        insetY,
        Math.min(bounds.height - insetY, pointerY - bounds.top),
      );
      stage.style.setProperty("--pointer-x", `${x}px`);
      stage.style.setProperty("--pointer-y", `${y}px`);
      stage.style.setProperty("--light-x", `${(x / bounds.width) * 100}%`);
      stage.style.setProperty("--light-y", `${(y / bounds.height) * 100}%`);
      stage.style.setProperty("--field-x", `${(x / bounds.width - 0.5) * 8}px`);
      stage.style.setProperty(
        "--field-y",
        `${(y / bounds.height - 0.5) * 6}px`,
      );
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !pointerPreference.matches) return;
      if (!active) {
        active = true;
        setHovered(true);
      }
      if (motionPreference.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === undefined) frame = requestAnimationFrame(positionCue);
    };

    stage.addEventListener("pointerenter", move);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", reset);
    stage.addEventListener("pointercancel", reset);
    pointerPreference.addEventListener("change", reset);
    motionPreference.addEventListener("change", reset);
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);

    return () => {
      cancelFrame();
      stage.removeEventListener("pointerenter", move);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", reset);
      stage.removeEventListener("pointercancel", reset);
      pointerPreference.removeEventListener("change", reset);
      motionPreference.removeEventListener("change", reset);
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);

  return (
    <>
      <main
        ref={heroRef}
        className={styles.hero}
        data-brand-part="hero"
        data-concept="01"
        data-storefront-theme={storefrontTheme ? tone : undefined}
        data-exploring={exploring}
        data-tone={tone}
        data-visible={visible}
        data-handoff={handoff}
        data-material-object={materialObject}
        data-hero-loading={intro.phase === "done" ? undefined : intro.phase}
        data-hero-paused={intro.blocking && intro.phase !== "leaving"}
        inert={intro.blocking}
        aria-busy={intro.blocking}
        onPointerOver={() => setOpened(true)}
        onFocusCapture={() => setOpened(true)}
      >
        <HomeHeader
          persistentTheme={persistentTheme}
          tone={tone}
          onExplore={openSelection}
          onOverview={closeSelection}
          exploring={exploring}
          navigationVariant={navigationVariant}
        />

        <section
          className={styles.composition}
          aria-label={t("Matcha")}
          data-brand-part="composition"
        >
          <div
            className={styles.introduction}
            data-brand-part="introduction"
            inert={exploring}
            aria-hidden={exploring}
          >
            {introductionStudy2Variant ? (
              <HeroStudy2Introduction
                direction={introductionStudy2Variant}
                exploring={exploring}
                onExplore={openSelection}
                exploreRef={exploreRef}
              />
            ) : introductionVariant !== "current" ? (
              <HeroStudyIntroduction
                direction={introductionVariant}
                exploring={exploring}
                onExplore={openSelection}
                exploreRef={exploreRef}
              />
            ) : (
              <>
                <div className={styles.category} data-brand-part="category">
                  <span className={styles.statusDot} aria-hidden="true" />
                  <ScrambleText text={t("MATCHA")} delay={260} periodic />
                </div>
                <div
                  className={styles.introStatement}
                  data-brand-part="statement"
                >
                  <h1 className={styles.heading} data-brand-part="headline">
                    <span>
                      <span>{t("A closer")}</span>
                    </span>
                    <span>
                      <span>{t("look at")}</span>
                    </span>
                    <span>
                      <span>{t("matcha.")}</span>
                    </span>
                  </h1>
                  <p className={styles.introCopy} data-brand-part="intro-copy">
                    <ScrambleText
                      text={t("Flavour. Texture. Performance.")}
                      periodic
                      wrap
                    />
                    <br />
                    <ScrambleText
                      text={t("Matcha selected for a specific application.")}
                      periodic
                      wrap
                    />
                  </p>
                </div>
                <button
                  ref={exploreRef}
                  type="button"
                  aria-expanded={exploring}
                  aria-controls="home-selection"
                  onClick={openSelection}
                  className={styles.exploreLabel}
                  data-brand-part="explore-action"
                >
                  <ScrambleText
                    text={t("EXPLORE MATCHA")}
                    delay={380}
                    interactive
                  />
                  <Arrow />
                </button>
              </>
            )}
          </div>

          <div
            className={styles.viewer}
            data-brand-part="viewer"
            inert={exploring}
            aria-hidden={exploring}
          >
            <div
              className={styles.viewerHeading}
              aria-hidden="true"
              data-brand-part="viewer-heading"
            >
              <span className={styles.ordinal}>
                [ <ScrambleText text="01" delay={420} periodic /> ]
              </span>
              <span className={styles.registrationLine} />
              <ScrambleText text={t("MATCHA")} delay={470} periodic />
            </div>
            <div
              ref={stageRef}
              className={styles.imageStage}
              data-brand-part="image-stage"
              data-hovered={hovered}
            >
              <button
                type="button"
                className={styles.stageButton}
                onClick={openSelection}
                aria-label={
                  materialObject === "silver-bag"
                    ? t("Explore matcha from the silver bag")
                    : t("Explore matcha from the tray")
                }
                tabIndex={exploring ? -1 : 0}
                disabled={exploring}
              />
              <div className={styles.fieldWindow} data-brand-part="field">
                <div className={styles.fieldDepth}>
                  <SpecimenField className={styles.field} />
                </div>
              </div>
              <div
                className={styles.stageLight}
                aria-hidden="true"
                data-brand-part="stage-light"
              />
              {materialObject === "silver-bag" ? (
                <div
                  ref={trayRef}
                  className={`${styles.tray} ${styles.bagTray}`}
                  data-brand-part="bag"
                  aria-hidden="true"
                  inert
                >
                  <SilverBagScene
                    {...bagLabel}
                    appearance="hero"
                    tone={tone}
                    interactive={false}
                    onReady={markHeroReady}
                  />
                </div>
              ) : (
                <>
                  <div
                    className={styles.trayShadow}
                    aria-hidden="true"
                    data-brand-part="tray-shadow"
                  >
                    <div className={styles.trayShadowSource} />
                  </div>
                  <div
                    ref={trayRef}
                    className={styles.tray}
                    data-brand-part="tray"
                  >
                    <Image
                      src="/images/hero/matcha-tray-concept-02.webp"
                      alt={t(
                        "An overhead view of fine green matcha in a shallow rectangular metal tray.",
                      )}
                      fill
                      preload
                      sizes="(max-width: 700px) 110vw, 70vw"
                      className={styles.trayImage}
                      draggable={false}
                      onLoad={markHeroReady}
                      onError={markHeroReady}
                    />
                  </div>
                  <div
                    className={styles.trayReflection}
                    aria-hidden="true"
                    data-brand-part="tray-reflection"
                  />
                </>
              )}
              <div
                className={styles.frame}
                aria-hidden="true"
                data-brand-part="frame"
              >
                <span />
                <span />
                <span />
                <span />
              </div>
              <div
                className={styles.exposureLine}
                aria-hidden="true"
                data-brand-part="exposure-line"
              />
              <div
                ref={cueRef}
                className={styles.exploreCue}
                aria-hidden="true"
                data-brand-part="explore-cue"
              >
                <span
                  className={styles.targetMark}
                  data-brand-part="target-mark"
                />
                <span
                  className={styles.targetLeader}
                  data-brand-part="target-leader"
                />
                <span
                  className={styles.targetLabel}
                  data-brand-part="target-label"
                >
                  <ScrambleText
                    key={hovered ? `active-${hoverCycle}` : "rest"}
                    text={t("EXPLORE MATCHA")}
                  />
                  <Arrow />
                </span>
              </div>
            </div>
            <div
              className={styles.viewerFooter}
              aria-hidden="true"
              data-brand-part="viewer-footer"
            />
          </div>
          <div
            ref={selectionRef}
            id="home-selection"
            className={styles.selection}
            inert={!exploring}
            aria-hidden={!exploring}
          >
            {opened && (
              <ProductConfigurator
                initialProductHandle={initialProductHandle}
                packaging="label"
                materialObject={materialObject}
                tone={tone}
                embedded
                selectorVariant={selectorVariant}
                sectionSelectorVariant={sectionSelectorVariant}
                selectorPlacement={selectorPlacement}
                originPreviewVariant={originPreviewVariant}
                overviewStudyVariant={overviewStudyVariant}
                shopPreviewVariant={shopPreviewVariant}
                shopExplorationLayout={shopExplorationLayout}
                productCodePlacement={productCodePlacement}
                initialView={initialView}
                active={exploring}
                onClose={closeSelection}
                onSceneReady={onSceneReady}
                onLabelChange={
                  materialObject === "silver-bag" ? setBagLabel : undefined
                }
                entryFromTray={materialObject !== "silver-bag"}
                enterPowder={enterPowder}
                entryPending={handoff !== "revealing" && handoff !== "complete"}
                entryLoading={handoff !== "revealing" && handoff !== "complete"}
                entrySettled={handoff === "complete"}
              />
            )}
          </div>
        </section>

        {exploring && trayFrame && handoff !== "complete" && (
          <div
            ref={handoffRef}
            className={`${styles.handoffTray}${materialObject === "silver-bag" ? ` ${styles.handoffBag}` : ""}`}
            style={trayFrame}
            data-handoff-tray
            aria-hidden="true"
            inert={materialObject === "silver-bag"}
          >
            {materialObject === "silver-bag" ? (
              <SilverBagScene
                {...bagLabel}
                appearance="hero"
                tone={tone}
                interactive={false}
              />
            ) : (
              <Image
                src="/images/hero/matcha-tray-concept-02.webp"
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 70vw"
                draggable={false}
              />
            )}
          </div>
        )}

        <footer className={styles.footer} data-brand-part="hero-footer">
          <span className={styles.footerMark} aria-hidden="true">
            <ScrambleText text="ATOMA" periodic />
            <span className={styles.footerDivider}> / </span>
            <ScrambleText text={t("MATCHA")} periodic />
          </span>
          {persistentTheme && <ThemeSwitcher />}
          {!persistentTheme && (
            <nav
              className={styles.themeSwitcher}
              aria-label={t("Appearance")}
              data-brand-part="theme-switcher"
            >
              <Link
                href="/"
                aria-label={t("Dark mode")}
                aria-current={tone === "dark" ? "page" : undefined}
                onNavigate={(event) => {
                  if (onToneChange) {
                    event.preventDefault();
                    onToneChange("dark");
                    return;
                  }
                  theme.setTone("dark");
                }}
              >
                <ScrambleText text={t("DARK")} interactive periodic />
              </Link>
              <span className={styles.themeDivider} aria-hidden="true">
                /
              </span>
              <Link
                href="/"
                aria-label={t("Light mode")}
                aria-current={tone === "light" ? "page" : undefined}
                onNavigate={(event) => {
                  if (onToneChange) {
                    event.preventDefault();
                    onToneChange("light");
                    return;
                  }
                  theme.setTone("light");
                }}
              >
                <ScrambleText text={t("LIGHT")} interactive periodic />
              </Link>
            </nav>
          )}
        </footer>
      </main>
      {intro.phase !== "done" && (
        <HeroLoader progress={intro.progress} phase={intro.phase} tone={tone} />
      )}
      {initialLoader && (
        <noscript>
          <style>{`[data-hero-loader] { display: none !important; }`}</style>
        </noscript>
      )}
    </>
  );
}
