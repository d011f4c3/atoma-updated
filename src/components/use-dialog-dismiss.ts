"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

function outsideDialog(event: MouseEvent<HTMLDialogElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
}

/** Dismiss a deliberate backdrop click/tap, never a drag from the content. */
export function useDialogDismiss(onDismiss?: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      start.current =
        event.isPrimary && event.button === 0 && outsideDialog(event)
          ? { x: event.clientX, y: event.clientY }
          : null;
    },
    onPointerCancel() {
      start.current = null;
    },
    onClick(event: MouseEvent<HTMLDialogElement>) {
      const origin = start.current;
      start.current = null;
      if (
        event.target !== event.currentTarget ||
        !origin ||
        !outsideDialog(event) ||
        Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8
      )
        return;
      if (onDismiss) onDismiss();
      else event.currentTarget.close();
    },
  };
}

/** Preserve the page position while dialog content scrolls independently. */
export function useDialogScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = root.style.overflow;
    const bodyOverflow = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      root.style.overflow = rootOverflow;
      body.style.overflow = bodyOverflow;
    };
  }, [open]);
}
