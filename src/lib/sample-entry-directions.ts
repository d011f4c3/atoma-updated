export const sampleEntryDirections = [
  {
    value: "connected",
    name: "01 — Connected",
    description:
      "A first card beside the teas, a short information prompt and a Samples navigation link. In Shop, the set leads the collection.",
  },
  {
    value: "featured",
    name: "02 — Sample first",
    description:
      "A photographic panel leads the selection, with a second route at the workspace edge. Shop opens with the same sample feature.",
  },
  {
    value: "quiet",
    name: "03 — Quiet repetition",
    description:
      "A compact selection rail, an information-panel invitation and quiet links in navigation and at the end of the collection.",
  },
] as const;

export type SampleEntryDirection =
  (typeof sampleEntryDirections)[number]["value"];
export type SampleEntryContext = "explore" | "shop";

export const samplePriorityEntries = [
  {
    value: "start",
    name: "08 — In-place sample information",
    description:
      "Select Sample Set on the left to read its information on the right. Tea views and order choices stay intact; Samples remains a separate purchase page.",
  },
  {
    value: "invitation",
    name: "04 — Open invitation",
    description:
      "A leading sample invitation above the right-side tabs. The set stays visible while you move between the selected tea’s four views.",
  },
  {
    value: "preparation",
    name: "05 — By preparation",
    description:
      "An application-led introduction to the three samples, placed before the tea information in Overview and Shop.",
  },
  {
    value: "alongside",
    name: "06 — Alongside this tea",
    description:
      "A sample companion connected to the selected tea, below the information panel and available across all four views.",
  },
  {
    value: "spotlight",
    name: "07 — Set spotlight",
    description:
      "A more prominent photographic feature gives the sample set the first position in Overview, with a clear route to its contents.",
  },
] as const;

export const sampleRightEntries = [
  ...samplePriorityEntries,
  {
    value: "folio",
    name: "01 — Set folio",
    description:
      "A photographic introduction to all three matcha in Overview. Each material has a clear name and amount, with one route into the set.",
  },
  {
    value: "companion",
    name: "02 — Companion dock",
    description:
      "A compact sample companion below the right-side information. It stays available as you move between the tea’s four views.",
  },
  {
    value: "compare",
    name: "03 — Open comparison",
    description:
      "An expandable set preview in Overview and Shop. Open it to compare the three uses, then continue to Samples without changing the selected tea.",
  },
  {
    value: "default",
    name: "Direction default",
    description: "The original combination of entrypoints for this direction.",
  },
  {
    value: "off",
    name: "Earlier — Left side only",
    description:
      "The earlier homepage treatment. The left rail links directly to Samples; the right side stays focused on the selected tea.",
  },
  {
    value: "note",
    name: "Earlier — Compact note",
    description:
      "A short text invitation above Overview and Shop. No extra image.",
  },
  {
    value: "panel",
    name: "Earlier — Overview panel",
    description: "A compact photographic entrance in Overview only.",
  },
  {
    value: "footnote",
    name: "Earlier — Information footnote",
    description:
      "A quiet invitation after the selected tea's information in Overview and Shop.",
  },
] as const;

export type SampleRightEntry = (typeof sampleRightEntries)[number]["value"];

export function resolveSampleRightEntry(value: unknown): SampleRightEntry {
  return (
    sampleRightEntries.find((item) => item.value === value)?.value ?? "default"
  );
}

export function resolveSampleEntryDirection(
  value: unknown,
): SampleEntryDirection {
  return (
    sampleEntryDirections.find((item) => item.value === value)?.value ??
    "connected"
  );
}

export function resolveSampleEntryContext(value: unknown): SampleEntryContext {
  return value === "shop" ? "shop" : "explore";
}
