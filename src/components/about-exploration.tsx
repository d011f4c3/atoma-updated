"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import { powderMask } from "@/lib/powder-mask";
import { HomeHeader } from "./home-header";
import { ThemeSwitcher } from "./theme-switcher";
import { ScrambleText } from "./scramble-text";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import styles from "./about-exploration.module.css";

const applications = [
  {
    number: "01",
    code: "WZKA-00",
    use: "With water",
    title: "Room for character.",
    body: "Ceremonial Matcha, selected for tea service. A place to begin with the flavour and texture of matcha itself.",
    product: "Ceremonial Matcha",
  },
  {
    number: "02",
    code: "UJI-00",
    use: "With milk",
    title: "Part of the everyday.",
    body: "Barista Matcha, selected for lattes. Considered in the company of milk, for the drinks that cafés make every day.",
    product: "Barista Matcha",
  },
  {
    number: "03",
    code: "UJI-01",
    use: "In a recipe",
    title: "An ingredient with intent.",
    body: "Culinary Matcha, selected for recipes and baking. Its role begins with what you want to make.",
    product: "Culinary Matcha",
  },
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function AboutExploration({ compact = false }: { compact?: boolean }) {
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [mask, setMask] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void powderMask("/images/matcha/tea-service.jpg").then((value) => {
      if (mounted) setMask(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const place = placeRef.current;
    if (!root || !stage || !place) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 760px)");
    let frame = 0;
    let observer: IntersectionObserver | undefined;

    function update() {
      frame = 0;
      if (!root || !stage || !place || motion.matches) return;
      const stageRect = stage.getBoundingClientRect();
      const progress = clamp(
        compact
          ? (window.innerHeight - stageRect.top) /
              (window.innerHeight + stageRect.height)
          : -stageRect.top / Math.max(1, stageRect.height - window.innerHeight),
      );
      const heroProgress = clamp(window.scrollY / window.innerHeight);
      const placeRect = place.getBoundingClientRect();
      const placeProgress = clamp(
        (window.innerHeight - placeRect.top) /
          (window.innerHeight + placeRect.height),
      );
      root.style.setProperty(
        "--hero-shift",
        `${heroProgress * (compact ? 30 : 100)}px`,
      );
      root.style.setProperty("--hero-turn", `${heroProgress * 9}deg`);
      root.style.setProperty("--application-progress", String(progress));
      root.style.setProperty(
        "--image-turn",
        `${progress * (compact ? 4 : 14) - (compact ? 2 : 7)}deg`,
      );
      root.style.setProperty(
        "--image-scale",
        String(1.05 + progress * (compact ? 0.03 : 0.12)),
      );
      root.style.setProperty(
        "--place-shift",
        `${(placeProgress - 0.5) * (mobile.matches ? 30 : 90)}px`,
      );
      setActive(Math.min(2, Math.floor(progress * 3)));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function syncMotion() {
      if (!root) return;
      observer?.disconnect();
      root.dataset.motion = motion.matches ? "off" : "on";
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (motion.matches) return;
      const reveals = root.querySelectorAll<HTMLElement>("[data-reveal]");
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).dataset.entered = "true";
              observer?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12 },
      );
      for (const element of reveals) observer.observe(element);
      schedule();
    }

    syncMotion();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", syncMotion);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", syncMotion);
    };
  }, [compact]);

  function readFieldStory() {
    if (!busy)
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
      data-about-exploration
      data-scale={compact ? "compact" : "original"}
      data-tone={tone}
      data-storefront-theme={tone}
      data-motion="off"
    >
      <HomeHeader tone={tone} persistentTheme />
      <main lang="en">
        <div className={styles.edition}>
          <span>About ATOMA</span>
          <span>Material, use, place</span>
          <div className={styles.editionControls}>
            <span>01 — 03</span>
            <ThemeSwitcher />
          </div>
        </div>
        <section
          className={styles.hero}
          aria-labelledby="about-exploration-title"
        >
          <span className={styles.heroWordmark} aria-hidden="true">
            ATOMA
          </span>
          <div className={styles.orbit} aria-hidden="true" />
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={styles.cross}
              data-position={index}
              aria-hidden="true"
            >
              +
            </span>
          ))}
          <h1 id="about-exploration-title" className={styles.heroTitle}>
            <span>A closer</span>
            <span>look.</span>
          </h1>
          <div className={styles.heroMaterial} data-mask-ready={Boolean(mask)}>
            <Image
              src="/images/matcha/tea-service.jpg"
              alt="A stroke of vivid green matcha powder."
              fill
              priority
              sizes="(max-width: 760px) 100vw, 75vw"
              style={
                mask
                  ? { maskImage: `url(${mask})`, maskSize: "100% 100%" }
                  : undefined
              }
            />
          </div>
          <div className={styles.heroFoot}>
            <p>
              Matcha, considered.
              <br />
              From the material to what you make.
            </p>
            <a href="#approach">
              Scroll to explore <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section
          id="approach"
          className={`${styles.intro} ${styles.reveal}`}
          data-reveal
        >
          <p className={styles.introLabel}>01 / A point of view</p>
          <h2 className={styles.introStatement}>
            Good matcha begins with
            <br />
            <span>what you want to make.</span>
          </h2>
          <p className={styles.introAside}>
            We select for flavour, texture and performance. Then make the
            differences clear, so each matcha can find its place in a cup, a
            café or a recipe.
          </p>
        </section>

        <section
          className={styles.applications}
          aria-labelledby="applications-heading"
        >
          <div className={styles.sectionTop}>
            <h2 id="applications-heading">
              One material. Different possibilities.
            </h2>
            <span>Selected for an application</span>
          </div>
          <div
            ref={stageRef}
            className={styles.applicationStage}
            data-active={active}
          >
            <div className={styles.applicationSticky}>
              <div className={styles.applicationVisual}>
                <Image
                  src="/images/hero/matcha-macro-v2.webp"
                  alt="An illustrative study of matcha texture."
                  fill
                  sizes="(max-width: 760px) 90vw, 55vw"
                />
              </div>
              <div className={styles.applicationReading}>
                {applications.map((application, index) => (
                  <article
                    key={application.code}
                    className={styles.applicationSlide}
                    data-active={active === index}
                  >
                    <span>
                      {application.number} / {application.use}
                    </span>
                    <h3>{application.title}</h3>
                    <p>{application.body}</p>
                    <div>
                      <span>◇ {application.code}</span>
                      <span>{application.product}</span>
                    </div>
                  </article>
                ))}
              </div>
              <div className={styles.applicationCounter} aria-hidden="true">
                <span>{String(active + 1).padStart(2, "0")}</span>
                <span />
                <span>03</span>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={placeRef}
          className={styles.place}
          aria-labelledby="place-heading"
        >
          <div className={styles.placeImage}>
            <Image
              src={content.fieldStory.image}
              alt={content.fieldStory.imageAlt}
              fill
              sizes="100vw"
            />
          </div>
          <div className={styles.placeTitle}>
            <span>02 / Beyond the material</span>
            <h2 id="place-heading">
              A place.
              <br />A closer connection.
            </h2>
          </div>
          <p>
            {content.fieldStory.imageCaption}
            <span>Field observations / Japan</span>
          </p>
        </section>
        <div className={`${styles.placeCopy} ${styles.reveal}`} data-reveal>
          <p>{content.provenanceNote}</p>
          <div>
            <h3>From material to place.</h3>
            <p>{content.placeBody}</p>
            <button type="button" onClick={readFieldStory} disabled={busy}>
              Read the field notes <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        <section
          className={`${styles.community} ${styles.reveal}`}
          data-reveal
          aria-labelledby="community-heading"
        >
          <span className={styles.communityMark} aria-hidden="true">
            03
          </span>
          <div className={styles.communityText}>
            <span>{content.community.status}</span>
            <h2 id="community-heading">
              Relationships
              <br />
              take time.
            </h2>
            <p>{content.community.body}</p>
            <small>{content.community.note}</small>
          </div>
        </section>
        <section
          className={styles.closing}
          aria-label="Explore the matcha collection"
        >
          <p>Find the matcha for what you make.</p>
          <Link
            href="/shop"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <span>Explore matcha</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <div className={styles.closingFoot}>
            <span>
              <ScrambleText text="CAREFULLY SPECIFIED MATCHA." interactive />
            </span>
            <Link
              href="/about-study"
              aria-disabled={busy || undefined}
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Earlier About studies ↗
            </Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer} lang="en">
        <Link
          href="/"
          aria-label="ATOMA homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          ATOMA
        </Link>
        <span>About exploration / 2026</span>
        <a href="#about-exploration-title">Back to top ↑</a>
      </footer>
    </div>
  );
}
