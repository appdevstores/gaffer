import React, { createContext, useContext, useMemo, useState } from "react";

export type MatchThemeName = "professional" | "playful";

export interface MatchTheme {
  name: MatchThemeName;
  root: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentStrong: string;
  pitchBorder: string;
  pitchBackground: string;
  tokenRing: string;
  benchSurface: string;
}

export const MATCH_THEMES: Record<MatchThemeName, MatchTheme> = {
  professional: {
    name: "professional",
    root: "#020617",
    surface: "#0f172a",
    surfaceAlt: "#1e293b",
    border: "#334155",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#2563eb",
    accentStrong: "#16a34a",
    pitchBorder: "#14532d",
    pitchBackground: "#052e16",
    tokenRing: "#facc15",
    benchSurface: "rgba(15,23,42,0.92)",
  },
  playful: {
    name: "playful",
    root: "#172554",
    surface: "#312e81",
    surfaceAlt: "#4338ca",
    border: "#818cf8",
    text: "#fff7ed",
    muted: "#c4b5fd",
    accent: "#f97316",
    accentStrong: "#84cc16",
    pitchBorder: "#a3e635",
    pitchBackground: "#14532d",
    tokenRing: "#fef08a",
    benchSurface: "rgba(49,46,129,0.94)",
  },
};

const MatchThemeContext = createContext<{
  theme: MatchTheme;
  toggleTheme: () => void;
} | null>(null);

export function MatchThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<MatchThemeName>("professional");
  const value = useMemo(
    () => ({
      theme: MATCH_THEMES[name],
      toggleTheme: () => setName((current) => (current === "professional" ? "playful" : "professional")),
    }),
    [name],
  );
  return <MatchThemeContext.Provider value={value}>{children}</MatchThemeContext.Provider>;
}

export function useMatchTheme() {
  const context = useContext(MatchThemeContext);
  if (!context) throw new Error("useMatchTheme must be used inside MatchThemeProvider");
  return context;
}
