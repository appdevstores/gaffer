import React, { createContext, useContext, useMemo, useState } from "react";

export type MatchThemeName = "professional" | "anime";

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
  fieldTokenColor: string;
  benchTokenColor: string;
  tokenShape: "round" | "square";
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
    fieldTokenColor: "#2563eb",
    benchTokenColor: "#16a34a",
    tokenShape: "round",
    benchSurface: "rgba(15,23,42,0.92)",
  },
  anime: {
    name: "anime",
    root: "#0b1026",
    surface: "#20134f",
    surfaceAlt: "#312e81",
    border: "#a78bfa",
    text: "#fff7ed",
    muted: "#c4b5fd",
    accent: "#ec4899",
    accentStrong: "#a3e635",
    pitchBorder: "#22d3ee",
    pitchBackground: "#123b46",
    tokenRing: "#fef08a",
    fieldTokenColor: "#2563eb",
    benchTokenColor: "#16a34a",
    tokenShape: "square",
    benchSurface: "rgba(32,19,79,0.96)",
  },
};

const MatchThemeContext = createContext<{
  theme: MatchTheme;
  toggleTheme: () => void;
} | null>(null);

export function MatchThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [name, setName] = useState<MatchThemeName>("professional");
  const value = useMemo(
    () => ({
      theme: MATCH_THEMES[name],
      toggleTheme: () =>
        setName((current) =>
          current === "professional" ? "anime" : "professional",
        ),
    }),
    [name],
  );
  return (
    <MatchThemeContext.Provider value={value}>
      {children}
    </MatchThemeContext.Provider>
  );
}

export function useMatchTheme() {
  const context = useContext(MatchThemeContext);
  if (!context) {
    throw new Error("useMatchTheme must be used inside MatchThemeProvider");
  }
  return context;
}
