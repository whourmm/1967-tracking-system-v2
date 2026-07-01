import { useCallback, useEffect, useState } from "react";

export type FellowTheme = "light" | "dark";

const STORAGE_KEY = "fellow-theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function isFellowTheme(value: string | null): value is FellowTheme {
  return value === "light" || value === "dark";
}

function storedTheme(): FellowTheme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return isFellowTheme(value) ? value : null;
}

function systemTheme(): FellowTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

export function useFellowTheme() {
  const initialStoredTheme = storedTheme();
  const [theme, setTheme] = useState<FellowTheme>(
    () => initialStoredTheme ?? systemTheme()
  );
  const [followsSystem, setFollowsSystem] = useState(
    () => initialStoredTheme === null
  );

  useEffect(() => {
    if (!followsSystem) return;

    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [followsSystem]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;

      if (isFellowTheme(event.newValue)) {
        setFollowsSystem(false);
        setTheme(event.newValue);
        return;
      }

      setFollowsSystem(true);
      setTheme(systemTheme());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
    setFollowsSystem(false);
  }, []);

  return { theme, toggleTheme };
}
