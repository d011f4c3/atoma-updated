"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import {
  FIELD_ENTRIES,
  getFieldEntryPhotograph,
  getFieldEntriesForPlace,
  type FieldEntry,
} from "@/lib/origins-content";
import {
  ORIGINS_GRAPH,
  getDirectoryMatchasForPlace,
  getMatchaTypesForProduct,
  getPlaceDescendants,
  getPlacePath,
  getPlacesForMatcha,
  getTeaDesignations,
  getProductDesignations,
  type Place,
} from "@/lib/origins-model";
import { getProductContent } from "@/lib/product-content";
import { productName } from "@/lib/product-name";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ShopMaterialImage } from "./shop-material-image";
import styles from "./origins-directory.module.css";

type OriginsDirectoryProps = {
  tone: "dark" | "light";
  placeId: string | null;
  onPlaceChange: (id: string | null) => void;
  onRead: (slug: string) => void;
  products: CatalogProduct[];
  loading: boolean;
  catalogUnavailable: boolean;
  onRetry: () => void;
  onExplore?: () => void;
};

const PAGE_SIZE = 12;

type BrowseState = {
  query: string;
  countryId: string;
  typeId: string;
  visibleCount: number;
  visibleMatchaCount: number;
  visibleEntryCount: number;
  visibleSearchEntryCount: number;
  visibleChildCount: number;
};

const INITIAL_BROWSE_STATE: BrowseState = {
  query: "",
  countryId: "",
  typeId: "",
  visibleCount: PAGE_SIZE,
  visibleMatchaCount: PAGE_SIZE,
  visibleEntryCount: PAGE_SIZE,
  visibleSearchEntryCount: PAGE_SIZE,
  visibleChildCount: PAGE_SIZE,
};

function countryForPlace(place: Place) {
  return getPlacePath(place.id).find((part) => part.kind === "country");
}

