import type { CatalogProduct } from "./catalog-types";
import {
  FIELD_ENTRIES,
  getFieldEntryPhotograph,
  type FieldEntry,
} from "./origins-content.ts";
import {
  getPlacePath,
  getProductPlaceRecords,
  getProductDesignations,
  ORIGINS_GRAPH,
  type OriginsGraph,
} from "./origins-model.ts";
import { productName } from "./product-name.ts";
import { translate, type Locale } from "./i18n/index.ts";

// Regional landscape context, separate from the owner's product-origin records
// and from the Kyoto photographs' editorial coverage. Town landscape plan,
// April 2026, chapter 1, section 1 (PDF page 4).
// Source: https://www.town.wazuka.lg.jp/material/files/group/3/wazuka-keikankeikakuhenkou.pdf
const wazukaContext = {
  text: "Tea fields occupy the slopes around the Wazuka River valley, surrounded by wooded hills.",
};

export function getOriginPreview(
  product: CatalogProduct,
  graph: OriginsGraph = ORIGINS_GRAPH,
  entries: readonly FieldEntry[] = FIELD_ENTRIES,
  locale: Locale = "en",
) {
  const t = (source: string, values?: Record<string, string | number>) =>
    translate(locale, source, values);
  const name = productName(product.title, product.handle, locale);
  function photographForPath(path: ReturnType<typeof getPlacePath>) {
    // Editorial context does not establish a field, lot or product origin.
    const entry = path
      .toReversed()
      .map((ancestor) =>
        entries.find((item) => item.placeIds.includes(ancestor.id)),
      )
      .find((item) => item?.image);
    if (!entry) return undefined;
    const photograph = getFieldEntryPhotograph(entry, path.at(-1)?.id);
    return {
      image: photograph.image,
      imageAlt: t(photograph.imageAlt),
      imageCaption: t(photograph.imageCaption),
      observation: t(photograph.observation),
      slug: entry.slug,
    };
  }
  const places = getProductPlaceRecords(product.handle, graph)
    .filter(
      (record) =>
        record.role === "grown" &&
        record.subjects.some((subject) => subject.kind === "material"),
    )
    .map(({ place }) => {
      const path = getPlacePath(place.id, graph);
      return {
        id: place.id,
        kind: "place" as const,
        name: t(place.name),
        roleLabel: t("Grown in"),
        hierarchyLabel: t("Geographic hierarchy"),
        parents: path
          .slice(0, -1)
          .reverse()
          .map((ancestor) => t(ancestor.name))
          .join(", "),
        path: path.map(({ name, kind, description }) => ({
          name: t(name),
          kind,
          description: t(description),
        })),
        description: t("{product} is grown in {place}.", {
          product: name,
          place: t(place.name),
        }),
        photograph: photographForPath(path),
        context:
          place.id === "wazuka" ? { text: t(wazukaContext.text) } : undefined,
        linkPlaceId: place.id,
        aboutLabel: t("About {place}", { place: t(place.name) }),
        exploreLabel: t("Explore the growing region"),
      };
    });
  const designations = getProductDesignations(product.handle, graph).flatMap(
    (designation) => {
      // Match the place preview format using the designation's editorial
      // context. This path never creates a product growing/processing record.
      const path = getPlacePath(designation.contextPlaceId, graph);
      const place = path.at(-1);
      if (!place) return [];
      return [
        {
          id: designation.id,
          kind: "designation" as const,
          name: t(place.name),
          roleLabel: t("Origin"),
          hierarchyLabel: t("Geographic hierarchy"),
          parents: path
            .slice(0, -1)
            .reverse()
            .map((ancestor) => t(ancestor.name))
            .join(", "),
          path: path.map(({ name, kind, description }) => ({
            name: t(name),
            kind,
            description: t(description),
          })),
          description: `${t(designation.summary)} ${t("Specific growing and processing locations are not yet published.")}`,
          photograph: photographForPath(path),
          context: undefined,
          linkPlaceId: designation.contextPlaceId,
          aboutLabel: t("About Uji"),
          exploreLabel: t("Explore Uji"),
        },
      ];
    },
  );

  return { name, places, designations };
}
