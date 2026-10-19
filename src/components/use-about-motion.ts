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
    const phone = window.matchMedia("(max-width: 760px)");
    const visuals = Array.from(
      root.querySelectorAll<HTMLElement>("[data-about-mobile-visual]"),
      (node) => ({ node, top: 0, height: 0, value: 1, active: false }),
    );
    const readingProgress = root.querySelector<HTMLElement>(
      "[data-about-reading-progress]",
    );
    const cover = root.querySelector<HTMLElement>("[data-about-cover]");
    const approach = root.querySelector<HTMLElement>("[data-about-approach]");
    const steps = Array.from(
      root.querySelectorAll<HTMLElement>("[data-approach-step]"),
    );
    const connections = root.querySelector<HTMLElement>(
      "[data-about-connections]",
    );
    const connectionStage = root.querySelector<HTMLElement>(
      "[data-about-connections-stage]",
    );
    const rail = root.querySelector<HTMLElement>("[data-about-field-rail]");
    const track = root.querySelector<HTMLElement>("[data-about-field-track]");
    const viewport = root.querySelector<HTMLElement>(
      "[data-about-field-viewport]",
    );
    const counter = root.querySelector<HTMLElement>(
      "[data-about-rail-current]",
    );
    const written = new WeakMap<HTMLElement, Map<string, string>>();
    let frame = 0;
    let mode = "";
    let geometryDirty = true;
    let snapMobile = true;
    let lastFrame = 0;
    let connectionValue = 1;
    let metrics = {
      height: 1,
      maxScroll: 1,
      first: 0,
      last: 1,
      connectionTop: 0,
      connectionHeight: 1,
    };
    const clamp = (value: number) => Math.max(0, Math.min(1, value));

    function set(
      node: HTMLElement | null,
      name: string,
      value: number,
      unit = "",
    ) {
      if (!node) return;
      const next = `${value.toFixed(4)}${unit}`;
      let values = written.get(node);
      if (!values) written.set(node, (values = new Map()));
      if (values.get(name) === next) return;
      values.set(name, next);
      node.style.setProperty(name, next);
    }

    function stepAt(progress: number) {
      const step =
        steps[Math.round(progress * (steps.length - 1))]?.dataset.approachStep;
      if (approach && step && approach.dataset.step !== step)
        approach.dataset.step = step;
    }

    // Phone frames are in normal document flow. Measure only when their layout
    // changes; a swipe needs scrollY and arithmetic, not nine forced style reads.
    function measureMobile(y: number) {
      const height = innerHeight;
      for (const visual of visuals) {
        const box = visual.node.getBoundingClientRect();
        visual.top = box.top + y;
        visual.height = box.height;
      }
      const first = steps[0]?.getBoundingClientRect();
      const last = steps.at(-1)?.getBoundingClientRect();
      const connection = (
        connectionStage ?? connections
      )?.getBoundingClientRect();
      metrics = {
        height,
        maxScroll: Math.max(1, document.documentElement.scrollHeight - height),
        first: first ? first.top + y + first.height * 0.5 : 0,
        last: last ? last.top + y + last.height * 0.5 : 1,
        connectionTop: connection ? connection.top + y : 0,
        connectionHeight: connection?.height ?? 1,
      };
      geometryDirty = false;
    }

    function updateMobile(now: number, animate: boolean) {
      const y = scrollY;
      if (geometryDirty) measureMobile(y);
      const {
        height,
        maxScroll,
        first,
        last,
        connectionTop,
        connectionHeight,
      } = metrics;
      const elapsed = lastFrame ? Math.min(now - lastFrame, 64) : 1000 / 60;
      const response = 1 - Math.exp(-elapsed / 110);
      let settling = false;
      const nearby = (top: number, size: number) =>
        top < height * 1.2 && top + size > -height * 0.2;
      function ease(current: number, target: number, active: boolean) {
        if (
          !animate ||
          snapMobile ||
          !active ||
          Math.abs(target - current) < 0.0005
        )
          return target;
        const next = current + (target - current) * response;
        settling = true;
        return next;
      }
      // All geometry reads precede this write phase. Scope progress to the bar,
      // rather than invalidating inherited styles throughout the entire page.
      set(readingProgress, "--about-progress", clamp(y / maxScroll));
      stepAt(clamp((y + height * 0.5 - first) / Math.max(1, last - first)));
      if (animate) {
        for (const visual of visuals) {
          const top = visual.top - y;
          const active = nearby(top, visual.height);
          if (visual.active !== active) {
            visual.active = active;
            visual.node.toggleAttribute("data-about-image-active", active);
          }
          const target = clamp((height * 0.95 - top) / (height * 0.8));
          visual.value = ease(visual.value, target, active);
          set(visual.node, "--about-image-progress", visual.value);
        }
        const target = clamp(
          (height * 0.8 - (connectionTop - y)) /
            Math.max(1, connectionHeight * 0.65),
        );
        connectionValue = ease(
          connectionValue,
          target,
          nearby(connectionTop - y, connectionHeight),
        );
        set(connections, "--connections-progress", connectionValue);
      }
      snapMobile = false;
      lastFrame = settling ? now : 0;
      if (settling) schedule();
    }

    function updateDesktop() {
      // Retain the established desktop choreography, with one read phase before
      // any progress writes. Its sticky stages need their current viewport boxes.
      const height = innerHeight;
      const y = scrollY;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - height,
      );
      const coverBox = cover?.getBoundingClientRect();
      const first = steps[0]?.getBoundingClientRect();
      const last = steps.at(-1)?.getBoundingClientRect();
      const connectionBox = connections?.getBoundingClientRect();
      const railBox = rail?.getBoundingClientRect();
      const style = viewport ? getComputedStyle(viewport) : null;
      const available =
        viewport && style
          ? viewport.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight)
          : 0;
      const distance = track ? Math.max(0, track.scrollWidth - available) : 0;
      const progress =
        first && last
          ? clamp(
              (height * 0.5 - first.top - first.height * 0.5) /
                Math.max(
                  1,
                  last.top + last.height * 0.5 - first.top - first.height * 0.5,
                ),
            )
          : 0;
      const field = railBox
        ? clamp(-railBox.top / Math.max(1, railBox.height - height))
        : 0;
      set(readingProgress, "--about-progress", clamp(y / maxScroll));
      set(
        cover,
        "--cover-progress",
        coverBox ? clamp(-coverBox.top / (height * 0.75)) : 0,
      );
      set(approach, "--approach-progress", progress);
      stepAt(progress);
      set(
        connections,
        "--connections-progress",
        connectionBox
          ? clamp(
              (height * 0.8 - connectionBox.top) /
                Math.max(1, connectionBox.height * 0.65),
            )
          : 1,
      );
      set(rail, "--field-progress", field);
      set(rail, "--field-offset", distance * field, "px");
      const label = field >= 0.5 ? "02" : "01";
      if (counter && counter.textContent !== label) counter.textContent = label;
    }

    function update(now: number) {
      frame = 0;
      if (!root || document.hidden) return;
      const nextMode = preference.matches
        ? "reduced"
        : roomy.matches
          ? "ready"
          : phone.matches
            ? "mobile"
            : "reduced";
      if (mode !== nextMode) {
        mode = nextMode;
        root.dataset.aboutMotion = mode;
        geometryDirty = true;
        snapMobile = true;
        lastFrame = 0;
        connectionValue = 1;
        for (const visual of visuals) {
          visual.value = 1;
          if (visual.active)
            visual.node.removeAttribute("data-about-image-active");
          visual.active = false;
          set(visual.node, "--about-image-progress", 1);
        }
        if (mode !== "ready") {
          set(cover, "--cover-progress", 0);
          set(approach, "--approach-progress", 1);
          set(rail, "--field-progress", 0);
          set(rail, "--field-offset", 0, "px");
          set(connections, "--connections-progress", 1);
          if (counter && counter.textContent !== "01")
            counter.textContent = "01";
        }
        // Mode changes alter responsive layout. Measure it on the next frame,
        // never immediately after those style and attribute writes.
        schedule();
        return;
      }
      if (mode === "ready") updateDesktop();
      else updateMobile(now, mode === "mobile");
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function invalidateGeometry() {
      geometryDirty = true;
      schedule();
    }
    function visibilityChanged() {
      lastFrame = 0;
      snapMobile = true;
      invalidateGeometry();
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
    window.addEventListener("resize", invalidateGeometry);
    document.addEventListener("visibilitychange", visibilityChanged);
    preference.addEventListener("change", invalidateGeometry);
    roomy.addEventListener("change", invalidateGeometry);
    phone.addEventListener("change", invalidateGeometry);
    root.addEventListener("focusin", revealFocusedStory);
    const resize = new ResizeObserver(invalidateGeometry);
    resize.observe(root);
    for (const visual of visuals) resize.observe(visual.node);
    if (track) resize.observe(track);
    if (rail) resize.observe(rail);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidateGeometry);
      document.removeEventListener("visibilitychange", visibilityChanged);
      preference.removeEventListener("change", invalidateGeometry);
      roomy.removeEventListener("change", invalidateGeometry);
      phone.removeEventListener("change", invalidateGeometry);
      root.removeEventListener("focusin", revealFocusedStory);
      for (const visual of visuals)
        visual.node.removeAttribute("data-about-image-active");
    };
  }, [rootRef]);
}
