"use client";

import { useEffect, type RefObject } from "react";
import { usePathname } from "next/navigation";
import {
  motionControlSelector,
  permitsPageReveal,
} from "@/lib/canonical-motion-policy";

/** One-shot entrances; existing product and scroll-linked photo motion stay independent. */
export function usePageReveals(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const pathname = usePathname();
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    root.setAttribute("data-page-reveal-root", "");
    const owns = (node: Element) =>
      node.closest("[data-page-reveal-root]") === root;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const heroes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-page-enter]"),
    ).filter(owns);
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-page-reveal]"),
    ).filter(owns);
    let observer: IntersectionObserver | null = null;
    let restorationFrame = 0;

    function permitsGroup(node: HTMLElement) {
      return permitsPageReveal(pathname, {
        visualTreatment: node.matches(
          '[data-page-enter="visual"], [data-page-reveal="fade"]',
        ),
        hasMedia: Boolean(node.querySelector("img, video, canvas, svg")),
        hasText: Boolean(node.textContent?.trim()),
        hasControl: Boolean(
          node.closest(motionControlSelector) ||
          node.querySelector(motionControlSelector),
        ),
      });
    }

    function finish(node: HTMLElement) {
      if (node.hasAttribute("data-page-enter"))
        node.setAttribute("data-page-enter-done", "");
      if (node.hasAttribute("data-page-reveal")) {
        node.dataset.pageRevealState = "complete";
        observer?.unobserve(node);
      }
      node.removeAttribute("data-page-image-arriving");
    }

    function finishAll() {
      observer?.disconnect();
      observer = null;
      for (const node of [...heroes, ...sections]) finish(node);
      root!
        .querySelectorAll<HTMLElement>("[data-page-image-arriving]")
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
      for (const node of [...heroes, ...sections]) {
        if (!permitsGroup(node)) finish(node);
      }
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
                node.dataset.pageRevealState === "pending"
              ) {
                if (!permitsGroup(node)) {
                  finish(node);
                  continue;
                }
                node.dataset.pageRevealState = "entering";
                observer?.unobserve(node);
              }
            }
          },
          { threshold: 0, rootMargin: "0px 0px -24px 0px" },
        );
        // Batch measurements before writes. Never re-hide visible reading content.
        // Pre-mounted, inert product panels get their own setup when activated.
        const positions = sections
          .filter(
            (node) =>
              permitsGroup(node) &&
              node.getClientRects().length &&
              !node.closest("[hidden], [inert]"),
          )
          .map((node) => ({ node, top: node.getBoundingClientRect().top }));
        for (const { node, top } of positions) {
          if (
            node.dataset.pageRevealState === "complete" ||
            top < window.innerHeight ||
            node.contains(document.activeElement)
          ) {
            finish(node);
          } else {
            node.dataset.pageRevealState = "pending";
            observer.observe(node);
          }
        }
        anchor();
      } catch {
        // An unavailable observer must never strand invisible content.
        finishAll();
      }
    }

    function animationEnd(event: AnimationEvent) {
      if (!(event.target instanceof HTMLElement) || !owns(event.target)) return;
      const node = event.target;
      if (
        node.hasAttribute("data-page-enter") ||
        node.dataset.pageRevealState === "entering" ||
        node.hasAttribute("data-page-image-arriving")
      )
        finish(node);
    }

    function focus(event: FocusEvent) {
      if (event.target instanceof Element) revealTarget(event.target);
    }

    function imageLoad(event: Event) {
      const image = event.target;
      if (
        !motion.matches ||
        !(image instanceof HTMLImageElement) ||
        !owns(image)
      )
        return;
      const group = image.closest<HTMLElement>(
        '[data-page-enter="visual"], [data-page-reveal="fade"]',
      );
      if (
        group &&
        permitsGroup(group) &&
        !group.closest('[data-page-reveal-state="pending"]') &&
        (group.hasAttribute("data-page-enter-done") ||
          group.dataset.pageRevealState === "complete")
      ) {
        // A late photograph fades when its own pixels arrive. Text, controls and
        // other groups never wait for it, fonts, or readiness on another page.
        image.setAttribute("data-page-image-arriving", "");
      }
    }

    function restoreVisible() {
      cancelAnimationFrame(restorationFrame);
      restorationFrame = requestAnimationFrame(() => {
        if (document.hidden || !motion.matches) return;
        const visible = sections.filter(
          (node) =>
            node.getClientRects().length &&
            node.getBoundingClientRect().top < window.innerHeight,
        );
        for (const node of [...heroes, ...visible]) finish(node);
        anchor();
      });
    }

    function pageShow(event: PageTransitionEvent) {
      if (event.persisted) restoreVisible();
    }

    setup();
    // CSS may finish before hydration attaches animationend. Release its fill
    // without cancelling an entrance still running or paused behind the hero loader.
    const heroSettled = window.setTimeout(() => {
      for (const node of heroes) {
        const active = node
          .getAnimations?.()
          .some(
            (animation) =>
              animation.pending ||
              animation.playState === "running" ||
              animation.playState === "paused",
          );
        if (!active) finish(node);
      }
    }, 1800);
    root.addEventListener("animationend", animationEnd);
    root.addEventListener("focusin", focus);
    root.addEventListener("load", imageLoad, true);
    motion.addEventListener("change", setup);
    window.addEventListener("hashchange", anchor);
    window.addEventListener("pageshow", pageShow);
    window.addEventListener("popstate", restoreVisible);
    document.addEventListener("visibilitychange", restoreVisible);
    return () => {
      window.clearTimeout(heroSettled);
      cancelAnimationFrame(restorationFrame);
      observer?.disconnect();
      root.removeEventListener("animationend", animationEnd);
      root.removeEventListener("focusin", focus);
      root.removeEventListener("load", imageLoad, true);
      motion.removeEventListener("change", setup);
      window.removeEventListener("hashchange", anchor);
      window.removeEventListener("pageshow", pageShow);
      window.removeEventListener("popstate", restoreVisible);
      document.removeEventListener("visibilitychange", restoreVisible);
      for (const node of sections) {
        if (node.dataset.pageRevealState !== "complete")
          node.removeAttribute("data-page-reveal-state");
      }
      root.querySelectorAll("[data-page-image-arriving]").forEach((node) => {
        node.removeAttribute("data-page-image-arriving");
      });
      root.removeAttribute("data-page-reveal-root");
    };
  }, [rootRef, enabled, pathname]);
}
