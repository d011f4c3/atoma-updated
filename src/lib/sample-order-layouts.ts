export const sampleOrderLayouts = [
  {
    value: "essentials",
    name: "01 Essentials",
    description:
      "A compact summary of the set, with price, quantity and ordering kept together.",
  },
  {
    value: "index",
    name: "02 Set index",
    description:
      "A clear list of the three matcha, followed by one simple order action.",
  },
  {
    value: "purchase",
    name: "03 Purchase first",
    description:
      "Ordering comes first. Open the contents only when you want a closer look.",
  },
] as const;

export type SampleOrderLayout = (typeof sampleOrderLayouts)[number]["value"];

export function resolveSampleOrderLayout(value: unknown): SampleOrderLayout {
  return value === "index" || value === "purchase" ? value : "essentials";
}
