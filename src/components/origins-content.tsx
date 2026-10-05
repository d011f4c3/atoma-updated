"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  FIELD_ENTRIES,
  getRelatedMatchas,
  type FieldEntry,
} from "@/lib/origins-content";
import { productName } from "@/lib/product-name";
import { ORIGINS_GRAPH, getPlacePath } from "@/lib/origins-model";
import { OriginsDirectory } from "./origins-directory";
import { useProductSelection } from "./use-product-selection";
import styles from "./origins-content.module.css";

type OriginsContentProps = {
  tone: "dark" | "light";
  initialEntry?: string;
  initialPlace?: string;
  onReturn?: () => void;
  returnLabel?: string;
};

export function OriginsContent(props: OriginsContentProps) {
  return (
    <OriginsReader
      key={`${props.initialPlace ?? "all"}/${props.initialEntry ?? "index"}`}
      {...props}
    />
  );
}

function OriginsReader({
  tone,
  initialEntry,
  initialPlace,
  onReturn,
  returnLabel = "Back to matcha",
}: OriginsContentProps) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const connectionsHeading = useRef<HTMLHeadingElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const directoryReturn = useRef<{
    scroll: number;
    trigger: HTMLElement | null;
  } | null>(null);
  const restoreDirectory = useRef(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialEntry ?? null,
  );
  const [selectedPlace, setSelectedPlace] = useState<string | null>(
    initialPlace ??
      FIELD_ENTRIES.find((item) => item.slug === initialEntry)?.placeIds[0] ??
      null,
  );
  const place = ORIGINS_GRAPH.places.find(
    (item) => item.id === selectedPlace && item.publication === "published",
  );
  const { catalog, loading, retry } = useProductSelection();
  const entry = FIELD_ENTRIES.find((item) => item.slug === selectedSlug);
  const home = "/";
  const related = entry
    ? getRelatedMatchas(
        entry,
        catalog?.status === "ready" ? catalog.products : [],
      )
    : [];
  const entryPlaces = entry
    ? entry.placeIds
        .map((placeId) => getPlacePath(placeId).at(-1))
        .filter((item) => item !== undefined)
    : [];
  const placeNames = entryPlaces.map((item) => item.name).join(" / ");
  const firstSection = entry?.sections[0];
  const landscapeInSequence = Boolean(
    firstSection &&
    (!firstSection.image || firstSection.image === entry?.image),
  );
  const shownPhotographs = new Set<string>(
    entry && !landscapeInSequence ? [entry.image] : [],
  );

  function openEntry(slug: string) {
    const dialog = root.current?.closest("dialog");
    directoryReturn.current = {
      scroll: dialog ? dialog.scrollTop : window.scrollY,
      trigger:
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
    };
    setSelectedSlug(slug);
  }

  function returnToDirectory() {
    restoreDirectory.current = true;
    setSelectedSlug(null);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const dialog = root.current?.closest("dialog");
      if (dialog && !dialog.open) return;
      const saved = restoreDirectory.current ? directoryReturn.current : null;
      restoreDirectory.current = false;
      let parent = root.current?.parentElement;
      while (parent) {
        if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) {
          parent.scrollTo({ top: saved?.scroll ?? 0, behavior: "instant" });
          break;
        }
        parent = parent.parentElement;
      }
      if (!parent && root.current) {
        window.scrollTo({ top: saved?.scroll ?? 0, behavior: "instant" });
      }
      const target =
        saved?.trigger?.isConnected && saved.trigger.getClientRects().length
          ? saved.trigger
          : (heading.current ?? root.current?.querySelector<HTMLElement>("h1"));
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedSlug, selectedPlace]);

  function openSection(sectionId: string) {
    const target = sections.current.get(sectionId);
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function retryConnections() {
    connectionsHeading.current?.focus({ preventScroll: true });
    retry();
  }

  return (
    <section
      ref={root}
      className={styles.root}
      data-tone={tone}
      data-origins-content
      data-origins-view={entry ? "entry" : "index"}
      aria-labelledby={entry ? `${id}-title` : undefined}
      aria-label={entry ? undefined : "Origins directory"}
    >
      <div className={styles.navigation}>
        {onReturn ? (
          <button className={styles.back} type="button" onClick={onReturn}>
            <span aria-hidden="true">←</span>
            {returnLabel}
          </button>
        ) : (
          <Link className={styles.back} href={home}>
            <span aria-hidden="true">←</span>
            Explore matcha
          </Link>
        )}
        {entry ? (
          <button
            className={styles.indexButton}
            type="button"
            onClick={returnToDirectory}
          >
            {place ? `Back to ${place.name}` : "All origins"}
          </button>
        ) : place ? (
          <button
            className={styles.indexButton}
            type="button"
            onClick={() => setSelectedPlace(null)}
          >
            All origins
          </button>
        ) : (
          <span className={styles.journalLabel}>ATOMA / Origins</span>
        )}
      </div>

      {entry ? (
        <div className={styles.reader} data-origins-entry={entry.slug}>
          <header className={styles.articleHeading}>
            <div>
              <p className={styles.eyebrow}>{entry.region}</p>
              <h1 ref={heading} id={`${id}-title`} tabIndex={-1}>
                {entry.title}
              </h1>
              {entry.dek && <p className={styles.dek}>{entry.dek}</p>}
            </div>
            {entry.sections.length > 0 && (
              <nav className={styles.chapters} aria-label="In this view">
                {entry.sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => openSection(section.id)}
                    aria-controls={`${id}-${section.id}`}
                  >
                    <span className={styles.chapterNumber}>
                      {section.label.match(/^\d+/)?.[0]}
                    </span>
                    <span>{section.label.replace(/^\d+\s*\/\s*/, "")}</span>
                  </button>
                ))}
              </nav>
            )}
          </header>
          {!landscapeInSequence && (
            <FieldPhotograph entry={entry} className={styles.readerImage} />
          )}
          <div className={styles.sequence}>
            {entry.sections.map((section, index) => {
              const source =
                section.image ?? (index === 0 ? entry.image : undefined);
              const photograph =
                source && !shownPhotographs.has(source) ? source : undefined;
              if (photograph) shownPhotographs.add(photograph);
              const isLandscape = photograph === entry.image;
              const imageAlt = isLandscape
                ? entry.imageAlt
                : (section.imageAlt ?? "");
              const imageCaption = isLandscape
                ? entry.imageCaption
                : section.imageCaption;
              return (
                <section
                  key={section.id}
                  ref={(element) => {
                    if (element) sections.current.set(section.id, element);
                    else sections.current.delete(section.id);
                  }}
                  id={`${id}-${section.id}`}
                  className={styles.chapter}
                  data-format={
                    photograph
                      ? isLandscape
                        ? "landscape"
                        : "portrait"
                      : "text"
                  }
                  aria-labelledby={`${id}-${section.id}-title`}
                  tabIndex={-1}
                >
                  {photograph && (
                    <figure className={styles.chapterFigure}>
                      <div
                        className={
                          isLandscape ? styles.readerImage : styles.chapterImage
                        }
                      >
                        <Image
                          src={photograph}
                          alt={imageAlt}
                          fill
                          sizes={
                            isLandscape
                              ? "(max-width: 760px) calc(100vw - 32px), 62vw"
                              : "(max-width: 760px) calc(100vw - 32px), 40vw"
                          }
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                      </div>
                    </figure>
                  )}
                  <div className={styles.caption}>
                    <h2 id={`${id}-${section.id}-title`}>{section.label}</h2>
                    {section.body.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className={styles.prose}>
                        {paragraph}
                      </p>
                    ))}
                    {imageCaption && (
                      <p className={styles.imageCaption}>{imageCaption}</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          <section
            className={styles.connections}
            aria-labelledby={`${id}-connections`}
          >
            <h2 ref={connectionsHeading} id={`${id}-connections`} tabIndex={-1}>
              {placeNames
                ? `Explore matcha from ${placeNames}`
                : "Explore matcha"}
            </h2>
            {loading ? (
              <p className={styles.prose} role="status">
                Loading matcha…
              </p>
            ) : catalog?.status === "unavailable" || !catalog ? (
              <div>
                <p className={styles.prose} role="status">
                  Couldn’t load matcha.
                </p>
                <button
                  className={styles.action}
                  type="button"
                  onClick={retryConnections}
                >
                  Try again <span aria-hidden="true">↻</span>
                </button>
              </div>
            ) : related.length > 0 ? (
              <ul className={styles.related}>
                {related.slice(0, 3).map((product) => (
                  <li key={product.id}>
                    <Link
                      href={{
                        pathname: home,
                        query: { matcha: product.handle },
                      }}
                    >
                      <span className={styles.relatedName}>
                        <span>{productName(product.title)}</span>
                        {!product.variants.some(
                          (variant) => variant.available,
                        ) && (
                          <span className={styles.availability}>
                            Currently unavailable
                          </span>
                        )}
                      </span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.prose}>No matchas are listed here yet.</p>
            )}
            {related.length > 3 && (
              <div className={styles.placeLinks}>
                {entryPlaces.map((place) => (
                  <button
                    className={styles.action}
                    key={place.id}
                    type="button"
                    onClick={() => {
                      restoreDirectory.current = false;
                      setSelectedPlace(place.id);
                      setSelectedSlug(null);
                    }}
                  >
                    All matcha from {place.name}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
      <div hidden={Boolean(entry)}>
        <OriginsDirectory
          tone={tone}
          placeId={place?.id ?? null}
          onPlaceChange={setSelectedPlace}
          onRead={openEntry}
          products={catalog?.status === "ready" ? catalog.products : []}
          loading={loading}
          catalogUnavailable={!catalog || catalog.status === "unavailable"}
          onRetry={retry}
          onExplore={onReturn}
        />
      </div>
    </section>
  );
}

function FieldPhotograph({
  entry,
  className,
}: {
  entry: FieldEntry;
  className?: string;
}) {
  return (
    <figure className={styles.photograph}>
      <div className={className}>
        <Image
          src={entry.image}
          alt={entry.imageAlt}
          fill
          sizes="(max-width: 760px) calc(100vw - 40px), 55vw"
          loading="eager"
        />
      </div>
      <figcaption>{entry.imageCaption}</figcaption>
    </figure>
  );
}
