"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  aboutFarmPhotographs,
  aboutFieldNotes,
} from "@/lib/about-photo-stories";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./about-field-notes.module.css";

export type StoryPhotograph = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
};

export type AboutPhotoStory = {
  id: string;
  title: string;
  category: string;
  introduction: string;
  paragraphs: readonly string[];
  photographs: readonly [StoryPhotograph, ...StoryPhotograph[]];
  previewPhotographs?: readonly StoryPhotograph[];
  note?: string;
};

type AboutFieldNotesProps = {
  story: AboutPhotoStory | null;
  onClose: () => void;
  tone: "light" | "dark";
  localized?: boolean;
  presentation?: "gallery" | "field-record";
};

type FieldNote = (typeof aboutFieldNotes)[keyof typeof aboutFieldNotes];

function recordChapters(story: AboutPhotoStory) {
  return story.id === "harvest"
    ? [
        { key: "place", label: aboutFieldNotes.place.category },
        { key: "harvest", label: aboutFieldNotes.harvest.category },
        { key: "closing", label: "An ongoing record" },
      ]
    : [
        { key: "tools", label: aboutFarmPhotographs.droneCloseUp.caption },
        { key: "technology", label: aboutFieldNotes.technology.title },
        { key: "closing", label: aboutFarmPhotographs.drone.caption },
      ];
}

function RecordNavigation({
  story,
  id,
  dialog,
  t,
}: {
  story: AboutPhotoStory;
  id: string;
  dialog: RefObject<HTMLDialogElement | null>;
  t: (source: string) => string;
}) {
  const chapters = recordChapters(story);
  const [activeChapter, setActiveChapter] = useState(chapters[0]?.key);
  const navigation = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dialog.current;
    const header = navigation.current?.parentElement;
    if (!node || !header) return;
    const sections = Array.from(
      node.querySelectorAll<HTMLElement>("[data-record-chapter]"),
    );
    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      if (!node.open || node.clientHeight === 0) return;
      const visible = new Set<HTMLElement>();
      const headerHeight = Math.min(header.offsetHeight, node.clientHeight - 1);
      const readingHeight = Math.max(1, node.clientHeight - headerHeight);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const section = entry.target as HTMLElement;
            if (entry.isIntersecting) visible.add(section);
            else visible.delete(section);
          }
          const current = sections
            .filter((section) => visible.has(section))
            .at(-1);
          if (current) setActiveChapter(current.dataset.recordChapter);
        },
        {
          root: node,
          rootMargin: `-${headerHeight}px 0px -${Math.round(readingHeight * 0.45)}px 0px`,
          threshold: 0,
        },
      );
      sections.forEach((section) => observer?.observe(section));
    };
    // The parent opens the native dialog in its effect. Observe after it has
    // a real scroll viewport, including on history-driven reopen.
    const frame = requestAnimationFrame(observe);
    const resize = new ResizeObserver(observe);
    resize.observe(header);
    resize.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resize.disconnect();
    };
  }, [dialog]);

  function jumpTo(key: string) {
    const node = dialog.current;
    const header = navigation.current?.parentElement;
    const section = node?.querySelector<HTMLElement>(
      `[data-record-chapter="${key}"]`,
    );
    if (!node || !header || !section || node.dataset.closing === "true") return;
    const top =
      section.getBoundingClientRect().top -
      node.getBoundingClientRect().top +
      node.scrollTop -
      header.offsetHeight -
      20;
    node.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <div
      ref={navigation}
      className={styles.chapterNavigation}
      role="group"
      aria-label={t("ATOMA / Community")}
      data-record-navigation
    >
      {chapters.map((chapter) => (
        <button
          key={chapter.key}
          type="button"
          aria-controls={`${id}-chapter-${chapter.key}`}
          aria-current={activeChapter === chapter.key ? "step" : undefined}
          data-record-jump={chapter.key}
          onClick={() => jumpTo(chapter.key)}
        >
          <span className={styles.chapterMarker} aria-hidden="true" />
          <span>
            <ScrambleText
              text={t(chapter.label)}
              interactive
              animateOnMount={false}
              wrap
            />
          </span>
        </button>
      ))}
    </div>
  );
}