function searchable(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

function photographForPlace(place: Place) {
  const entry =
    getFieldEntriesForPlace(place.id)[0] ??
    getPlacePath(place.id)
      .slice(0, -1)
      .reverse()
      .flatMap((ancestor) =>
        FIELD_ENTRIES.filter((entry) => entry.placeIds.includes(ancestor.id)),
      )[0];
  return entry ? getFieldEntryPhotograph(entry, place.id) : undefined;
}

export function OriginsDirectory({
  tone,
  placeId,
  onPlaceChange,
  onRead,
  products,
  loading,
  catalogUnavailable,
  onRetry,
  onExplore,
}: OriginsDirectoryProps) {
  const { locale, t } = useStorefrontLocale();
  const countLabel = (count: number, singular: string) =>
    t(count === 1 ? `{count} ${singular}` : `{count} ${singular}s`, { count });
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const productsHeading = useRef<HTMLHeadingElement>(null);
  const workHeading = useRef<HTMLHeadingElement>(null);
  const placeButtons = useRef(new Map<string, HTMLButtonElement>());
  const productLinks = useRef(new Map<string, HTMLAnchorElement>());
  const entryButtons = useRef(new Map<string, HTMLButtonElement>());
  const [browseByPlace, setBrowseByPlace] = useState<
    Record<string, BrowseState>
  >({});
  const browseKey = placeId === null ? "directory" : `place:${placeId}`;
  const {
    query,
    countryId,
    typeId,
    visibleCount,
    visibleMatchaCount,
    visibleEntryCount,
    visibleSearchEntryCount,
    visibleChildCount,
  } = browseByPlace[browseKey] ?? INITIAL_BROWSE_STATE;
  const home = "/";
  const publishedPlaces = ORIGINS_GRAPH.places.filter(
    (place) => getPlacePath(place.id).length > 0,
  );
  const place = publishedPlaces.find((item) => item.id === placeId);
  // A city's editorial context can introduce a tea designation. Its associated
  // products remain separate from the city's documented growing relationships.
  const designation = getTeaDesignations().find(
    (item) => item.contextPlaceId === place?.id,
  );
  const countries = publishedPlaces
    .filter((item) => item.kind === "country")
    .sort((a, b) => a.name.localeCompare(b.name));
  const search = searchable(query.trim());
  const matchesSearch = (entry: FieldEntry) =>
    searchable(
      `${entry.region} ${entry.title} ${entry.dek} ${t(entry.region)} ${t(entry.title)} ${t(entry.dek)}`,
    ).includes(search);
  const places = publishedPlaces
    .filter(
      (item) => item.kind !== "country" || !getPlaceDescendants(item.id).length,
    )
    .filter((item) => !countryId || countryForPlace(item)?.id === countryId)
    .filter(
      (item) =>
        search ||
        getPlacePath(item.id).filter((part) => part.kind !== "country")
          .length <= 1,
    )
    .filter(
      (item) =>
        !search ||
        searchable(
          `${getPlacePath(item.id)
            .flatMap((part) => [part.name, t(part.name)])
            .join(" ")} ${item.description} ${t(item.description)}`,
        ).includes(search) ||
        getFieldEntriesForPlace(item.id).some(matchesSearch),
    )
    .sort((a, b) =>
      getPlacePath(a.id)
        .map((part) => t(part.name))
        .join(" / ")
        .localeCompare(
          getPlacePath(b.id)
            .map((part) => t(part.name))
            .join(" / "),
        ),
    );
  const visiblePlaces = places.slice(0, visibleCount);
  const groups = new Map<string, { country?: Place; places: Place[] }>();
  for (const item of visiblePlaces) {
    const country = countryForPlace(item);
    const key = country?.id ?? "other-places";
    const group = groups.get(key) ?? { country, places: [] };
    group.places.push(item);
    groups.set(key, group);
  }
  const searchEntries = search
    ? FIELD_ENTRIES.filter(
        (entry) =>
          matchesSearch(entry) &&
          entry.placeIds.some((entryPlaceId) => {
            const path = getPlacePath(entryPlaceId);
            return (
              path.length > 0 &&
              (!countryId || path.some((part) => part.id === countryId))
            );
          }),
      )
    : [];
  const path = place ? getPlacePath(place.id) : [];
  const children = place
    ? getPlaceDescendants(place.id).filter((item) => item.parentId === place.id)
    : [];
  const placeEntries = place ? getFieldEntriesForPlace(place.id) : [];
  const contextPlace = placeEntries.length
    ? undefined
    : path
        .slice(0, -1)
        .reverse()
        .find((ancestor) =>
          FIELD_ENTRIES.some((entry) => entry.placeIds.includes(ancestor.id)),
        );
  const entries = contextPlace
    ? FIELD_ENTRIES.filter((entry) => entry.placeIds.includes(contextPlace.id))
    : placeEntries;
  const featuredEntry = entries[0];
  const featuredPhotograph = featuredEntry
    ? getFieldEntryPhotograph(featuredEntry, place?.id)
    : undefined;
  const matchas = place ? getDirectoryMatchasForPlace(place.id, products) : [];
  const matchasForType = (typeId: string) =>
    place
      ? getDirectoryMatchasForPlace(place.id, products, ORIGINS_GRAPH, typeId)
      : [];
  const types = ORIGINS_GRAPH.types.filter(
    (type) =>
      place &&
      matchas.some((product) =>
        getMatchaTypesForProduct(product.handle).some(
          (item) => item.id === type.id,
        ),
      ) &&
      matchasForType(type.id).length > 0,
  );
  const selectedTypeId = types.some((type) => type.id === typeId) ? typeId : "";
  const filteredMatchas =
    place && selectedTypeId ? matchasForType(selectedTypeId) : matchas;

  const growerPlaceholder = (
    <div className={styles.growerPlaceholder} data-grower-placeholder>
      <h3>{t("Grower information")}</h3>
      <p>{t("Grower details are not currently shared.")}</p>
    </div>
  );

  function jumpTo(target: HTMLHeadingElement | null) {
    target?.scrollIntoView({ behavior: "instant", block: "start" });
    target?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!root.current || root.current.closest("[hidden]")) return;
      const dialog = root.current?.closest("dialog");
      if (dialog && !dialog.open) return;
      let scrollParent = root.current?.parentElement;
      while (scrollParent) {
        if (/auto|scroll/.test(getComputedStyle(scrollParent).overflowY)) {
          scrollParent.scrollTo({ top: 0, behavior: "instant" });
          break;
        }
        scrollParent = scrollParent.parentElement;
      }
      if (!scrollParent && root.current) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      heading.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [placeId]);

  function updateBrowse(
    update:
      Partial<BrowseState> | ((current: BrowseState) => Partial<BrowseState>),
  ) {
    setBrowseByPlace((previous) => {
      const current = previous[browseKey] ?? INITIAL_BROWSE_STATE;
      const patch = typeof update === "function" ? update(current) : update;
      return { ...previous, [browseKey]: { ...current, ...patch } };
    });
  }

  function showMore() {
    const next = places[visibleCount];
    updateBrowse((current) => ({
      visibleCount: current.visibleCount + PAGE_SIZE,
    }));
    if (next) {
      requestAnimationFrame(() => placeButtons.current.get(next.id)?.focus());
    }
  }

  function showMoreMatchas() {
    const next = filteredMatchas[visibleMatchaCount];
    updateBrowse((current) => ({
      visibleMatchaCount: current.visibleMatchaCount + PAGE_SIZE,
    }));
    if (next) {
      requestAnimationFrame(() =>
        productLinks.current.get(next.handle)?.focus(),
      );
    }
  }

  function showMoreChildren() {
    const next = children[visibleChildCount];
    updateBrowse((current) => ({
      visibleChildCount: current.visibleChildCount + PAGE_SIZE,
    }));
    if (next)
      requestAnimationFrame(() => placeButtons.current.get(next.id)?.focus());
  }

  function showMoreEntries(searchResults: boolean) {
    const key = searchResults ? "visibleSearchEntryCount" : "visibleEntryCount";
    const next = searchResults
      ? searchEntries[visibleSearchEntryCount]
      : entries[visibleEntryCount];
    updateBrowse((current) => ({ [key]: current[key] + PAGE_SIZE }));
    if (next) {
      requestAnimationFrame(() => entryButtons.current.get(next.slug)?.focus());
    }
  }

  function registerEntry(slug: string, element: HTMLButtonElement | null) {
    if (element) entryButtons.current.set(slug, element);
    else entryButtons.current.delete(slug);
  }

  function retryCatalog() {
    productsHeading.current?.focus({ preventScroll: true });
    onRetry();
  }

  function placeRow(item: Place) {
    const photograph = photographForPlace(item);
    const matchaCount = getDirectoryMatchasForPlace(item.id, products).length;
    const parentPath = getPlacePath(item.id).slice(0, -1);
    const subplaces = getPlaceDescendants(item.id).filter(
      (child) => child.parentId === item.id,
    );
    return (
      <div key={item.id} className={styles.placeBranch}>
        <button
          ref={(element) => {
            if (element) placeButtons.current.set(item.id, element);
            else placeButtons.current.delete(item.id);
          }}
          className={styles.placeRow}
          type="button"
          onClick={() => onPlaceChange(item.id)}
          data-origin-place={item.id}
          data-photograph={Boolean(photograph)}
        >
          {photograph && <Thumbnail entry={photograph} />}
          <span className={styles.rowBody}>
            <span className={styles.placeName}>{t(item.name)}</span>
            <span className={styles.path}>
              {parentPath.length
                ? parentPath.map((part) => t(part.name)).join(" / ")
                : t(item.kind)}
            </span>
          </span>
          <span className={styles.placeSummary}>
            <span className={styles.placeCount}>
              {loading
                ? t("Loading matchas…")
                : catalogUnavailable
                  ? t("Matchas temporarily unavailable")
                  : matchaCount
                    ? countLabel(matchaCount, "matcha")
                    : t("Explore this place")}
            </span>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        </button>
        {!search && subplaces.length > 0 && (
          <div className={styles.branchChildren}>
            <span className={styles.label}>
              {t("Within {place}", { place: t(item.name) })}
            </span>
            {subplaces.slice(0, 3).map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => onPlaceChange(child.id)}
              >
                {t(child.name)}
                <span aria-hidden="true">↗</span>
              </button>
            ))}
            {subplaces.length > 3 && (
              <button type="button" onClick={() => onPlaceChange(item.id)}>
                {t("All {count} places", { count: subplaces.length })}
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      ref={root}
      className={styles.root}
      data-tone={tone}
      data-origins-directory={place?.id ?? "all"}
      aria-labelledby={`${id}-title`}
    >
      {placeId === null ? (
        <>
          <header className={`${styles.heading} ${styles.directoryHeading}`}>
            <div>
              <h1 ref={heading} id={`${id}-title`} tabIndex={-1}>
                {t("Growing places")}
              </h1>
            </div>
            <p className={styles.introduction}>
              {t("Explore the regions and places behind our matcha.")}
            </p>
          </header>
          <div
            className={styles.searchBar}
            role="search"
            aria-label={t("Growing places")}
          >
            <div className={styles.search}>
              <label className={styles.label} htmlFor={`${id}-search`}>
                {t("Find a place")}
              </label>
              <div className={styles.searchField}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  aria-hidden="true"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m15.5 15.5 5 5" />
                </svg>
                <input
                  ref={searchInput}
                  id={`${id}-search`}
                  type="search"
                  placeholder={t("Search places…")}
                  value={query}
                  onChange={(event) => {
                    updateBrowse({
                      query: event.target.value,
                      visibleCount: PAGE_SIZE,
                      visibleSearchEntryCount: PAGE_SIZE,
                    });
                  }}
                  aria-controls={`${id}-places`}
                />
                {query && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    aria-label={t("Clear place search")}
                    onClick={() => {
                      updateBrowse({
                        query: "",
                        visibleCount: PAGE_SIZE,
                        visibleSearchEntryCount: PAGE_SIZE,
                      });
                      searchInput.current?.focus();
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>
            </div>
            {countries.length > 1 && (
              <label className={styles.filter}>
                <span className={styles.label}>{t("Country")}</span>
                <select
                  value={countryId}
                  onChange={(event) => {
                    updateBrowse({
                      countryId: event.target.value,
                      visibleCount: PAGE_SIZE,
                      visibleSearchEntryCount: PAGE_SIZE,
                    });
                  }}
                >
                  <option value="">{t("All countries")}</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {t(country.name)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className={styles.resultsHeader}>
            <h2>
              {search || countryId
                ? t("Search results")
                : t("Browse by country")}
            </h2>
            <p role="status">
              {countLabel(places.length, search ? "place" : "region")}
            </p>
          </div>
          <div id={`${id}-places`} className={styles.groups}>
            {[...groups].map(([key, group]) => (
              <section
                key={key}
                className={styles.countryGroup}
                aria-labelledby={`${id}-${key}`}
              >
                <h3 id={`${id}-${key}`} className={styles.groupHeading}>
                  {group.country ? (
                    <button
                      type="button"
                      onClick={() => onPlaceChange(group.country!.id)}
                    >
                      {t(group.country.name)}
                      <span aria-hidden="true">↗</span>
                    </button>
                  ) : (
                    t("Places")
                  )}
                </h3>
                <div className={styles.placeList}>
                  {group.places.map(placeRow)}
                </div>
              </section>
            ))}
            {!places.length && (
              <p className={styles.empty} role="status">
                {search || countryId
                  ? t("No places found. Try another name.")
                  : t("More growing places will appear here.")}
              </p>
            )}
          </div>
          {places.length > visibleCount && (
            <button
              className={styles.action}
              type="button"
              onClick={showMore}
              aria-controls={`${id}-places`}
            >
              {t("Show more places")}
              <span aria-hidden="true">+</span>
            </button>
          )}
          {searchEntries.length > 0 && (
            <section
              className={styles.section}
              aria-labelledby={`${id}-matching-entries`}
            >
              <div className={styles.sectionHeader}>
                <h2 id={`${id}-matching-entries`}>
                  {t("Photographs & field work")}
                </h2>
                <span>{searchEntries.length}</span>
              </div>
              <EntryList
                id={`${id}-search-entry-results`}
                entries={searchEntries.slice(0, visibleSearchEntryCount)}
                onRead={onRead}
                registerEntry={registerEntry}
              />
              {searchEntries.length > visibleSearchEntryCount && (
                <button
                  className={`${styles.action} ${styles.showMore}`}
                  type="button"
                  onClick={() => showMoreEntries(true)}
                  aria-controls={`${id}-search-entry-results`}
                >
                  {t("Show more photographs")}
                  <span aria-hidden="true">+</span>
                </button>
              )}
            </section>
          )}
        </>
      ) : place ? (
        <>
          <nav className={styles.breadcrumbs} aria-label={t("Place path")}>
            <button type="button" onClick={() => onPlaceChange(null)}>
              {t("Origins")}
            </button>
            {path.map((part) => (
              <span key={part.id} className={styles.crumb}>
                <span aria-hidden="true">/</span>
                {part.id === place.id ? (
                  <span aria-current="page">{t(part.name)}</span>
                ) : (
                  <button type="button" onClick={() => onPlaceChange(part.id)}>
                    {t(part.name)}
                  </button>
                )}
              </span>
            ))}
          </nav>
          <div
            className={styles.placeIntro}
            data-photograph={Boolean(featuredPhotograph)}
          >
            <header className={styles.heading}>
              <div>
                <p className={styles.eyebrow}>
                  {path
                    .slice(0, -1)
                    .reverse()
                    .map((part) => t(part.name))
                    .join(" / ") || t("Growing origins")}
                </p>
                <h1 ref={heading} id={`${id}-title`} tabIndex={-1}>
                  {t(place.name)}
                </h1>
              </div>
              <p className={styles.introduction}>{t(place.description)}</p>
              <nav
                className={styles.placeNav}
                aria-label={t("Explore {place}", { place: t(place.name) })}
              >
                <button
                  type="button"
                  onClick={() => jumpTo(productsHeading.current)}
                >
                  {t("Matcha")} <span aria-hidden="true">↓</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo(workHeading.current)}
                >
                  {t("People & work")} <span aria-hidden="true">↓</span>
                </button>
              </nav>
            </header>
            {featuredPhotograph && (
              <figure className={styles.landscape}>
                <div className={styles.landscapeImage}>
                  <Image
                    src={featuredPhotograph.image}
                    alt={t(featuredPhotograph.imageAlt)}
                    fill
                    sizes="(max-width: 760px) 90vw, 55vw"
                  />
                </div>
                <figcaption>
                  <span>{t(featuredPhotograph.imageCaption)}</span>
                </figcaption>
              </figure>
            )}
          </div>
          <section className={styles.section} aria-labelledby={`${id}-matchas`}>
            <div className={`${styles.sectionHeader} ${styles.matchaHeader}`}>
              <h2 ref={productsHeading} id={`${id}-matchas`} tabIndex={-1}>
                {designation
                  ? t("{name} series", { name: t(designation.name) })
                  : t("Matcha from {place}", { place: t(place.name) })}
              </h2>
              {!loading && !catalogUnavailable && types.length > 1 && (
                <label className={`${styles.filter} ${styles.typeFilter}`}>
                  <span className={styles.label}>{t("Matcha type")}</span>
                  <select
                    value={selectedTypeId}
                    onChange={(event) =>
                      updateBrowse({
                        typeId: event.target.value,
                        visibleMatchaCount: PAGE_SIZE,
                      })
                    }
                  >
                    <option value="">{t("All types")}</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {t(type.label)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {designation && (
              <p className={styles.introduction}>
                {t(designation.productNote)}
              </p>
            )}
            {loading ? (
              <p className={styles.empty} role="status">
                {t("Loading matchas…")}
              </p>
            ) : catalogUnavailable ? (
              <div className={styles.catalogStatus}>
                <p className={styles.empty} role="status">
                  {t("Matchas are temporarily unavailable.")}
                </p>
                <button
                  className={styles.action}
                  type="button"
                  onClick={retryCatalog}
                >
                  {t("Try again")}
                  <span aria-hidden="true">↻</span>
                </button>
              </div>
            ) : matchas.length > 0 ? (
              <>
                <div id={`${id}-matcha-results`} className={styles.productList}>
                  {filteredMatchas
                    .slice(0, visibleMatchaCount)
                    .map((product) => {
                      const content = getProductContent(product, locale);
                      const growingPlaces = getPlacesForMatcha(product.handle);
                      const originLabel = [
                        ...growingPlaces.map((origin) => t(origin.name)),
                        ...getProductDesignations(product.handle).map(
                          (item) => `${t(item.name)} tea designation`,
                        ),
                      ].join(" + ");
                      return (
                        <Link
                          key={product.handle}
                          ref={(element) => {
                            if (element)
                              productLinks.current.set(product.handle, element);
                            else productLinks.current.delete(product.handle);
                          }}
                          className={styles.product}
                          href={{
                            pathname: home,
                            query: { matcha: product.handle },
                          }}
                        >
                          <div className={styles.powder} aria-hidden="true">
                            <ShopMaterialImage
                              src={content.materialImage}
                              alt=""
                            />
                          </div>
                          <span className={styles.productBody}>
                            <span className={styles.productName}>
                              {productName(
                                product.title,
                                product.handle,
                                locale,
                              )}
                            </span>
                            <span className={styles.productMeta}>
                              {originLabel}
                              {originLabel && " / "}
                              {content.application}
                            </span>
                          </span>
                          <span className={styles.availability}>
                            {product.variants.some(
                              (variant) => variant.available,
                            )
                              ? t("View matcha")
                              : t("Unavailable")}
                          </span>
                          <span className={styles.arrow} aria-hidden="true">
                            ↗
                          </span>
                        </Link>
                      );
                    })}
                </div>
                {filteredMatchas.length > visibleMatchaCount && (
                  <button
                    className={`${styles.action} ${styles.showMore}`}
                    type="button"
                    onClick={showMoreMatchas}
                    aria-controls={`${id}-matcha-results`}
                  >
                    {t("Show more matchas")}
                    <span aria-hidden="true">+</span>
                  </button>
                )}
              </>
            ) : (
              <p className={styles.empty}>
                {t("No matcha is currently listed for {place}.", {
                  place: designation
                    ? t("{name} series", { name: t(designation.name) })
                    : t(place.name),
                })}
              </p>
            )}
          </section>
          {children.length > 0 && (
            <section className={styles.within} aria-labelledby={`${id}-within`}>
              <h2 id={`${id}-within`}>
                {t("Within {place}", { place: t(place.name) })}
              </h2>
              <div id={`${id}-child-places`} className={styles.childPlaces}>
                {children.slice(0, visibleChildCount).map((child) => (
                  <button
                    key={child.id}
                    ref={(element) => {
                      if (element) placeButtons.current.set(child.id, element);
                      else placeButtons.current.delete(child.id);
                    }}
                    className={styles.action}
                    type="button"
                    onClick={() => onPlaceChange(child.id)}
                  >
                    {t(child.name)}
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
                {children.length > visibleChildCount && (
                  <button
                    className={styles.action}
                    type="button"
                    onClick={showMoreChildren}
                    aria-controls={`${id}-child-places`}
                  >
                    {t("More places")}
                    <span aria-hidden="true">+</span>
                  </button>
                )}
              </div>
            </section>
          )}
          <section className={styles.section} aria-labelledby={`${id}-entries`}>
            <div className={styles.sectionHeader}>
              <h2 ref={workHeading} tabIndex={-1} id={`${id}-entries`}>
                {t("People & work")}
              </h2>
            </div>
            <div
              className={styles.workLayout}
              data-photographs={entries.length > 0}
            >
              {entries.length > 0 && (
                <div>
                  <PlacePhotographs
                    id={`${id}-place-entry-results`}
                    entries={entries.slice(0, visibleEntryCount)}
                    onRead={onRead}
                    registerEntry={registerEntry}
                    featuredImage={featuredEntry?.image}
                  />
                  {entries.length > visibleEntryCount && (
                    <button
                      className={`${styles.action} ${styles.showMore}`}
                      type="button"
                      onClick={() => showMoreEntries(false)}
                      aria-controls={`${id}-place-entry-results`}
                    >
                      {t("Show more photographs")}
                      <span aria-hidden="true">+</span>
                    </button>
                  )}
                </div>
              )}
              {growerPlaceholder}
            </div>
          </section>
        </>
      ) : (
        <header className={styles.heading}>
          <div>
            <h1 ref={heading} id={`${id}-title`} tabIndex={-1}>
              {t("Place unavailable")}
            </h1>
            <button
              className={styles.action}
              type="button"
              onClick={() => onPlaceChange(null)}
            >
              {t("Return to Origins")}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>
      )}
      {placeId === null && (
        <section
          className={`${styles.section} ${styles.directoryGrowers}`}
          aria-labelledby={`${id}-people`}
        >
          <div className={styles.sectionHeader}>
            <h2 id={`${id}-people`}>{t("Growers")}</h2>
          </div>
          {growerPlaceholder}
        </section>
      )}
      <footer className={styles.footer}>
        <span>{t("ATOMA / Matcha collection")}</span>
        {onExplore ? (
          <button className={styles.action} type="button" onClick={onExplore}>
            {t("Explore matcha")}
            <span aria-hidden="true">↗</span>
          </button>
        ) : (
          <Link className={styles.action} href={home}>
            {t("Explore matcha")}
            <span aria-hidden="true">↗</span>
          </Link>
        )}
      </footer>
    </section>
  );
}

function Thumbnail({ entry }: { entry?: Pick<FieldEntry, "image"> }) {
  return (
    <span className={styles.thumbnail} aria-hidden="true">
      {entry ? (
        <Image
          src={entry.image}
          alt=""
          fill
          sizes="(max-width: 600px) 64px, 100px"
        />
      ) : (
        <span>—</span>
      )}
    </span>
  );
}

function PlacePhotographs({
  id,
  entries,
  onRead,
  registerEntry,
  featuredImage,
}: {
  id: string;
  entries: FieldEntry[];
  onRead: (slug: string) => void;
  registerEntry: (slug: string, element: HTMLButtonElement | null) => void;
  featuredImage?: string;
}) {
  const { t } = useStorefrontLocale();
  return (
    <div id={id} className={styles.collections}>
      {entries.map((entry) => {
        const photographs = entry.sections.flatMap((section) =>
          section.image
            ? [
                {
                  id: section.id,
                  src: section.image,
                  alt: section.imageAlt ?? "",
                  caption: section.imageCaption ?? entry.imageCaption,
                },
              ]
            : [],
        );
        if (
          entry.image !== featuredImage &&
          !photographs.some((photograph) => photograph.src === entry.image)
        ) {
          photographs.unshift({
            id: `${entry.slug}-landscape`,
            src: entry.image,
            alt: entry.imageAlt,
            caption: entry.imageCaption,
          });
        }
        return (
          <div key={entry.slug} className={styles.collection}>
            <div className={styles.collectionHeading}>
              <div>
                <h3 className={styles.collectionTitle}>{t(entry.title)}</h3>
                <p className={styles.path}>{t(entry.region)}</p>
              </div>
              <button
                ref={(element) => registerEntry(entry.slug, element)}
                className={styles.fieldLink}
                type="button"
                aria-label={t("View photographs: {title}", {
                  title: t(entry.title),
                })}
                onClick={() => onRead(entry.slug)}
              >
                {t("View photographs")}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
            {photographs.length > 0 && (
              <div className={styles.photographGrid}>
                {photographs.map((photograph) => (
                  <figure key={photograph.id}>
                    <div className={styles.photographImage}>
                      <Image
                        src={photograph.src}
                        alt={t(photograph.alt)}
                        fill
                        sizes="(max-width: 600px) 42vw, 35vw"
                      />
                    </div>
                    <figcaption>{t(photograph.caption)}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EntryList({
  id,
  entries,
  onRead,
  registerEntry,
}: {
  id: string;
  entries: FieldEntry[];
  onRead: (slug: string) => void;
  registerEntry: (slug: string, element: HTMLButtonElement | null) => void;
}) {
  const { t } = useStorefrontLocale();
  return (
    <div id={id} className={styles.entryList}>
      {entries.map((entry) => (
        <button
          key={entry.slug}
          ref={(element) => registerEntry(entry.slug, element)}
          className={styles.entry}
          type="button"
          onClick={() => onRead(entry.slug)}
        >
          <Thumbnail entry={entry} />
          <span className={styles.rowBody}>
            <span className={styles.path}>{t(entry.region)}</span>
            <span className={styles.entryTitle}>{t(entry.title)}</span>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
        </button>
      ))}
    </div>
  );
}
