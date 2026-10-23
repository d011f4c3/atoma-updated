"use client";

import { redirect, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  heroSevenDestination,
  heroSevenHref,
  heroSevenState,
  type HeroSevenBasePath,
  type HeroSevenView,
} from "@/lib/new-hero-seven-view";
import { useCart } from "./cart-drawer";
import { HeroLoader } from "./hero-loader";
import { useHeroLoading } from "./use-hero-loading";
import {
  NewHeroSevenHeader,
  NewHeroSevenHome,
  NewHeroSevenMatcha,
  newHeroSevenSiteNavigation,
} from "./new-hero-seven";
import { NewHeroSevenSamples } from "./new-hero-seven-details";
import {
  HeroSevenLink,
  HeroSevenNavigation,
} from "./new-hero-seven-navigation";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { StorefrontFooter } from "./storefront-footer";
import { ThemeSwitcher } from "./theme-switcher";
import heroStyles from "./new-hero-five.module.css";
import styles from "./new-hero-seven.module.css";

export function NewHeroSevenExperience({
  year,
  basePath = "/new-hero7",
}: {
  year: number;
  basePath?: HeroSevenBasePath;
}) {
  const params = useSearchParams();
  const state = useMemo(
    () => heroSevenState(params.get("view"), params.get("application")),
    [params],
  );
  const signature = heroSevenHref(state, basePath);
  const { navigationBusy } = useCart();
  const { tone } = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const frame = useRef<HTMLDivElement>(null);
  const [heroReady, setHeroReady] = useState(false);
  const markHeroReady = useCallback(() => setHeroReady(true), []);
  const intro = useHeroLoading(
    basePath === "/" && state.view === "home" && !state.application,
    heroReady,
    frame,
  );
  const [visited, setVisited] = useState<HeroSevenView[]>([state.view]);
  // Keep visited views mounted, preserving their inputs and loaded material.
  if (!visited.includes(state.view)) setVisited([...visited, state.view]);
  const main = useRef<HTMLElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const previous = useRef(signature);
  const positions = useRef(new Map<string, number>());
  const arrival = useRef<"entry" | "history" | null>(
    state.application ? "entry" : null,
  );
  const current = useRef(signature);

  useLayoutEffect(() => {
    const node = header.current;
    if (!node) return;
    const measure = () =>
      main.current?.style.setProperty(
        "--seven-header-height",
        `${node.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const placeFocus = useCallback(
    (restore: boolean) => {
      const active = main.current?.querySelector<HTMLElement>(
        "[data-seven-panel]:not([hidden])",
      );
      // Product popups own their focus. Only whole-view navigation moves the page.
      const target = state.application
        ? null
        : Array.from(active?.querySelectorAll<HTMLElement>("h1") ?? []).find(
            (heading) => heading.getClientRects().length > 0,
          );
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
      const top = restore ? (positions.current.get(signature) ?? 0) : 0;
      window.scrollTo({ top, behavior: "instant" });
    },
    [signature, state.application],
  );

  const navigate = useCallback(
    (href: string) => {
      if (navigationBusy) return;
      const next = heroSevenDestination(href, basePath);
      if (!next) return;
      const nextHref = heroSevenHref(next, basePath);
      positions.current.set(signature, window.scrollY);
      if (nextHref === signature) {
        if (!next.application) placeFocus(false);
        return;
      }
      arrival.current = "entry";
      // Let Next attach its own routing metadata; no router navigation or fetch.
      window.history.pushState(null, "", nextHref);
    },
    [navigationBusy, signature, placeFocus, basePath],
  );

  useEffect(() => {
    // Canonical links need native route Back/Forward restoration. The saved
    // study retains its manual restoration for its in-place views.
    const restoration = window.history.scrollRestoration;
    if (basePath !== "/") window.history.scrollRestoration = "manual";
    const rememberScroll = () =>
      positions.current.set(current.current, window.scrollY);
    const traverse = () => {
      const url = new URL(window.location.href);
      const next = heroSevenHref(
        heroSevenState(
          url.searchParams.get("view"),
          url.searchParams.get("application"),
        ),
        basePath,
      );
      // The Origins reader owns its hash and restores its own focus/scroll.
      if (url.pathname === basePath && next !== current.current)
        arrival.current = "history";
    };
    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("popstate", traverse);
    return () => {
      if (basePath !== "/") window.history.scrollRestoration = restoration;
      window.removeEventListener("scroll", rememberScroll);
      window.removeEventListener("popstate", traverse);
    };
  }, [basePath]);

  useLayoutEffect(() => {
    current.current = signature;
    if (previous.current === signature && !arrival.current) return;
    const previousView = heroSevenDestination(previous.current, basePath)?.view;
    const withinProductView =
      previousView === state.view &&
      (state.view === "matcha" || state.view === "home");
    previous.current = signature;
    // Retained views must not leave a hidden inspection dialog in the top layer.
    main.current
      ?.querySelectorAll<HTMLDialogElement>(
        "[data-seven-panel][hidden] dialog[open]",
      )
      .forEach((dialog) => dialog.close());
    const restore = arrival.current === "history";
    arrival.current = null;
    if (!withinProductView) placeFocus(restore);
  }, [signature, state.view, placeFocus, basePath]);

  const navigation = useMemo(
    () => ({ state, navigate, basePath }),
    [state, navigate, basePath],
  );
  const home = state.view === "home";

  if (params.get("view") === "origins") redirect("/origins");
  if (params.get("view") === "wholesale")
    redirect(basePath === "/" ? "/wholesale" : "/shop");

  return (
    <HeroSevenNavigation value={navigation}>
      <div
        ref={frame}
        className={`${heroStyles.page} ${styles.frame}`}
        data-homepage={basePath === "/" || undefined}
        data-hero-loading={intro.phase === "done" ? undefined : intro.phase}
        data-hero-paused={intro.blocking || undefined}
        inert={intro.blocking}
        aria-busy={intro.blocking || undefined}
        data-new-hero7
        data-new-hero7-experience
        data-active-view={state.view}
        data-tone={tone}
        data-storefront-theme={tone}
        data-client-reading
      >
        <div className={styles.experienceStage} data-home={home}>
          <div ref={header} className={styles.experienceHeader}>
            <NewHeroSevenHeader />
          </div>
          <main
            ref={main}
            className={home ? styles.experienceHome : styles.main}
            data-selection-view={
              state.view === "matcha" || state.view === "samples" || undefined
            }
            id="new-hero7-content"
          >
            {visited.map((view) => (
              <div
                key={view}
                data-seven-panel={view}
                hidden={state.view !== view}
              >
                {view === "home" && (
                  <NewHeroSevenHome
                    contained
                    motionPaused={intro.phase !== "done"}
                    onHeroReady={markHeroReady}
                  />
                )}
                {view === "matcha" && <NewHeroSevenMatcha />}
                {view === "samples" && <NewHeroSevenSamples />}
              </div>
            ))}
          </main>
        </div>
        {basePath === "/" ? (
          <StorefrontFooter year={year} />
        ) : (
          <footer className={styles.footer} data-new-hero7-footer>
            <HeroSevenLink
              href={basePath}
              className={styles.footerBrand}
              aria-disabled={navigationBusy || undefined}
            >
              ATOMA <span>© {year}</span>
            </HeroSevenLink>
            <nav aria-label={t("Main navigation")}>
              {newHeroSevenSiteNavigation.map((item) => (
                <HeroSevenLink
                  key={item.key}
                  href={item.key === "matcha" ? basePath : item.href}
                  aria-current={
                    home && item.key === "matcha" ? "page" : undefined
                  }
                  aria-disabled={navigationBusy || undefined}
                  onClick={(event) => {
                    if (navigationBusy) event.preventDefault();
                  }}
                >
                  {t(item.label)}
                </HeroSevenLink>
              ))}
            </nav>
            <ThemeSwitcher label="Dark mode in footer" />
          </footer>
        )}
      </div>
      {intro.phase !== "done" && (
        <HeroLoader
          progress={intro.progress}
          phase={intro.phase}
          tone={tone}
          storefront={basePath === "/"}
        />
      )}
      {basePath === "/" && (
        <noscript>
          <style>{`[data-hero-loader] { display: none !important; } [data-homepage] [data-page-enter], [data-homepage] [data-new-hero7-material] img { animation: none !important; opacity: 1 !important; translate: none !important; transform: none !important; }`}</style>
        </noscript>
      )}
    </HeroSevenNavigation>
  );
}
