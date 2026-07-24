import { useCallback, useEffect, useState } from "react";

export type FellowTheme = "light" | "dark";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: string | null): value is FellowTheme {
  return value === "light" || value === "dark";
}

function readStored(key: string): FellowTheme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  return isTheme(value) ? value : null;
}

function systemTheme(): FellowTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

function makeThemeHook(storageKey: string) {
  return function useTheme() {
    const [theme, setTheme] = useState<FellowTheme>(
      () => readStored(storageKey) ?? systemTheme()
    );
    const [followsSystem, setFollowsSystem] = useState(
      () => readStored(storageKey) === null
    );

    useEffect(() => {
      if (!followsSystem) return;
      const media = window.matchMedia(DARK_MEDIA_QUERY);
      const handle = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
      media.addEventListener("change", handle);
      return () => media.removeEventListener("change", handle);
    }, [followsSystem]);

    useEffect(() => {
      const handle = (e: StorageEvent) => {
        if (e.key !== storageKey) return;
        if (isTheme(e.newValue)) { setFollowsSystem(false); setTheme(e.newValue); }
        else { setFollowsSystem(true); setTheme(systemTheme()); }
      };
      window.addEventListener("storage", handle);
      return () => window.removeEventListener("storage", handle);
    }, []);

    const toggleTheme = useCallback(() => {
      setTheme((current) => {
        const next = current === "dark" ? "light" : "dark";
        window.localStorage.setItem(storageKey, next);
        return next;
      });
      setFollowsSystem(false);
    }, []);

    return { theme, toggleTheme };
  };
}

export const useFellowTheme = makeThemeHook("fellow-theme");
export const useAdminTheme = makeThemeHook("admin-theme");
