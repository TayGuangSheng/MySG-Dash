"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { DEFAULT_THEME_ID, THEMES, type ThemeDefinition, getThemeById } from "@/lib/themes";
import { useLocalStorage } from "@/hooks/use-local-storage";

const THEME_STORAGE_KEY = "doorboard.themeId";

type ThemeContextValue = {
  availableThemes: readonly ThemeDefinition[];
  theme: ThemeDefinition;
  themeId: string;
  setThemeId: (nextId: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeVariables(theme: ThemeDefinition) {
  if (typeof document === "undefined") return;

  const shell = document.getElementById("app-shell") ?? document.documentElement;
  const mappings: Record<string, string> = {
    "--theme-background": theme.background,
    "--theme-foreground": theme.foreground,
    "--card-bg": theme.cardBackground,
    "--card-border": theme.cardBorder,
    "--accent-color": theme.accent,
    "--accent-muted": theme.accentMuted,
    "--highlight-color": theme.highlight,
  };

  Object.entries(mappings).forEach(([token, value]) => {
    shell.style.setProperty(token, value);
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useLocalStorage<string>(THEME_STORAGE_KEY, DEFAULT_THEME_ID);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  useEffect(() => {
    applyThemeVariables(theme);
    const root = document.documentElement;
    root.style.colorScheme = "dark";
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      availableThemes: THEMES,
      theme,
      themeId: theme.id,
      setThemeId,
    }),
    [theme, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
