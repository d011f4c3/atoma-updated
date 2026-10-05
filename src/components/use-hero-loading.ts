"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

type Phase = "loading" | "complete" | "leaving" | "done";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

/** A brief homepage entrance, gated by the visible hero rather than commerce. */
export function useHeroLoading(
  enabled: boolean,
  assetReady: boolean,
  hero: RefObject<HTMLElement | null>,
) {
  const [loadOnMount] = useState(enabled);
  const [phase, setPhase] = useState<Phase>(loadOnMount ? "loading" : "done");
  const [progress, setProgress] = useState(0);
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const asset = useRef(assetReady);
  useEffect(() => {
    asset.current = assetReady;
  }, [assetReady]);

  useEffect(() => {
    if (!loadOnMount) return;
    let disposed = false;
    let finished = false;
    let fontsReady = false;
    let frame = 0;
    let value = 0;
    let previous = performance.now();
    const started = previous;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function finish(ready: boolean) {
      if (finished || disposed) return;
      finished = true;
      cancelAnimationFrame(frame);
      if (ready) {
        setProgress(100);
        setPhase("complete");
      }
      const leave = () => {
        if (disposed) return;
        setPhase("leaving");
        timers.push(
          setTimeout(
            () => {
              if (!disposed) setPhase("done");
            },
            motion.matches ? 0 : 240,
          ),
        );
      };
      timers.push(setTimeout(leave, ready && !motion.matches ? 100 : 0));
    }

    const type = hero.current ? getComputedStyle(hero.current) : null;
    const mono = type?.fontFamily ?? "monospace";
    const sans =
      type?.getPropertyValue("--font-fraktion-sans").trim() || "sans-serif";
    try {
      void Promise.allSettled([
        document.fonts.load(`400 14px ${mono}`, "0123456789%"),
        document.fonts.load(`700 18px ${sans}`, "ATOMA"),
      ]).then(() => {
        if (!disposed) fontsReady = true;
      });
    } catch {
      fontsReady = true;
    }
    // Font-display fallback is usable even if a font request never settles.
    timers.push(
      setTimeout(() => {
        fontsReady = true;
      }, 1500),
    );
    // A broken or stalled asset must never trap the visitor behind the loader.
    timers.push(setTimeout(() => finish(false), 6000));

    function tick(now: number) {
      if (disposed || finished) return;
      const elapsed = now - started;
      if (asset.current && fontsReady && (motion.matches || elapsed >= 400)) {
        finish(true);
        return;
      }
      // Estimated preparation progress, never 100 until the hero is ready.
      const target = Math.min(
        94,
        12 +
          (fontsReady ? 24 : 0) +
          (asset.current ? 52 : 0) +
          (motion.matches ? 0 : 6 * (1 - Math.exp(-elapsed / 1400))),
      );
      value = motion.matches
        ? target
        : value +
          (target - value) *
            (1 - Math.exp(-Math.min(now - previous, 100) / 130));
      previous = now;
      setProgress(Math.floor(value));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [loadOnMount, hero]);

  return { phase, progress, blocking: hydrated && phase !== "done" };
}
