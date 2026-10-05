"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Tone = "light" | "dark";
type StorefrontTheme = { tone: Tone; setTone: (tone: Tone) => void };

const ThemeContext = createContext<StorefrontTheme | null>(null);

export function StorefrontThemeProvider({
  initialTone,
  children,
}: {
  initialTone: Tone;
  children: ReactNode;
}) {
  const [tone, updateTone] = useState(initialTone);
  const setTone = useCallback((next: Tone) => {
    updateTone(next);
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `atoma-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
      // Appearance still works for this visit if preference storage is blocked.
    }
  }, []);
  const value = useMemo(() => ({ tone, setTone }), [tone, setTone]);

  // Only regular storefront roots opt into this palette. Saved studies retain
  // their own controls and do not write the visitor's persistent preference.
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useStorefrontTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("StorefrontThemeProvider is required.");
  return theme;
}