function RecordPhotograph({
  photograph,
  t,
  eager = false,
}: {
  photograph: StoryPhotograph;
  t: (source: string) => string;
  eager?: boolean;
}) {
  return (
    <figure className={styles.recordPhotograph} data-field-note-photo>
      <Image
        src={photograph.src}
        alt={t(photograph.alt)}
        width={photograph.width ?? 1600}
        height={photograph.height ?? 1067}
        sizes="(max-width: 760px) calc(100vw - 72px), (max-width: 1100px) 80vw, 920px"
        loading={eager ? "eager" : "lazy"}
      />
      <figcaption>{t(photograph.caption)}</figcaption>
    </figure>
  );
}

function RecordObservation({
  note,
  t,
}: {
  note: FieldNote;
  t: (source: string) => string;
}) {
  return (
    <div className={styles.observation}>
      <p className={styles.category}>{t(note.category)}</p>
      {"title" in note && <h3>{t(note.title)}</h3>}
      <p className={styles.observationText}>{t(note.text)}</p>
    </div>
  );
}

function FieldRecord({
  story,
  t,
  heading,
  id,
}: {
  story: AboutPhotoStory;
  t: (source: string) => string;
  heading: ReactNode;
  id: string;
}) {
  const photographs = aboutFarmPhotographs;
  return (
    <div className={styles.record}>
      <section
        id={`${id}-chapter-${story.id === "harvest" ? "place" : "tools"}`}
        data-record-chapter={story.id === "harvest" ? "place" : "tools"}
      >
        {heading}
        <RecordPhotograph
          photograph={
            story.id === "harvest"
              ? photographs.harvestCover
              : photographs.droneCloseUp
          }
          t={t}
          eager
        />
        {story.id === "harvest" && (
          <div className={styles.placeSpread} data-field-note="place">
            <RecordObservation note={aboutFieldNotes.place} t={t} />
            <RecordPhotograph photograph={photographs.hillside} t={t} />
          </div>
        )}
      </section>
      {story.id === "harvest" ? (
        <section
          id={`${id}-chapter-harvest`}
          data-record-chapter="harvest"
          data-field-note="harvest"
        >
          <div className={styles.harvestSpread}>
            <RecordObservation note={aboutFieldNotes.harvest} t={t} />
            <RecordPhotograph photograph={photographs.team} t={t} />
          </div>
          <div className={styles.recordDetails}>
            <RecordPhotograph photograph={photographs.slope} t={t} />
            <RecordPhotograph photograph={photographs.leaves} t={t} />
          </div>
        </section>
      ) : (
        <section
          id={`${id}-chapter-technology`}
          data-record-chapter="technology"
          data-field-note="technology"
        >
          <div className={styles.technologySpread}>
            <RecordObservation note={aboutFieldNotes.technology} t={t} />
            <RecordPhotograph
              photograph={photographs.powersuitHarvester}
              t={t}
            />
          </div>
          <div className={styles.recordWorkImage}>
            <RecordPhotograph photograph={photographs.tools} t={t} />
          </div>
        </section>
      )}
      <section id={`${id}-chapter-closing`} data-record-chapter="closing">
        {story.id === "technology" && (
          <div className={styles.viewpointPair}>
            <RecordPhotograph photograph={photographs.pilot} t={t} />
            <RecordPhotograph photograph={photographs.droneRows} t={t} />
          </div>
        )}
        <div className={styles.recordClosingImage}>
          <RecordPhotograph
            photograph={
              story.id === "harvest"
                ? photographs.path
                : photographs.droneComposite
            }
            t={t}
          />
        </div>
        <aside className={styles.recordNote}>
          <span className={styles.category}>{t("An ongoing record")}</span>
          <p>
            {t(
              "Our time in the community is one story. The origin of each matcha is recorded with the product.",
            )}
          </p>
        </aside>
      </section>
    </div>
  );
}

function closeDialog(
  node: HTMLDialogElement | null,
  previous: HTMLElement | null,
) {
  if (!node?.open) return false;
  node.close();
  if (
    !document.querySelector("dialog[open]") &&
    previous?.isConnected &&
    previous.getClientRects().length
  )
    previous.focus({ preventScroll: true });
  return true;
}

