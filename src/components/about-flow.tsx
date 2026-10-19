"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { AboutFieldNotes } from "./about-field-notes";
import { AboutConnections } from "./about-connections";
import { AboutApproach } from "./about-approach";
import { AboutSelectionInvitation } from "./about-selection-invitation";
import { useAboutMotion } from "./use-about-motion";
import {
  aboutFarmPhotographs,
  aboutPhotoStories,
} from "@/lib/about-photo-stories";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { StorefrontFooter } from "./storefront-footer";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ThemeSwitcher } from "./theme-switcher";
import styles from "./about-flow.module.css";

const storyChangeEvent = "atoma:about-story";

function subscribeToStory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  window.addEventListener(storyChangeEvent, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(storyChangeEvent, onChange);
  };
}

function currentStorySlug() {
  const slug = window.location.hash.match(/^#field-note=([a-z-]+)$/)?.[1];
  return aboutPhotoStories.some((entry) => entry.slug === slug) ? slug! : null;
}

const serverStorySlug = () => null;

function closeStory() {
  if (window.history.state?.atomaAboutStory === currentStorySlug()) {
    window.history.back();
  } else {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}#about-community`,
    );
    window.dispatchEvent(new Event(storyChangeEvent));
  }
}

export function AboutFlow({
  preview = true,
  year = 2026,
}: {
  preview?: boolean;
  year?: number;
}) {
  const { tone } = useStorefrontTheme();
  const { locale, t: translate } = useStorefrontLocale();
  const t = preview ? (source: string) => source : translate;
  const { busy } = useCart();
  const root = useRef<HTMLDivElement>(null);
  useAboutMotion(root);
  const storySlug = useSyncExternalStore(
    subscribeToStory,
    currentStorySlug,
    serverStorySlug,
  );
  const activeStory =
    aboutPhotoStories.find((entry) => entry.slug === storySlug) ?? null;

  function openStory(slug: string) {
    if (busy || document.querySelector("dialog[open]")) return;
    window.history.pushState(
      { ...window.history.state, atomaAboutStory: slug },
      "",
      `#field-note=${slug}`,
    );
    window.dispatchEvent(new Event(storyChangeEvent));
  }

  return (
    <div
      className={styles.page}
      ref={root}
      data-about-flow
      data-about-page={!preview || undefined}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <div
        className={styles.readingProgress}
        data-about-reading-progress
        aria-hidden="true"
      />
      <HomeHeader
        tone={tone}
        persistentTheme
        activePage={preview ? undefined : "about"}
      />
      <main
        className={styles.main}
        lang={preview ? "en" : locale}
        id="about-top"
      >
        <div className={styles.edition}>
          <span>{t("About ATOMA")}</span>
          <a href="#about-community">
            <span className={styles.communityLabel}>{t("Community")}</span>{" "}
            <span aria-hidden="true">↓</span>
          </a>
          <ThemeSwitcher />
        </div>

        <div className={styles.coverTrack} data-about-cover>
          <section className={styles.opening} aria-labelledby="about-title">
            <div className={styles.openingCopy}>
              <div>
                <span className={styles.label}>
                  {t("Our approach to matcha")}
                </span>
                <h1 id="about-title">
                  {t("Matcha,")}
                  <br />
                  {t("in detail.")}
                </h1>
              </div>
              <div className={styles.openingStatement}>
                <p>{t("Selected for its flavour, texture and application.")}</p>
                <p>{t("Connected to the people and places behind it.")}</p>
              </div>
              <a href="#about-purpose" className={styles.approachLink}>
                <span>{t("About ATOMA")}</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 19 19 5M5 5h14v14" />
                </svg>
              </a>
            </div>
            <figure className={styles.openingPhotograph}>
              <div
                className={styles.openingImage}
                data-about-opening-photographs
                data-about-mobile-visual
              >
                <Image
                  src={aboutFarmPhotographs.contours.src}
                  alt={t(aboutFarmPhotographs.contours.alt)}
                  fill
                  preload
                  sizes="100vw"
                />
              </div>
              <figcaption className={styles.imageNote}>
                <span>
                  {t("Kyoto Prefecture → Uji tea-growing region → Wazuka")}
                </span>
                <span>{t("The shape of the fields")}</span>
              </figcaption>
            </figure>
          </section>
        </div>
        <div className={styles.journey}>
          <section
            className={styles.purpose}
            id="about-purpose"
            aria-labelledby="purpose-title"
          >
            <span className={styles.sectionLabel}>
              {t("About the company")}
            </span>
            <div className={styles.purposeStatement}>
              <h2 id="purpose-title">{t("Matcha, selected and explained.")}</h2>
              <p>
                {t(
                  "ATOMA helps businesses find matcha suited to what they make. We bring product selection, practical guidance and relationships with tea-growing communities into one connected approach.",
                )}
              </p>
            </div>
            <p className={styles.purposeDetail}>
              {t(
                "From tasting a sample to choosing matcha for regular use, we help buyers understand its character, its preparation and the people and processes behind it.",
              )}
            </p>
          </section>

          <AboutApproach t={t} />
          <AboutConnections t={t} />

          <section
            className={styles.fieldNotes}
            id="about-community"
            aria-labelledby="field-title"
            data-about-field-rail
          >
            <div className={styles.fieldSticky}>
              <header className={styles.fieldHeading}>
                <div>
                  <span className={styles.label}>{t("People & place")}</span>
                  <h2 id="field-title">{t("Community")}</h2>
                </div>
                <p>
                  {t("Stories from the places and communities we work with.")}
                </p>
                <span className={styles.railCount} aria-hidden="true">
                  <span data-about-rail-current>01</span> / 02
                </span>
              </header>
              <div className={styles.fieldViewport} data-about-field-viewport>
                <div className={styles.entries} data-about-field-track>
                  {aboutPhotoStories.map((entry) => (
                    <article
                      className={styles.entry}
                      key={entry.id}
                      data-about-story={entry.id}
                    >
                      <Link
                        href={`/field-notes/${entry.slug}`}
                        prefetch={false}
                        aria-haspopup="dialog"
                        aria-expanded={activeStory?.id === entry.id}
                        className={styles.entryLink}
                        aria-labelledby={`entry-${entry.id}`}
                        aria-disabled={busy || undefined}
                        onNavigate={(event) => {
                          event.preventDefault();
                          openStory(entry.slug);
                        }}
                      >
                        <figure
                          className={styles.entryImage}
                          data-about-mobile-visual
                        >
                          <Image
                            src={entry.photographs[0].src}
                            alt={t(entry.photographs[0].alt)}
                            fill
                            sizes="(max-width: 899px) 92vw, 78vw"
                          />
                          <span
                            className={styles.photoIndex}
                            aria-hidden="true"
                          >
                            {entry.id === "harvest" ? "01" : "02"}
                          </span>
                        </figure>
                        <div className={styles.entryCopy}>
                          <div>
                            <span className={styles.label}>
                              {t(entry.category)}
                            </span>
                            <h3 id={`entry-${entry.id}`}>{t(entry.title)}</h3>
                          </div>
                          <p>{t(entry.introduction)}</p>
                          <span className={styles.entryAction}>
                            <span>{t("Read story")}</span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path d="M5 19 19 5M5 5h14v14" />
                            </svg>
                          </span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
              <div className={styles.fieldFoot}>
                <p>
                  {t(
                    "Our time in the community is one story. The origin of each matcha is recorded with the product.",
                  )}
                </p>
                <span className={styles.railProgress} aria-hidden="true">
                  <span />
                </span>
              </div>
            </div>
          </section>

          <AboutSelectionInvitation t={t} busy={busy} />
        </div>
      </main>
      <noscript>
        <style>{`
          [data-about-cover] { min-height: auto !important; margin-bottom: 0 !important; }
          [data-about-cover] > section { position: relative !important; height: auto !important; }
          [data-about-field-rail] { min-height: auto !important; }
          [data-about-field-rail] > div { position: relative !important; height: auto !important; }
          [data-about-field-viewport] { flex: none !important; }
          [data-about-field-track] { display: grid !important; width: auto !important; height: auto !important; transform: none !important; }
          [data-about-story] { width: 100% !important; height: auto !important; }
          [data-about-story] > a { display: block !important; height: auto !important; }
          @media (min-width: 900px) and (min-height: 650px) {
            [data-about-opening-photographs] { height: 52svh !important; min-height: 20rem !important; flex: none !important; }
            [data-about-story] figure { height: 55svh !important; min-height: 20rem !important; flex: none !important; }
          }
        `}</style>
      </noscript>
      <AboutFieldNotes
        story={activeStory}
        onClose={closeStory}
        tone={tone}
        localized={!preview}
        presentation="field-record"
      />
      <StorefrontFooter year={year} />
      {preview && (
        <aside
          className={styles.review}
          lang="en"
          aria-label="Design review notes"
        >
          <p>
            Design preview · About ATOMA, with a separate Community story
            collection.
          </p>
          <Link
            href="/about-exploration?direction=company"
            aria-disabled={busy || undefined}
            onNavigate={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Earlier layouts ↗
          </Link>
        </aside>
      )}
    </div>
  );
}
