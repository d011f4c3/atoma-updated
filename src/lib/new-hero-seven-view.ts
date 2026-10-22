import type { ProductKey } from "./product-codes";

export const heroSevenViews = ["home", "matcha", "samples"] as const;
export type HeroSevenView = (typeof heroSevenViews)[number];
export type HeroSevenState = { view: HeroSevenView; application?: ProductKey };
export type HeroSevenBasePath = "/" | "/new-hero7";

export function heroSevenState(
  view: unknown,
  application?: unknown,
): HeroSevenState {
  const selected = heroSevenViews.find((item) => item === view) ?? "home";
  return {
    view: selected,
    ...((selected === "home" || selected === "matcha") &&
    (application === "ceremonial" ||
      application === "barista" ||
      application === "culinary")
      ? { application }
      : {}),
  };
}

export function heroSevenHref(
  state: HeroSevenState,
  basePath: HeroSevenBasePath = "/new-hero7",
): string {
  const params = new URLSearchParams();
  if (state.view !== "home") params.set("view", state.view);
  if ((state.view === "home" || state.view === "matcha") && state.application)
    params.set("application", state.application);
  return `${basePath}${params.size ? `?${params}` : ""}`;
}

/** Only the hero and its selection views participate; canonical pages navigate normally. */
export function heroSevenDestination(
  href: string,
  basePath: HeroSevenBasePath = "/new-hero7",
): HeroSevenState | null {
  const url = new URL(href, "https://atoma.invalid");
  if (url.origin !== "https://atoma.invalid") return null;
  if (url.pathname === basePath) {
    const view = url.searchParams.get("view");
    // Let obsolete study destinations reach their canonical route redirects.
    if (view === "origins" || view === "wholesale") return null;
    return heroSevenState(view, url.searchParams.get("application"));
  }
  if (basePath === "/") return null;
  const view = heroSevenViews.find(
    (item) => url.pathname === `/new-hero7/${item}`,
  );
  return view
    ? heroSevenState(view, url.hash.replace("#new-hero7-", ""))
    : null;
}
