"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  aboutStudyContent as content,
  getConfirmedCommunityStories,
} from "@/lib/about-study-content";
import {
  AboutFieldnotes,
  type AboutFieldnotesLayout,
} from "./about-fieldnotes";
import { HomeHeader } from "./home-header";
import { useOrigins } from "./origins-provider";
import { useCart } from "./cart-drawer";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { usePageScroll } from "./smooth-scroll";
import styles from "./about-study.module.css";

export type AboutStudyDirection = AboutFieldnotesLayout;

const directions = [
  {
    value: "fieldnotes",
    name: "Fieldnotes",
    description:
      "A visual essay: a panoramic opening followed by a calm, sequential reading flow.",
  },
  {
    value: "compact",
    name: "Map",
    description:
      "An interactive diagram: open the branches to explore selection, place and community.",
  },
  {
    value: "ledger",
    name: "Chapters",
    description:
      "A chapter reader: three closed entries unfold independently as you read.",
  },
  {
    value: "columns",
    name: "Index",
    description:
      "A visual contents sheet: select a tile to reveal its passage below.",
  },
  {
    value: "broadside",
    name: "Broadside",
    description:
      "An editorial sheet: a selection register, photographic place column and community note, read together.",
  },
  {
    value: "sequence",
    name: "Sequence",
    description:
      "A guided reader: move through selection, place and community one step at a time.",
  },
] as const;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function AboutStudy({
  initialDirection = "fieldnotes",
}: {
  initialDirection?: AboutStudyDirection;
}) {
  const [direction, setDirection] = useState(initialDirection);
  const { tone: initialTone } = useStorefrontTheme();
  const [tone, setTone] = useState(initialTone);
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const scrollTo = usePageScroll();
  const selectId = useId();
  const selected =
    directions.find((item) => item.value === direction) ?? directions[0];
  const stories = getConfirmedCommunityStories();
  const field = content.fieldStory;

  function changeDirection(next: AboutStudyDirection) {
    if (busy || next === direction) return;
    setDirection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", next);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}`,
    );
    scrollTo(0);
  }

  function readStory() {
    if (busy) return;
    openOrigins({ tone, entry: field.slug, returnLabel: "Back to About" });
  }

  function exploreOrigins() {
    if (busy) return;
    openOrigins({ tone, returnLabel: "Back to About" });
  }

  return (
    <div
      className={styles.study}
      data-about-study
      data-direction={direction}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar} lang="en">
        <div className={styles.studyTitle}>
          <span>About study</span>
          <span>Six reading models · English copy</span>
        </div>
        <div
          className={styles.directions}
          role="group"
          aria-label="About direction"
        >
          {directions.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={direction === item.value}
              disabled={busy}
              onClick={() => changeDirection(item.value)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className={styles.mobileLabel} htmlFor={selectId}>
          About direction
        </label>
        <select
          id={selectId}
          className={styles.mobileSelect}
          value={direction}
          disabled={busy}
          onChange={(event) =>
            changeDirection(event.target.value as AboutStudyDirection)
          }
        >
          {directions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className={styles.tone}
          type="button"
          role="switch"
          aria-label="Dark mode in About study"
          aria-checked={tone === "dark"}
          disabled={busy}
          onClick={() => setTone(tone === "light" ? "dark" : "light")}
        >
          <span className={styles.toneDot} aria-hidden="true" />
          {tone === "light" ? "Mist" : "Blue hour"}
        </button>
        <details className={styles.studyNotes}>
          <summary>Study notes</summary>
          <p className={styles.directionNote}>{selected.description}</p>
          <p className={styles.reviewNote}>
            English copy study. Community activity stories and company details
            await confirmation.
          </p>
        </details>
      </header>

      <div className={styles.preview}>
        <HomeHeader tone={tone} />
        <main
          className={styles.main}
          lang="en"
          id="about-page"
          data-about-study-main
        >
          <AboutFieldnotes
            layout={direction}
            onReadStory={readStory}
            busy={busy}
          />

          {stories.length > 0 && (
            <section
              className={styles.confirmedStories}
              aria-label="Community stories"
            >
              {stories.map((story) => (
                <article key={story.id} data-confirmed-community-story>
                  <p className={styles.eyebrow}>
                    {story.place} · {story.activityDate}
                  </p>
                  <h2>{story.title}</h2>
                  <p>{story.summary}</p>
                </article>
              ))}
            </section>
          )}

          <footer className={styles.pageFooter}>
            <div>
              <p className={styles.eyebrow}>Continue exploring</p>
              <p>Find the matcha for what you make.</p>
            </div>
            <nav aria-label="Continue exploring">
              <Link
                href="/shop"
                className={styles.textLink}
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                Explore matcha <Arrow />
              </Link>
              <button
                className={styles.textLink}
                type="button"
                onClick={exploreOrigins}
                disabled={busy}
              >
                Growing places <Arrow />
              </button>
            </nav>
          </footer>
        </main>
        <div className={styles.colophon} lang="en">
          <Link
            href="/"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            ATOMA
          </Link>
          <span>Matcha, clearly defined.</span>
        </div>
      </div>
    </div>
  );
}
