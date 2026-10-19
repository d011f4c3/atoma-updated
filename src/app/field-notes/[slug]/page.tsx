import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FieldNotePage } from "@/components/field-note-page";
import { aboutPhotoStories } from "@/lib/about-photo-stories";
import { translate } from "@/lib/i18n";
import { readStorefrontLocale } from "@/lib/i18n/server";

type FieldNoteRouteProps = { params: Promise<{ slug: string }> };

function findStory(slug: string) {
  const story = aboutPhotoStories.find((entry) => entry.slug === slug);
  if (!story) notFound();
  return story;
}

export async function generateMetadata({
  params,
}: FieldNoteRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const story = findStory(slug);
  const locale = await readStorefrontLocale();
  const title = `ATOMA — ${translate(locale, story.title)}`;
  const description = translate(locale, story.introduction);
  const photograph = story.photographs[0];
  return {
    title,
    description,
    openGraph: {
      type: "article",
      siteName: "ATOMA",
      title,
      description,
      url: `/field-notes/${story.slug}`,
      images: [
        {
          url: photograph.src,
          width: photograph.width,
          height: photograph.height,
          alt: translate(locale, photograph.alt),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [photograph.src],
    },
  };
}

export default async function FieldNoteRoute({ params }: FieldNoteRouteProps) {
  const { slug } = await params;
  return (
    <FieldNotePage story={findStory(slug)} year={new Date().getUTCFullYear()} />
  );
}
