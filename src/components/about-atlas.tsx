"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { aboutStudyContent as content } from "@/lib/about-study-content";
import { HomeHeader } from "./home-header";
import { ThemeSwitcher } from "./theme-switcher";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import styles from "./about-atlas.module.css";

const applications = [
  {
    code: "WZKA-00",
    product: "Ceremonial Matcha",
    use: "With water",
    note: "For tea service.",
  },
  {
    code: "UJI-00",
    product: "Barista Matcha",
    use: "With milk",
    note: "For lattes.",
  },
  {
    code: "UJI-01",
    product: "Culinary Matcha",
    use: "In a recipe",
    note: "For cooking and baking.",
  },
] as const;

export function AboutAtlas() {
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const rootRef = useRef<HTMLDivElement>(null);
  const field = content.fieldStory;
  const leaf = field.sections.find((section) => section.id === "leaf");
  const work = field.sections.find((section) => section.id === "work");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const photographs = root.querySelectorAll<HTMLElement>(
      "[data-atlas-parallax]",
    );
    let observer: IntersectionObserver | undefined;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (motion.matches) return;
      for (const photograph of photographs) {
        const bounds = photograph.getBoundingClientRect();
        const distance =
          (bounds.top + bounds.height / 2 - window.innerHeight / 2) /
          window.innerHeight;
        photograph.style.setProperty(
          "--image-offset",
          `${Math.max(-12, Math.min(12, distance * 18))}px`,
        );
      }
    };
    const schedule = () => {
      if (!motion.matches && !frame) frame = requestAnimationFrame(update);
    };
    const syncMotion = () => {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      root.dataset.motion = motion.matches ? "off" : "on";
      for (const photograph of photographs)
        photograph.style.removeProperty("--image-offset");
      if (motion.matches) return;
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              (entry.target as HTMLElement).dataset.entered = "true";
              observer?.unobserve(entry.target);
            }
          },
          { threshold: 0.15 },
        );
        for (const element of root.querySelectorAll("[data-atlas-reveal]"))
          observer.observe(element);
      }
      schedule();
    };

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
  }, []);

  function readFieldStory() {
    if (!busy)
      openOrigins({ tone, entry: field.slug, returnLabel: "Back to About" });
  }

  return (
    <div
      ref={rootRef}
      className={styles.page}
      data-about-atlas
      data-tone={tone}
      data-storefront-theme={tone}
      data-motion="off"
    >
      <HomeHeader tone={tone} persistentTheme />
      <main className={styles.main} lang="en" id="atlas-top">
        <div className={styles.edition}>
          <span>About ATOMA</span>
          <span>Material / Application / Place</span>
          <ThemeSwitcher />
        </div>

        <header className={styles.introduction}>
          <div>
            <p className={styles.label}>An atlas of matcha</p>
            <h1>
              Matcha,
              <br />
              in context.
            </h1>
          </div>
          <div className={styles.lead}>
            <p>
              We begin with the material. Its flavour, its texture, and how it
              behaves in preparation.
            </p>
            <p>
              Then we look closer: at its use, the places behind it, and the
              people whose work gives it form.
            </p>
          </div>
        </header>

        <section
          className={styles.register}
          aria-labelledby="atlas-application-title"
          data-atlas-reveal
        >
          <div className={styles.registerHeading}>
            <h2 id="atlas-application-title">Selected for an application.</h2>
            <span className={styles.label}>01 / The range</span>
          </div>
          <div className={styles.productRows}>
            {applications.map((application) => (
              <article className={styles.productRow} key={application.code}>
                <span className={styles.code}>{application.code}</span>
                <h3>{application.product}</h3>
                <p>
                  {application.use}
                  <span>{application.note}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.places} aria-labelledby="atlas-place-title">
          <div className={styles.placeHeading} data-atlas-reveal>
            <span className={styles.label}>02 / A wider view</span>
            <h2 id="atlas-place-title">The material has a landscape.</h2>
          </div>
          <div className={styles.contactSheet}>
            <figure className={styles.landscape} data-atlas-reveal>
              <div className={styles.photograph} data-atlas-parallax>
                <Image
                  src={field.image}
                  alt={field.imageAlt}
                  fill
                  sizes="(max-width: 640px) 90vw, 65vw"
                />
              </div>
              <figcaption>
                <span>01 / {field.imageCaption}</span>
                <span>Japan</span>
              </figcaption>
            </figure>
            {leaf?.image && (
              <figure className={styles.leaf} data-atlas-reveal>
                <div className={styles.photograph} data-atlas-parallax>
                  <Image
                    src={leaf.image}
                    alt={leaf.imageAlt ?? "Tea leaves in a woven basket."}
                    fill
                    sizes="(max-width: 640px) 58vw, 30vw"
                  />
                </div>
                <figcaption>
                  <span>02 / {leaf.imageCaption}</span>
                </figcaption>
              </figure>
            )}
          </div>
          <div className={styles.placeCopy} data-atlas-reveal>
            <p className={styles.provenance}>{content.provenanceNote}</p>
            <div>
              <p>{content.placeBody}</p>
              <button
                className={styles.textLink}
                type="button"
                disabled={busy}
                onClick={readFieldStory}
                data-about-field-story
              >
                Read the field notes <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </section>

        <section
          className={styles.community}
          aria-labelledby="atlas-community-title"
          data-community-direction
        >
          {work?.image && (
            <figure className={styles.work} data-atlas-reveal>
              <div className={styles.photograph} data-atlas-parallax>
                <Image
                  src={work.image}
                  alt={work.imageAlt ?? "Work among tea plants."}
                  fill
                  sizes="(max-width: 640px) 70vw, 32vw"
                />
              </div>
              <figcaption>03 / {work.imageCaption}</figcaption>
            </figure>
          )}
          <div className={styles.communityCopy} data-atlas-reveal>
            <span className={styles.label}>
              03 / {content.community.status}
            </span>
            <h2 id="atlas-community-title">{content.community.title}</h2>
            <p>{content.community.body}</p>
            <p className={styles.provenance}>{content.community.note}</p>
          </div>
        </section>

        <div className={styles.closing} data-atlas-reveal>
          <div>
            <span className={styles.label}>Find your application</span>
            <p>Start with what you want to make.</p>
          </div>
          <Link
            className={styles.shopLink}
            href="/shop"
            aria-disabled={busy || undefined}
            onNavigate={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Explore matcha <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <footer className={styles.footer}>
          <span>ATOMA</span>
          <p>Material. Use. Place.</p>
          <a href="#atlas-top">Back to top ↑</a>
        </footer>
      </main>
    </div>
  );
}
