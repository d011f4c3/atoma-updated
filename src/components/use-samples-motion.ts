"use client";

import { useEffect, type RefObject } from "react";
import { usePageScroll } from "./smooth-scroll";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Native scroll owns the reading position; one scheduled frame updates the scene. */
export function useSamplesMotion(ref: RefObject<HTMLElement | null>) {
  const scrollTo = usePageScroll();
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const motion = window.matchMedia(
      "(min-width: 900px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
    );
    const cover = root.querySelector<HTMLElement>("[data-samples-cover]");
    const range = root.querySelector<HTMLElement>("[data-samples-range]");
    const viewport = root.querySelector<HTMLElement>(
      "[data-samples-range-viewport]",
    );
    const track = root.querySelector<HTMLElement>("[data-samples-range-track]");
    const photograph = root.querySelector<HTMLElement>(
      "[data-samples-preparation]",
    );
    const links = root.querySelectorAll<HTMLAnchorElement>(
      "[data-sample-range-link]",
    );
    let frame = 0;

    function geometry() {
      if (!range || !viewport || !track) return null;
      const box = range.getBoundingClientRect();
      const padding = getComputedStyle(viewport);
      const visibleWidth =
        viewport.clientWidth -
        parseFloat(padding.paddingLeft) -
        parseFloat(padding.paddingRight);
      return {
        top: box.top + window.scrollY,
        distance: Math.max(0, box.height - window.innerHeight),
        overflow: Math.max(0, track.scrollWidth - visibleWidth),
      };
    }

    function update() {
      frame = 0;
      root!.dataset.samplesMotion = motion.matches ? "ready" : "static";
      const coverProgress =
        cover && motion.matches
          ? clamp(
              -cover.getBoundingClientRect().top / (window.innerHeight * 0.6),
            )
          : 0;
      cover?.style.setProperty(
        "--sample-cover-progress",
        String(coverProgress),
      );
      const rail = geometry();
      const progress =
        rail && motion.matches
          ? clamp((window.scrollY - rail.top) / Math.max(1, rail.distance))
          : 0;
      range?.style.setProperty("--sample-range-progress", String(progress));
      range?.style.setProperty(
        "--sample-range-offset",
        `${progress * (rail?.overflow ?? 0)}px`,
      );
      const active = Math.round(progress * 2);
      links.forEach((link, index) => {
        if (motion.matches && index === active)
          link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
      if (photograph) {
        const bounds = photograph.getBoundingClientRect();
        const reveal = motion.matches
          ? clamp(
              (window.innerHeight - bounds.top) / (window.innerHeight * 0.75),
            )
          : 1;
        photograph.style.setProperty(
          "--sample-photo-inset",
          `${(1 - reveal) * 12}%`,
        );
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function jump(event: MouseEvent) {
      if (
        !motion.matches ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("[data-sample-range-link]")
          : null;
      if (!link) return;
      // The storefront's global anchor handler cannot map a horizontal entry.
      event.preventDefault();
      event.stopPropagation();
      if (link.getAttribute("aria-disabled") === "true") return;
      const target = document.getElementById(link.hash.slice(1));
      const rail = geometry();
      if (!target || !track || !rail) return;
      const position = clamp(
        (target.getBoundingClientRect().left -
          track.getBoundingClientRect().left) /
          Math.max(1, rail.overflow),
      );
      scrollTo(rail.top + rail.distance * position);
      target.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    if (track) observer.observe(track);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    root.addEventListener("click", jump);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      root.removeEventListener("click", jump);
    };
  }, [ref, scrollTo]);
}
