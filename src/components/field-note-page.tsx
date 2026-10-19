"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
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
    <figure className={styles.photograph} data-field-note-photo>
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
      {"title" in note && <h2>{t(note.title)}</h2>}
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
      <main className={styles.main} lang={locale} id="field-note-top">
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
            <span aria-hidden="true">←</span> {t("Back to About")}
          </Link>
          <ThemeSwitcher />
        </div>

        <article aria-labelledby="field-note-title">
          <header className={styles.heading}>
            <div>
              <p className={styles.label}>{t(story.category)}</p>
              <h1 id="field-note-title">{t(story.title)}</h1>
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
            <span aria-hidden="true">←</span> {t("Back to About")}
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
                <span>{t(relatedStory.title)}</span>
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
