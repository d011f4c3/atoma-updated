"use client";

import { useEffect, type RefObject } from "react";

/** One-shot phone entrances; scroll-linked photograph motion stays independent. */
export function useAboutReveals(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root?.hasAttribute("data-about-page")) return;
    const motion = window.matchMedia(
      "(max-width: 760px) and (prefers-reduced-motion: no-preference)",
    );
    const heroes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-about-enter]"),
    );
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-about-reveal]"),
    );
    let observer: IntersectionObserver | null = null;

    function finish(node: HTMLElement) {
      if (node.hasAttribute("data-about-enter"))
        node.setAttribute("data-about-enter-done", "");
      if (node.hasAttribute("data-about-reveal")) {
        node.dataset.aboutRevealState = "complete";
        observer?.unobserve(node);
      }
      node.removeAttribute("data-about-image-arriving");
    }

    function finishAll() {
      observer?.disconnect();
      observer = null;
      for (const node of [...heroes, ...sections]) finish(node);
      root!
        .querySelectorAll<HTMLElement>("[data-about-image-arriving]")
        .forEach(finish);
    }

    function revealTarget(target: Element) {
      for (const node of [...heroes, ...sections]) {
        if (node.contains(target) || target.contains(node)) finish(node);
      }
    }

    function anchor() {
      if (!window.location.hash) return;
      try {
        const target = document.getElementById(
          decodeURIComponent(window.location.hash.slice(1)),
        );
        if (target && root!.contains(target)) revealTarget(target);
      } catch {
        // An unrelated or malformed hash never affects reading visibility.
      }
    }

    function setup() {
      observer?.disconnect();
      observer = null;
      if (!motion.matches || typeof IntersectionObserver === "undefined") {
        finishAll();
        return;
      }
      try {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const node = entry.target as HTMLElement;
              if (
                entry.isIntersecting &&
                node.dataset.aboutRevealState === "pending"
              ) {
                node.dataset.aboutRevealState = "entering";
                observer?.unobserve(node);
              }
            }
          },
          { threshold: 0, rootMargin: "0px 0px -24px 0px" },
        );
        // Batch setup measurements before writes. Never re-hide content that
        // was already visible when hydration or history restoration completed.
        const positions = sections.map((node) => ({
          node,
          top: node.getBoundingClientRect().top,
        }));
        for (const { node, top } of positions) {
          if (
            node.dataset.aboutRevealState === "complete" ||
            top < window.innerHeight ||
            node.contains(document.activeElement)
          ) {
            finish(node);
          } else {
            node.dataset.aboutRevealState = "pending";
            observer.observe(node);
          }
        }
        anchor();
      } catch {
        // Progressive enhancement must never leave content hidden on failure.
        finishAll();
      }
    }

    function animationEnd(event: AnimationEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      const node = event.target;
      if (
        node.hasAttribute("data-about-enter") ||
        node.dataset.aboutRevealState === "entering" ||
        node.hasAttribute("data-about-image-arriving")
      )
        finish(node);
    }

    function focus(event: FocusEvent) {
      if (event.target instanceof Element) revealTarget(event.target);
    }

    function imageLoad(event: Event) {
      const image = event.target;
      if (
        motion.matches &&
        image instanceof HTMLImageElement &&
        image.parentElement?.hasAttribute("data-about-mobile-visual") &&
        !image.closest('[data-about-reveal-state="pending"]')
      ) {
        // A slow photograph gets its own fade when pixels arrive. Other content
        // never waits on this image, on fonts, or on readiness elsewhere.
        image.setAttribute("data-about-image-arriving", "");
      }
    }

    function restoreVisible() {
      if (document.hidden || !motion.matches) return;
      const visible = sections.filter(
        (node) => node.getBoundingClientRect().top < window.innerHeight,
      );
      for (const node of [...heroes, ...visible]) finish(node);
      anchor();
    }

    function pageShow(event: PageTransitionEvent) {
      if (event.persisted) restoreVisible();
    }

    setup();
    // CSS can finish before a slow hydration attaches animationend. Release
    // those completed hero effects too; this timer never gates visible content.
    const heroSettled = window.setTimeout(() => heroes.forEach(finish), 1000);
    root.addEventListener("animationend", animationEnd);
    root.addEventListener("focusin", focus);
    root.addEventListener("load", imageLoad, true);
    motion.addEventListener("change", setup);
    window.addEventListener("hashchange", anchor);
    window.addEventListener("pageshow", pageShow);
    document.addEventListener("visibilitychange", restoreVisible);
    return () => {
      window.clearTimeout(heroSettled);
      observer?.disconnect();
      root.removeEventListener("animationend", animationEnd);
      root.removeEventListener("focusin", focus);
      root.removeEventListener("load", imageLoad, true);
      motion.removeEventListener("change", setup);
      window.removeEventListener("hashchange", anchor);
      window.removeEventListener("pageshow", pageShow);
      document.removeEventListener("visibilitychange", restoreVisible);
      for (const node of sections) {
        if (node.dataset.aboutRevealState !== "complete")
          node.removeAttribute("data-about-reveal-state");
      }
      root.querySelectorAll("[data-about-image-arriving]").forEach((node) => {
        node.removeAttribute("data-about-image-arriving");
      });
    };
  }, [rootRef]);
}
