"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { productName } from "@/lib/product-name";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { OriginsContent } from "./origins-content";
import { useCart } from "./cart-drawer";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import styles from "./origins-provider.module.css";

type Opening = {
  tone: "dark" | "light";
  entry?: string;
  placeId?: string;
  returnLabel?: string;
  returnProduct?: { title: string; handle?: string };
};
type OriginsContextValue = {
  openOrigins: (opening: Opening) => void;
  setSelectedMatcha: (name: string | null, handle?: string) => void;
};

const OriginsContext = createContext<OriginsContextValue | null>(null);

export function useOrigins() {
  const context = useContext(OriginsContext);
  if (!context) throw new Error("OriginsProvider is required.");
  return context;
}

export function OriginsProvider({ children }: { children: ReactNode }) {
  const { locale, t } = useStorefrontLocale();
  const pathname = usePathname();
  const { tone: storefrontTone } = useStorefrontTheme();
  const { busy } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const selectedMatcha = useRef<Opening["returnProduct"] | null>(null);
  const historyEntry = useRef(false);
  const previousURL = useRef("");
  const [opening, setOpening] = useState<Opening | null>(null);
  const regularStorefront =
    pathname === "/" ||
    pathname === "/origins" ||
    /^\/shop(?:\/[^/]+)?$/.test(pathname);
  // History restores the reader's place; appearance remains the current choice.
  // Saved concepts and studies retain the tone supplied when opening the reader.
  const tone = regularStorefront ? storefrontTone : (opening?.tone ?? "dark");
  const setSelectedMatcha = useCallback(
    (name: string | null, handle?: string) => {
      selectedMatcha.current = name === null ? null : { title: name, handle };
    },
    [],
  );

  const openOrigins = useCallback(
    (next: Opening) => {
      if (busy || document.querySelector("dialog[open]")) return;
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      previousURL.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const value = {
        ...next,
        returnProduct:
          next.returnProduct ??
          (next.returnLabel
            ? undefined
            : (selectedMatcha.current ?? undefined)),
        returnLabel: next.returnLabel ?? "Return to matcha",
      };
      // Let Next attach its routing metadata and synchronize the canonical URL.
      window.history.pushState({ atomaOrigins: value }, "", "#origins");
      historyEntry.current = true;
      setOpening(value);
    },
    [busy],
  );

  const closeOrigins = useCallback(() => {
    dialog.current?.close();
    if (historyEntry.current && window.location.hash === "#origins") {
      historyEntry.current = false;
      window.history.back();
    }
  }, []);

  const dismissOrigins = useDialogDismiss(closeOrigins);
  useDialogScrollLock(Boolean(opening));

  useEffect(() => {
    if (!opening) return;
    const node = dialog.current;
    if (!node) return;
    node.showModal();
    node.scrollTop = 0;
  }, [opening]);

  useEffect(() => {
    const traverse = (event: PopStateEvent) => {
      const saved = event.state?.atomaOrigins as Opening | undefined;
      if (
        window.location.hash === "#origins" &&
        saved &&
        (saved.tone === "light" || saved.tone === "dark")
      ) {
        const openDialog = document.querySelector("dialog[open]");
        if (busy || (openDialog && openDialog !== dialog.current)) {
          // A history traversal must respect the same purchase/modal boundary
          // as the navigation entrance. Return to the still-active experience.
          historyEntry.current = false;
          window.history.back();
          return;
        }
        historyEntry.current = true;
        setOpening(saved);
      } else {
        historyEntry.current = false;
        dialog.current?.close();
      }
    };
    window.addEventListener("popstate", traverse);
    return () => window.removeEventListener("popstate", traverse);
  }, [busy]);

  // A genuine route navigation from a reader link also dismisses its top layer.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  const context = useMemo(
    () => ({ openOrigins, setSelectedMatcha }),
    [openOrigins, setSelectedMatcha],
  );
  return (
    <OriginsContext.Provider value={context}>
      {children}
      <dialog
        {...dismissOrigins}
        ref={dialog}
        className={styles.dialog}
        data-origins-dialog
        data-tone={tone}
        aria-label={t("ATOMA Origins")}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
            ),
          ).filter((element) => element.getClientRects().length);
          const first = controls[0];
          const last = controls.at(-1);
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              !controls.includes(document.activeElement as HTMLElement))
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          closeOrigins();
        }}
        onClose={() => {
          setOpening(null);
          const previous = trigger.current;
          const target =
            previous?.isConnected && previous.getClientRects().length
              ? previous
              : document.querySelector<HTMLElement>("[data-nav-summary]");
          if (target?.getClientRects().length)
            target.focus({ preventScroll: true });
        }}
        onClickCapture={(event) => {
          const link = (event.target as Element).closest("a[href]");
          if (
            !link ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          if (historyEntry.current) {
            window.history.replaceState(null, "", previousURL.current);
          }
          historyEntry.current = false;
          dialog.current?.close();
        }}
      >
        {opening && (
          <OriginsContent
            tone={tone}
            initialEntry={opening.entry}
            initialPlace={opening.placeId}
            onReturn={closeOrigins}
            returnLabel={
              opening.returnProduct
                ? t("Return to {product}", {
                    product: productName(
                      opening.returnProduct.title,
                      opening.returnProduct.handle,
                      locale,
                    ),
                  })
                : t(opening.returnLabel ?? "Return to matcha")
            }
          />
        )}
      </dialog>
    </OriginsContext.Provider>
  );
}
