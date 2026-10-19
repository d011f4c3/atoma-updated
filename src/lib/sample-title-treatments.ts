export const sampleTitleTreatments = [
  {
    value: "current",
    name: "Current",
    note: "The existing name and format, kept as a reference.",
  },
  {
    value: "plain",
    name: "Quiet title",
    note: "Name and format share a line, with the total weight beneath.",
  },
  {
    value: "register",
    name: "Register",
    note: "An open diamond connects the title to the product labels.",
  },
  {
    value: "rule",
    name: "Ruled caption",
    note: "A fine rule separates the name from the set specification.",
  },
  {
    value: "tab",
    name: "Edge label",
    note: "The title sits on the panel edge, like a label on a specimen.",
  },
  {
    value: "quantity",
    name: "Quantity first",
    note: "The three portions lead, with Sample Set as the name below.",
  },
] as const;

export type SampleTitleTreatment =
  (typeof sampleTitleTreatments)[number]["value"];

export function sampleTitleTreatment(value: unknown): SampleTitleTreatment {
  return (
    sampleTitleTreatments.find((item) => item.value === value)?.value ??
    "current"
  );
}
