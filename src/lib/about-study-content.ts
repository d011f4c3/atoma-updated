import { FIELD_ENTRIES } from "./origins-content.ts";

const fieldStory = FIELD_ENTRIES.find(
  (entry) => entry.slug === "kyoto-field-observations",
);
if (!fieldStory)
  throw new Error("The About study requires the Kyoto field entry.");

/** Editorial interpretation of the supplied brand notes and October feedback,
 * especially About (§6) and readability (§7). No new product or activity facts. */
export const aboutStudyContent = {
  title: "Matcha, in detail.",
  lead: "ATOMA is an interface for understanding, selecting and buying matcha. We begin with flavour, texture and performance — and what you want to make.",
  approachTitle: "Selected for an application.",
  principles: [
    {
      number: "01",
      title: "Character",
      text: "Flavour, texture, performance.",
    },
    {
      number: "02",
      title: "Format",
      text: "The amount you need.",
    },
    {
      number: "03",
      title: "Application",
      text: "Water, milk, recipes.",
    },
  ],
  placeTitle: "From material to place.",
  placeBody:
    "We visit tea-producing places, speak with the people involved, and document the landscape and work through photography and writing. Wazuka is the first chapter in this growing body of observations and relationships.",
  provenanceNote:
    "Photography from Kyoto. Each matcha’s origin is recorded with the product.",
  community: {
    status: "Looking ahead",
    title: "A place for community.",
    body: "This space will grow with photographs and accounts of community activities and support work in places such as Wazuka. Stories will be added as that work is carried out and documented.",
    note: "Community involvement and product origin are separate stories.",
  },
  fieldStory,
} as const;

export type CommunityStory = Readonly<{
  id: string;
  title: string;
  summary: string;
  place: string;
  activityDate: string;
  source: string;
  status: "draft" | "confirmed";
  publicationApproved: boolean;
}>;

/** No completed activities or company identity were supplied in the client brief. */
export const communityStories: readonly CommunityStory[] = [];

export function getConfirmedCommunityStories(
  stories: readonly CommunityStory[] = communityStories,
) {
  return stories.filter(
    (story) =>
      story.status === "confirmed" &&
      story.publicationApproved &&
      [
        story.id,
        story.title,
        story.summary,
        story.place,
        story.activityDate,
        story.source,
      ].every((value) => value.trim()),
  );
}
