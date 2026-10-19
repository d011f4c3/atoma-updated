export const samplePanelLayouts = [
  {
    value: "lead",
    name: "01 — Lead card",
    description:
      "The Sample Set leads the row with a wider card; the three teas remain alongside.",
  },
  {
    value: "equal",
    name: "02 — Shared row",
    description:
      "Four cards in the same family, with the Sample Set first and selected.",
  },
  {
    value: "feature",
    name: "03 — Feature panel",
    description:
      "A full-width Sample Set panel sits above the three individual tea choices.",
  },
  {
    value: "split",
    name: "04 — Split group",
    description:
      "The Sample Set anchors the left, beside a vertical list of the three teas.",
  },
] as const;

export type SamplePanelLayout = (typeof samplePanelLayouts)[number]["value"];
export function resolveSamplePanelLayout(value: unknown): SamplePanelLayout {
  return (
    samplePanelLayouts.find((item) => item.value === value)?.value ?? "lead"
  );
}
