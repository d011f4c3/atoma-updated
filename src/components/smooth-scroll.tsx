"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { observeScrollLock } from "@/lib/scroll-lock";

function nativeScrollTo(top: number) {
  window.scrollTo({
    top,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

const PageScrollContext = createContext(nativeScrollTo);

// The study uses its existing preview pane; the storefront uses the document.
export function useSmoothScroll(wrapperRef?: RefObject<HTMLElement | null>) {
  const instance = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const wrapper = wrapperRef?.current;
    if (wrapperRef && !wrapper) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose = () => {};

    function syncMotion() {
      dispose();
      dispose = () => {};
      instance.current = null;
      // Leave scrolling completely native when reduced motion is requested.
      if (motion.matches) return;

      const lenis = new Lenis({
        ...(wrapper
          ? { wrapper, content: wrapper.firstElementChild as HTMLElement }
          : {}),
        autoRaf: true,
        lerp: 0.18,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
        anchors: true,
        stopInertiaOnNavigate: true,
        prevent: (node) => node.tagName === "DIALOG",
      });
      instance.current = lenis;
      const disconnectLock = observeScrollLock(lenis, document.body);
      const inputTarget = wrapper ?? window;
      // Yield before native focus/scroll restoration and in-place navigation.
      function cancelInertia() {
        if (lenis.isScrolling === "smooth") {
          lenis.scrollTo(lenis.actualScroll, { immediate: true });
        }
      }
      inputTarget.addEventListener("pointerdown", cancelInertia, true);
      inputTarget.addEventListener("click", cancelInertia, true);
      inputTarget.addEventListener("keydown", cancelInertia, true);
      dispose = () => {
        inputTarget.removeEventListener("pointerdown", cancelInertia, true);
        inputTarget.removeEventListener("click", cancelInertia, true);
        inputTarget.removeEventListener("keydown", cancelInertia, true);
        disconnectLock();
        lenis.destroy();
      };
    }

    syncMotion();
    motion.addEventListener("change", syncMotion);
    return () => {
      motion.removeEventListener("change", syncMotion);
      dispose();
      instance.current = null;
    };
  }, [pathname, wrapperRef]);

  return instance;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const instance = useSmoothScroll();
  function scrollTo(top: number) {
    if (instance.current) instance.current.scrollTo(top);
    else nativeScrollTo(top);
  }

  return (
    <PageScrollContext.Provider value={scrollTo}>
      {children}
    </PageScrollContext.Provider>
  );
}

export function usePageScroll() {
  return useContext(PageScrollContext);
}
