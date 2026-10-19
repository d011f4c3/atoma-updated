"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { ProductKey } from "@/lib/product-codes";
import {
  isSampleTastingKey,
  parseSampleTastings,
  SAMPLE_TASTINGS_STORAGE_KEY,
  serializeSampleTastings,
  type TastingRecord,
} from "@/lib/sample-tastings";

const changeEvent = "atoma-sample-tastings-change";
const storageUnavailable = Symbol("storage-unavailable");
const serverSnapshot = () => null;
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function readSnapshot(): string | null | typeof storageUnavailable {
  try {
    return window.localStorage.getItem(SAMPLE_TASTINGS_STORAGE_KEY);
  } catch {
    return storageUnavailable;
  }
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === SAMPLE_TASTINGS_STORAGE_KEY)
      onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

/** Reading and editing never persist. Only explicit save/clear actions write. */
export function useSampleTastings() {
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
  const records = useMemo(
    () =>
      parseSampleTastings(snapshot === storageUnavailable ? null : snapshot),
    [snapshot],
  );
  const [actionError, setActionError] = useState<"storage-unavailable" | null>(
    null,
  );

  const saveTasting = useCallback(
    (key: ProductKey, record: TastingRecord): boolean => {
      if (
        !isSampleTastingKey(key) ||
        serializeSampleTastings({ [key]: record }) === null
      )
        return false;
      try {
        const current = parseSampleTastings(
          window.localStorage.getItem(SAMPLE_TASTINGS_STORAGE_KEY),
        );
        const value = serializeSampleTastings({ ...current, [key]: record });
        if (value === null) return false;
        window.localStorage.setItem(SAMPLE_TASTINGS_STORAGE_KEY, value);
        if (window.localStorage.getItem(SAMPLE_TASTINGS_STORAGE_KEY) !== value)
          throw new Error("Saved tasting could not be verified.");
        setActionError(null);
        window.dispatchEvent(new Event(changeEvent));
        return true;
      } catch {
        setActionError("storage-unavailable");
        return false;
      }
    },
    [],
  );

  const clearTasting = useCallback((key: ProductKey): boolean => {
    if (!isSampleTastingKey(key)) return false;
    try {
      const records = parseSampleTastings(
        window.localStorage.getItem(SAMPLE_TASTINGS_STORAGE_KEY),
      );
      delete records[key];
      const value = Object.keys(records).length
        ? serializeSampleTastings(records)
        : null;
      if (value === null)
        window.localStorage.removeItem(SAMPLE_TASTINGS_STORAGE_KEY);
      else window.localStorage.setItem(SAMPLE_TASTINGS_STORAGE_KEY, value);
      if (window.localStorage.getItem(SAMPLE_TASTINGS_STORAGE_KEY) !== value)
        throw new Error("Cleared tasting could not be verified.");
      setActionError(null);
      window.dispatchEvent(new Event(changeEvent));
      return true;
    } catch {
      setActionError("storage-unavailable");
      return false;
    }
  }, []);

  return {
    records,
    ready,
    saveTasting,
    clearTasting,
    error:
      snapshot === storageUnavailable
        ? ("storage-unavailable" as const)
        : actionError,
  };
}
