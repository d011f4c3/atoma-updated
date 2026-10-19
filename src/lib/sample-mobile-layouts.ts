export const sampleMobileLayouts = [
  {
    value: "current",
    name: "Original",
    description:
      "The original Sample Set panel, with its full summary and ordering.",
  },
  {
    value: "tabs",
    name: "Tabs",
    description: "Explore the set and order through three focused views.",
  },
  {
    value: "compact",
    name: "Compact",
    description: "Keep the credit and order controls together below the set.",
  },
  {
    value: "reveal",
    name: "Reveal",
    description:
      "Open ordering when you are ready, while keeping the set in view.",
  },
] as const;

export type SampleMobileLayout = (typeof sampleMobileLayouts)[number]["value"];

export function resolveSampleMobileLayout(value: unknown): SampleMobileLayout {
  return value === "current" || value === "tabs" || value === "reveal"
    ? value
    : "compact";
}