export function AboutFieldNotes({
  story,
  onClose,
  tone,
  localized = false,
  presentation = "gallery",
}: AboutFieldNotesProps) {
  const { locale, t: translate } = useStorefrontLocale();
  const t = localized ? translate : (source: string) => source;
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestClose = () => {
    const node = dialog.current;
    if (!node?.open || closeTimer.current) return;
    // Native close events are queued. Notify only from this user-dismiss path,
    // so an old history-driven close cannot dismiss a reader reopened by Forward.
    const finishClose = () => {
      if (closeDialog(node, trigger.current)) onClose();
    };
    if (
      presentation !== "field-record" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      finishClose();
      return;
    }
    node.dataset.closing = "true";
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      finishClose();
      delete node.dataset.closing;
    }, 220);
  };
  const dismiss = useDialogDismiss(requestClose);
  useDialogScrollLock(Boolean(story));

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!story) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      delete node.dataset.closing;
      closeDialog(node, trigger.current);
      return;
    }
    if (node.open) return;
    if (document.querySelector("dialog[open]")) {
      onClose();
      return;
    }
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    delete node.dataset.closing;
    node.style.setProperty("--record-progress", "0");
    node.showModal();
    node.scrollTop = 0;
    title.current?.focus({ preventScroll: true });
  }, [story, onClose]);

  useEffect(() => {
    const node = dialog.current;
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      if (node) delete node.dataset.closing;
      closeDialog(node, trigger.current);
    };
  }, []);

  const heading = story && (
    <header className={styles.heading}>
      <p className={styles.category}>{t(story.category)}</p>
      <h2 id={`${id}-title`} ref={title} tabIndex={-1}>
        <ScrambleText text={t(story.title)} wrap />
      </h2>
      <p id={`${id}-introduction`} className={styles.introduction}>
        {t(story.introduction)}
      </p>
    </header>
  );

  return (
    <dialog
      {...dismiss}
      ref={dialog}
      className={styles.dialog}
      data-about-field-notes
      data-tone={tone}
      data-presentation={presentation}
      lang={localized ? locale : "en"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-introduction`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }}
      onScroll={(event) => {
        const node = event.currentTarget;
        const remaining = node.scrollHeight - node.clientHeight;
        node.style.setProperty(
          "--record-progress",
          String(remaining > 0 ? node.scrollTop / remaining : 0),
        );
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])",
          ),
        ).filter((element) => element.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      {story && (
        <>
          <div
            className={
              presentation === "field-record"
                ? styles.readerHeader
                : styles.legacyHeader
            }
          >
            <div className={styles.navigation}>
              <span>
                {t(
                  presentation === "field-record"
                    ? "ATOMA / Community"
                    : "ATOMA / Field notes",
                )}
              </span>
              <button type="button" onClick={requestClose}>
                <ScrambleText
                  text={t("Back to About")}
                  interactive
                  animateOnMount={false}
                  wrap
                />{" "}
                <span aria-hidden="true">×</span>
              </button>
              {presentation === "field-record" && (
                <span className={styles.readingProgress} aria-hidden="true" />
              )}
            </div>
            {presentation === "field-record" && (
              <RecordNavigation
                key={story.id}
                story={story}
                id={id}
                dialog={dialog}
                t={t}
              />
            )}
          </div>
          <article className={styles.story} data-about-story={story.id}>
            {presentation === "field-record" ? (
              <FieldRecord story={story} t={t} heading={heading} id={id} />
            ) : (
              <>
                {heading}
                <div className={styles.photographs}>
                  {story.photographs.map((photograph, index) => (
                    <figure
                      key={photograph.src}
                      data-format={
                        photograph.width &&
                        photograph.height &&
                        photograph.height > photograph.width
                          ? "portrait"
                          : "landscape"
                      }
                    >
                      <div
                        className={styles.photograph}
                        style={
                          photograph.width && photograph.height
                            ? {
                                aspectRatio: `${photograph.width} / ${photograph.height}`,
                              }
                            : undefined
                        }
                      >
                        <Image
                          src={photograph.src}
                          alt={t(photograph.alt)}
                          fill
                          sizes="(max-width: 760px) calc(100vw - 72px), 780px"
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                      </div>
                      <figcaption>{t(photograph.caption)}</figcaption>
                    </figure>
                  ))}
                </div>
                <div className={styles.copy}>
                  {story.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{t(paragraph)}</p>
                  ))}
                  {story.note && <p className={styles.note}>{t(story.note)}</p>}
                </div>
              </>
            )}
          </article>
        </>
      )}
    </dialog>
  );
}
