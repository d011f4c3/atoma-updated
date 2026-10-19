"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  parseSavedMatcha,
  SAVED_MATCHA_STORAGE_KEY,
  serializeSavedMatcha,
} from "@/lib/sample-journey";

const changeEvent = "atoma-saved-matcha-change";
const storageUnavailable = "!storage-unavailable";
const serverSnapshot = () => null;
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

type SavedMatchaError = "storage-unavailable" | "invalid-product" | null;

function readSnapshot(): string | null {
  try {
    return (
      parseSavedMatcha(window.localStorage.getItem(SAVED_MATCHA_STORAGE_KEY))
        ?.productHandle ?? null
    );
  } catch {
    return storageUnavailable;
  }
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === SAVED_MATCHA_STORAGE_KEY)
      onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

/** Nothing is persisted until the visitor explicitly saves or clears a choice. */
export function useSavedMatcha() {
  const snapshot = useSyncExternalStore(
    subscribe,
    readSnapshot,
    serverSnapshot,
  );
  const ready = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverReady,
  );
  const [actionError, setActionError] = useState<SavedMatchaError>(null);

  const saveMatcha = useCallback((productHandle: string): boolean => {
    const value = serializeSavedMatcha(productHandle);
    if (value === null) {
      setActionError("invalid-product");
      return false;
    }
    try {
      window.localStorage.setItem(SAVED_MATCHA_STORAGE_KEY, value);
      if (window.localStorage.getItem(SAVED_MATCHA_STORAGE_KEY) !== value)
        throw new Error("Saved choice could not be verified.");
      setActionError(null);
      window.dispatchEvent(new Event(changeEvent));
      return true;
    } catch {
      setActionError("storage-unavailable");
      return false;
    }
  }, []);

  const clearMatcha = useCallback((): boolean => {
    try {
      window.localStorage.removeItem(SAVED_MATCHA_STORAGE_KEY);
      if (window.localStorage.getItem(SAVED_MATCHA_STORAGE_KEY) !== null)
        throw new Error("Cleared choice could not be verified.");
      setActionError(null);
      window.dispatchEvent(new Event(changeEvent));
      return true;
    } catch {
      setActionError("storage-unavailable");
      return false;
    }
  }, []);

  return {
    productHandle: snapshot === storageUnavailable ? null : snapshot,
    ready,
    saveMatcha,
    clearMatcha,
    error:
      snapshot === storageUnavailable
        ? ("storage-unavailable" as const)
        : actionError,
  };
}
