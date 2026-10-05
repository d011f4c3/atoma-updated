import type { CatalogProduct } from "./catalog-types";
import { FIELD_ENTRIES, type FieldEntry } from "./origins-content.ts";
import {
  getPlacePath,
  getProductPlaceRecords,
  ORIGINS_GRAPH,
  type OriginsGraph,
} from "./origins-model.ts";
import { productName } from "./product-name.ts";

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
) {
  const name = productName(product.title);
  const places = getProductPlaceRecords(product.handle, graph)
    .filter(
      (record) =>
        record.role === "grown" &&
        record.subjects.some((subject) => subject.kind === "material"),
    )
    .map(({ place }) => {
      const path = getPlacePath(place.id, graph);
      // A regional image adds context; it does not establish a specific field
      // or lot. Keep its original caption and prefer the nearest covered place.
      const entry = path
        .toReversed()
        .map((ancestor) =>
          entries.find((item) => item.placeIds.includes(ancestor.id)),
        )
        .find((item) => item?.image);

      return {
        id: place.id,
        name: place.name,
        path: path.map(({ name, kind, description }) => ({
          name,
          kind,
          description,
        })),
        description: `${name} is grown in ${place.name}.`,
        photograph: entry
          ? {
              image: entry.image,
              imageAlt: entry.imageAlt,
              imageCaption: entry.imageCaption,
              observation: entry.sections[0]?.body[0] ?? entry.dek,
              slug: entry.slug,
            }
          : undefined,
        context: place.id === "wazuka" ? wazukaContext : undefined,
      };
    });

  return { name, places };
}
