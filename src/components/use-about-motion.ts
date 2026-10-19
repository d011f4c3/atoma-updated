"use client";

import { useEffect, type RefObject } from "react";

/** Scroll changes reserved visual stages; it never changes document geometry. */
export function useAboutMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const roomy = window.matchMedia(
      "(min-width: 900px) and (min-height: 650px)",
    );
    const cover = root.querySelector<HTMLElement>("[data-about-cover]");
    const approach = root.querySelector<HTMLElement>("[data-about-approach]");
    const steps = Array.from(
      root.querySelectorAll<HTMLElement>("[data-approach-step]"),
    );
    const connections = root.querySelector<HTMLElement>(
      "[data-about-connections]",
    );
    const rail = root.querySelector<HTMLElement>("[data-about-field-rail]");
    const track = root.querySelector<HTMLElement>("[data-about-field-track]");
    const viewport = root.querySelector<HTMLElement>(
      "[data-about-field-viewport]",
    );
    const counter = root.querySelector<HTMLElement>(
      "[data-about-rail-current]",
    );
    let frame = 0;
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const set = (
      node: HTMLElement | null,
      name: string,
      value: number,
      unit = "",
    ) => node?.style.setProperty(name, `${value.toFixed(4)}${unit}`);

    function update() {
      frame = 0;
      if (!root || document.hidden) return;
      const motion = roomy.matches && !preference.matches;
      root.dataset.aboutMotion = motion ? "ready" : "reduced";
      set(
        root,
        "--about-progress",
        clamp(
          scrollY /
            Math.max(1, document.documentElement.scrollHeight - innerHeight),
        ),
      );
      if (cover)
        set(
          cover,
          "--cover-progress",
          motion
            ? clamp(-cover.getBoundingClientRect().top / (innerHeight * 0.75))
            : 0,
        );
      const firstStep = steps[0];
      const lastStep = steps.at(-1);
      if (approach && firstStep && lastStep) {
        const first = firstStep.getBoundingClientRect();
        const last = lastStep.getBoundingClientRect();
        const progress = clamp(
          (innerHeight * 0.5 - first.top - first.height * 0.5) /
            Math.max(
              1,
              last.top + last.height * 0.5 - first.top - first.height * 0.5,
            ),
        );
        set(approach, "--approach-progress", motion ? progress : 1);
        approach.dataset.step =
          steps[Math.round(progress * (steps.length - 1))]?.dataset
            .approachStep ?? firstStep.dataset.approachStep;
      }
      if (connections) {
        const box = connections.getBoundingClientRect();
        set(
          connections,
          "--connections-progress",
          motion
            ? clamp(
                (innerHeight * 0.8 - box.top) / Math.max(1, box.height * 0.65),
              )
            : 1,
        );
      }
      if (rail && track && viewport) {
        const box = rail.getBoundingClientRect();
        const progress = motion
          ? clamp(-box.top / Math.max(1, box.height - innerHeight))
          : 0;
        const style = getComputedStyle(viewport);
        const available =
          viewport.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        set(rail, "--field-progress", progress);
        set(
          rail,
          "--field-offset",
          Math.max(0, track.scrollWidth - available) * progress,
          "px",
        );
        if (counter) counter.textContent = progress >= 0.5 ? "02" : "01";
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function revealFocusedStory(event: FocusEvent) {
      if (
        !rail ||
        !roomy.matches ||
        preference.matches ||
        !(event.target instanceof HTMLElement) ||
        !event.target.matches(":focus-visible")
      )
        return;
      const story = event.target.closest<HTMLElement>("[data-about-story]");
      if (!story) return;
      const entries = Array.from(rail.querySelectorAll("[data-about-story]"));
      const index = entries.indexOf(story);
      if (index < 0) return;
      const box = rail.getBoundingClientRect();
      window.scrollTo({
        top:
          scrollY +
          box.top +
          ((box.height - innerHeight) * index) /
            Math.max(1, entries.length - 1),
        behavior: "instant",
      });
      schedule();
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    preference.addEventListener("change", schedule);
    roomy.addEventListener("change", schedule);
    root.addEventListener("focusin", revealFocusedStory);
    const resize = new ResizeObserver(schedule);
    if (track) resize.observe(track);
    if (rail) resize.observe(rail);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      preference.removeEventListener("change", schedule);
      roomy.removeEventListener("change", schedule);
      root.removeEventListener("focusin", revealFocusedStory);
    };
  }, [rootRef]);
}
