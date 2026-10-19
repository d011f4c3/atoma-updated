"use client";

import { useEffect } from "react";

/** Keep automatic dialog/return focus without giving pointer users a ring. */
export function FocusModality() {
  useEffect(() => {
    const root = document.documentElement;

    function pointerInput() {
      root.dataset.inputModality = "pointer";
    }

    function keyboardInput(event: KeyboardEvent) {
      if (
        event.isComposing ||
        ["Shift", "Control", "Alt", "Meta"].includes(event.key)
      )
        return;
      root.dataset.inputModality = "keyboard";
    }

    // Capture the initiating interaction before a component moves focus.
    // Leave the browser's default intact until an input method is known.
    document.addEventListener("pointerdown", pointerInput, true);
    document.addEventListener("keydown", keyboardInput, true);
    return () => {
      document.removeEventListener("pointerdown", pointerInput, true);
      document.removeEventListener("keydown", keyboardInput, true);
      delete root.dataset.inputModality;
    };
  }, []);

  return null;
}
