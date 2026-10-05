"use client";

import { useEffect, useState } from "react";

/** Re-resolve hovered display text, with a quiet gap between each short pulse. */
export function usePeriodicGlitch(active: boolean) {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!active) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 760px)");
    let timer: ReturnType<typeof setInterval> | undefined;

    function synchronize() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
      if (preference.matches || document.hidden) return;
      timer = setInterval(
        () => setCycle((previous) => previous + 1),
        mobile.matches ? 5600 : 2800,
      );
    }

    synchronize();
    preference.addEventListener("change", synchronize);
    mobile.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    return () => {
      if (timer !== undefined) clearInterval(timer);
      preference.removeEventListener("change", synchronize);
      mobile.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [active]);

  return cycle;
}
