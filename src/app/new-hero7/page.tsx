import { redirect } from "next/navigation";
import { NewHeroSevenExperience } from "@/components/new-hero-seven-experience";

export default async function NewHeroSevenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Render direct view URLs on the server, including before hydration.
  const params = await searchParams;
  const view = Array.isArray(params.view) ? params.view[0] : params.view;
  if (view === "origins") redirect("/origins");
  if (view === "wholesale") redirect("/shop");
  return <NewHeroSevenExperience year={new Date().getUTCFullYear()} />;
}
