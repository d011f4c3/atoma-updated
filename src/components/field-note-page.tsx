"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  aboutFarmPhotographs,
  aboutFieldNotes,
  aboutPhotoStories,
} from "@/lib/about-photo-stories";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { StorefrontFooter } from "./storefront-footer";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ThemeSwitcher } from "./theme-switcher";
import { ScrambleText } from "./scramble-text";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";
import styles from "./field-note-page.module.css";

type FieldNoteStory = (typeof aboutPhotoStories)[number];
type FarmPhotograph =
  (typeof aboutFarmPhotographs)[keyof typeof aboutFarmPhotographs];

function Photograph({
  photograph,
  preload = false,
  wide = false,
}: {
  photograph: FarmPhotograph;
  preload?: boolean;
  wide?: boolean;
}) {
  const { t } = useStorefrontLocale();
  return (
    <figure
      className={styles.photograph}
      data-field-note-photo
      data-page-enter={preload ? "visual" : undefined}
      data-page-reveal={preload ? undefined : "fade"}
    >
      <Image
        src={photograph.src}
        alt={t(photograph.alt)}
        width={photograph.width}
        height={photograph.height}
        preload={preload}
        sizes={
          wide
            ? "(max-width: 760px) 90vw, (max-width: 1400px) 92vw, 1280px"
            : "(max-width: 760px) 90vw, (max-width: 1400px) 55vw, 760px"
        }
      />
      <figcaption>{t(photograph.caption)}</figcaption>
    </figure>
  );
}

function Observation({
  note,
}: {
  note: (typeof aboutFieldNotes)[keyof typeof aboutFieldNotes];
}) {
  const { t } = useStorefrontLocale();
  return (
    <div className={styles.observation}>
      <p className={styles.label}>{t(note.category)}</p>
      {"title" in note && (
        <h2>
          <ScrambleText text={t(note.title)} wrap visibleOnly />
        </h2>
      )}
      <p className={styles.observationText}>{t(note.text)}</p>
    </div>
  );
}

export function FieldNotePage({
  story,
  year,
}: {
  story: FieldNoteStory;
  year: number;
}) {
  const { tone } = useStorefrontTheme();
  const { locale, t } = useStorefrontLocale();
  const { busy } = useCart();
  const pageRef = useRef<HTMLElement>(null);
  usePageReveals(pageRef);
  const relatedStory = aboutPhotoStories.find((entry) => entry.id !== story.id);
  const photographs = aboutFarmPhotographs;

  useEffect(() => {
    document.title = `ATOMA — ${t(story.title)}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t(story.introduction));
  }, [story.introduction, story.title, t]);

  return (
    <div
      className={styles.page}
      data-field-note-page={story.id}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <HomeHeader
        tone={tone}
        persistentTheme
        activePage="about"
        originsReturnLabel="Back to story"
      />
      <main
        ref={pageRef}
        className={`${styles.main} ${revealStyles.scope}`}
        lang={locale}
        id="field-note-top"
        data-client-reading
      >
        <div className={styles.edition}>
          <span>{t("ATOMA / Community")}</span>
          <Link
            href="/about#about-community"
            data-field-note-back
            aria-disabled={busy || undefined}
            onNavigate={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <span aria-hidden="true">←</span>{" "}
            <ScrambleText
              text={t("Back to About")}
              interactive
              animateOnMount={false}
              wrap
            />
          </Link>
          <ThemeSwitcher />
        </div>

        <article aria-labelledby="field-note-title">
          <header className={styles.heading} data-page-enter="text">
            <div>
              <p className={styles.label}>{t(story.category)}</p>
              <h1 id="field-note-title">
                <ScrambleText text={t(story.title)} wrap />
              </h1>
            </div>
            <p className={styles.introduction}>{t(story.introduction)}</p>
          </header>

          {story.id === "harvest" ? (
            <>
              <Photograph photograph={photographs.harvestCover} preload wide />

              <section
                className={styles.chapter}
                data-field-note="place"
                aria-label={t(aboutFieldNotes.place.category)}
              >
                <Observation note={aboutFieldNotes.place} />
                <div className={styles.portraitPhotograph}>
                  <Photograph photograph={photographs.hillside} />
                </div>
              </section>

              <section
                className={styles.chapter}
                data-field-note="harvest"
                aria-label={t(aboutFieldNotes.harvest.category)}
              >
                <Observation note={aboutFieldNotes.harvest} />
                <Photograph photograph={photographs.team} />
              </section>

              <div className={styles.harvestDetails}>
                <Photograph photograph={photographs.slope} />
                <Photograph photograph={photographs.leaves} />
              </div>
              <div className={styles.closingPhotograph}>
                <Photograph photograph={photographs.path} wide />
              </div>
            </>
          ) : (
            <>
              <Photograph photograph={photographs.droneCloseUp} preload wide />
              <section
                className={styles.chapter}
                data-field-note="technology"
                aria-label={t(aboutFieldNotes.technology.category)}
              >
                <Observation note={aboutFieldNotes.technology} />
                <div className={styles.portraitPhotograph}>
                  <Photograph photograph={photographs.powersuitHarvester} />
                </div>
              </section>
              <div className={styles.closingPhotograph}>
                <Photograph photograph={photographs.tools} wide />
              </div>
              <div className={styles.viewpointPair}>
                <Photograph photograph={photographs.pilot} />
                <Photograph photograph={photographs.droneRows} />
              </div>
              <div className={styles.closingPhotograph}>
                <Photograph photograph={photographs.droneComposite} wide />
              </div>
            </>
          )}

          <aside className={styles.recordNote}>
            <span className={styles.label}>{t("An ongoing record")}</span>
            <p>
              {t(
                "Our time in the community is one story. The origin of each matcha is recorded with the product.",
              )}
            </p>
          </aside>
        </article>

        <nav
          className={styles.storyNavigation}
          aria-label={t("Photographic stories")}
        >
          <Link
            href="/about#about-community"
            data-field-note-back
            aria-disabled={busy || undefined}
            onNavigate={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <span aria-hidden="true">←</span>{" "}
            <ScrambleText
              text={t("Back to About")}
              interactive
              animateOnMount={false}
              wrap
            />
          </Link>
          {relatedStory && (
            <Link
              className={styles.relatedStory}
              href={`/field-notes/${relatedStory.slug}`}
              aria-disabled={busy || undefined}
              onNavigate={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              <span>
                <span className={styles.label}>{t(relatedStory.category)}</span>
                <span>
                  <ScrambleText
                    text={t(relatedStory.title)}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </span>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
          )}
        </nav>
      </main>
      <StorefrontFooter year={year} />
    </div>
  );
}
