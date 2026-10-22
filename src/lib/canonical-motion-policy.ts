const canonicalPages = new Set([
  "/",
  "/new-hero",
  "/new-hero2",
  "/new-hero3",
  "/new-hero4",
  "/new-hero5",
  "/new-hero6",
  "/new-hero7",
  "/new-hero7/matcha",
  "/new-hero7/samples",
  "/new-hero7/origins",
  "/new-hero7/wholesale",
  "/shop",
  "/wholesale",
  "/samples",
  "/about",
  "/origins",
]);

/** Exact public routes, not similarly named saved studies or arbitrary prefixes. */
export function isCanonicalMotionRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname;
  return (
    canonicalPages.has(path) ||
    path.startsWith("/shop/") ||
    path.startsWith("/field-notes/")
  );
}

export const motionControlSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="radio"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(", ");

export const motionHeadingSelector = 'h1, h2, h3, h4, h5, h6, [role="heading"]';

/** Authored text effects are shared across pages; live data can opt out. */
export function permitsScramble(
  _pathname: string | null,
  context: {
    interactive: boolean;
    insideHeading: boolean;
    insideControl: boolean;
    stableData?: boolean;
  },
): boolean {
  return !context.stableData;
}

/** Text and image entrances are allowed without delaying canonical controls. */
export function permitsPageReveal(
  pathname: string | null,
  context: {
    visualTreatment: boolean;
    hasMedia: boolean;
    hasText: boolean;
    hasControl: boolean;
  },
): boolean {
  return !isCanonicalMotionRoute(pathname) || !context.hasControl;
}
