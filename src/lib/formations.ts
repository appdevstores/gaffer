// §6.A Context-Aware Formations Matrix.
//
// Coordinates are expressed as canvas *percentages* (x_pct, y_pct) within the
// field zone, 0-100. The pitch component maps these onto whatever physical
// screen factor is active (iPhone vs. iPad) — no raw pixel units anywhere.
// Slot counts always equal the game format size (4v4 → 4 slots, etc.).
//
// x=0 is the goal line the team defends (NORMAL orientation), x=100 is the goal
// they attack. y=0 is the top touchline, y=100 the bottom.

import type { GameFormat } from "@/core/types";

export interface FormationSlot {
  xPct: number;
  yPct: number;
}

export interface Formation {
  id: string;
  label: string;
  /** e.g. "1-2-1" — human-readable line breakdown. */
  shape: string;
  slots: FormationSlot[];
}

type SupportedFormationFormat = "4v4" | "7v7" | "9v9" | "11v11";

export const FORMATIONS: Record<SupportedFormationFormat, Formation[]> = {
  "4v4": [
    {
      id: "diamond",
      label: "Diamond",
      shape: "1-2-1",
      slots: [
        { xPct: 16, yPct: 50 }, // back
        { xPct: 46, yPct: 28 }, // mid left
        { xPct: 46, yPct: 72 }, // mid right
        { xPct: 80, yPct: 50 }, // forward
      ],
    },
    {
      id: "box",
      label: "Box Square",
      shape: "2-2",
      slots: [
        { xPct: 22, yPct: 34 },
        { xPct: 22, yPct: 66 },
        { xPct: 62, yPct: 34 },
        { xPct: 62, yPct: 66 },
      ],
    },
    {
      id: "defensive-2-1-1",
      label: "Defensive",
      shape: "2-1-1",
      slots: [
        { xPct: 16, yPct: 38 },
        { xPct: 16, yPct: 62 },
        { xPct: 52, yPct: 50 },
        { xPct: 82, yPct: 50 },
      ],
    },
  ],
  "7v7": [
    {
      id: "1-2-3-1",
      label: "Diamond",
      shape: "1-2-3-1",
      slots: [
        { xPct: 10, yPct: 50 },
        { xPct: 32, yPct: 34 },
        { xPct: 32, yPct: 66 },
        { xPct: 52, yPct: 20 },
        { xPct: 54, yPct: 50 },
        { xPct: 52, yPct: 80 },
        { xPct: 80, yPct: 50 },
      ],
    },
    {
      id: "2-3-1",
      label: "2-3-1",
      shape: "2-3-1",
      slots: [
        { xPct: 10, yPct: 50 },
        { xPct: 30, yPct: 30 },
        { xPct: 30, yPct: 70 },
        { xPct: 50, yPct: 22 },
        { xPct: 52, yPct: 50 },
        { xPct: 50, yPct: 78 },
        { xPct: 80, yPct: 50 },
      ],
    },
    {
      id: "3-2-1",
      label: "3-2-1",
      shape: "3-2-1",
      slots: [
        { xPct: 10, yPct: 50 },
        { xPct: 28, yPct: 24 },
        { xPct: 28, yPct: 50 },
        { xPct: 28, yPct: 76 },
        { xPct: 54, yPct: 34 },
        { xPct: 54, yPct: 66 },
        { xPct: 82, yPct: 50 },
      ],
    },
    {
      id: "2-2-2",
      label: "2-2-2",
      shape: "2-2-2",
      slots: [
        { xPct: 10, yPct: 50 },
        { xPct: 30, yPct: 34 },
        { xPct: 30, yPct: 66 },
        { xPct: 56, yPct: 34 },
        { xPct: 56, yPct: 66 },
        { xPct: 82, yPct: 28 },
        { xPct: 82, yPct: 72 },
      ],
    },
  ],
  "9v9": [
    {
      id: "3-3-2",
      label: "3-3-2",
      shape: "3-3-2",
      slots: [
        { xPct: 8, yPct: 50 },
        { xPct: 25, yPct: 25 },
        { xPct: 25, yPct: 50 },
        { xPct: 25, yPct: 75 },
        { xPct: 50, yPct: 20 },
        { xPct: 50, yPct: 50 },
        { xPct: 50, yPct: 80 },
        { xPct: 76, yPct: 35 },
        { xPct: 76, yPct: 65 },
      ],
    },
    {
      id: "3-2-3",
      label: "3-2-3",
      shape: "3-2-3",
      slots: [
        { xPct: 8, yPct: 50 },
        { xPct: 25, yPct: 30 },
        { xPct: 25, yPct: 50 },
        { xPct: 25, yPct: 70 },
        { xPct: 50, yPct: 35 },
        { xPct: 50, yPct: 65 },
        { xPct: 74, yPct: 18 },
        { xPct: 74, yPct: 50 },
        { xPct: 74, yPct: 82 },
      ],
    },
    {
      id: "4-3-1",
      label: "4-3-1",
      shape: "4-3-1",
      slots: [
        { xPct: 8, yPct: 50 },
        { xPct: 22, yPct: 18 },
        { xPct: 22, yPct: 40 },
        { xPct: 22, yPct: 60 },
        { xPct: 22, yPct: 82 },
        { xPct: 48, yPct: 30 },
        { xPct: 48, yPct: 50 },
        { xPct: 48, yPct: 70 },
        { xPct: 78, yPct: 50 },
      ],
    },
    {
      id: "2-4-2",
      label: "2-4-2",
      shape: "2-4-2",
      slots: [
        { xPct: 8, yPct: 50 },
        { xPct: 28, yPct: 35 },
        { xPct: 28, yPct: 65 },
        { xPct: 45, yPct: 15 },
        { xPct: 45, yPct: 38 },
        { xPct: 45, yPct: 62 },
        { xPct: 45, yPct: 85 },
        { xPct: 72, yPct: 30 },
        { xPct: 72, yPct: 70 },
      ],
    },
  ],
  "11v11": [
    {
      id: "4-4-2",
      label: "4-4-2",
      shape: "4-4-2",
      slots: [
        { xPct: 6, yPct: 50 },
        { xPct: 20, yPct: 14 },
        { xPct: 20, yPct: 38 },
        { xPct: 20, yPct: 62 },
        { xPct: 20, yPct: 86 },
        { xPct: 45, yPct: 14 },
        { xPct: 45, yPct: 38 },
        { xPct: 45, yPct: 62 },
        { xPct: 45, yPct: 86 },
        { xPct: 72, yPct: 35 },
        { xPct: 72, yPct: 65 },
      ],
    },
    {
      id: "4-3-3",
      label: "4-3-3",
      shape: "4-3-3",
      slots: [
        { xPct: 6, yPct: 50 },
        { xPct: 20, yPct: 14 },
        { xPct: 20, yPct: 38 },
        { xPct: 20, yPct: 62 },
        { xPct: 20, yPct: 86 },
        { xPct: 45, yPct: 34 },
        { xPct: 45, yPct: 50 },
        { xPct: 45, yPct: 66 },
        { xPct: 70, yPct: 15 },
        { xPct: 70, yPct: 50 },
        { xPct: 70, yPct: 85 },
      ],
    },
    {
      id: "5-3-2",
      label: "5-3-2",
      shape: "5-3-2",
      slots: [
        { xPct: 6, yPct: 50 },
        { xPct: 16, yPct: 12 },
        { xPct: 16, yPct: 30 },
        { xPct: 16, yPct: 50 },
        { xPct: 16, yPct: 70 },
        { xPct: 16, yPct: 88 },
        { xPct: 44, yPct: 34 },
        { xPct: 44, yPct: 50 },
        { xPct: 44, yPct: 66 },
        { xPct: 70, yPct: 35 },
        { xPct: 70, yPct: 65 },
      ],
    },
    {
      id: "3-5-2",
      label: "3-5-2",
      shape: "3-5-2",
      slots: [
        { xPct: 6, yPct: 50 },
        { xPct: 20, yPct: 25 },
        { xPct: 20, yPct: 50 },
        { xPct: 20, yPct: 75 },
        { xPct: 42, yPct: 12 },
        { xPct: 42, yPct: 32 },
        { xPct: 42, yPct: 50 },
        { xPct: 42, yPct: 68 },
        { xPct: 42, yPct: 88 },
        { xPct: 70, yPct: 35 },
        { xPct: 70, yPct: 65 },
      ],
    },
  ],
};

/** Additional coach-requested line maps. Kept separate so new presets do not
 * disturb the IDs or coordinates of existing saved matches. */
const EXTRA_FORMATIONS: Partial<Record<GameFormat, Formation[]>> = {
  "4v4": [
    {
      id: "0-4-0",
      label: "Four Across",
      shape: "0-4-0",
      slots: [
        { xPct: 44, yPct: 14 },
        { xPct: 44, yPct: 38 },
        { xPct: 44, yPct: 62 },
        { xPct: 44, yPct: 86 },
      ],
    },
    {
      id: "1-1-2",
      label: "Attacking",
      shape: "1-1-2",
      slots: [
        { xPct: 16, yPct: 50 },
        { xPct: 45, yPct: 50 },
        { xPct: 78, yPct: 32 },
        { xPct: 78, yPct: 68 },
      ],
    },
  ],
  "7v7": [
    {
      id: "3-3-1",
      label: "Balanced",
      shape: "3-3-1",
      slots: [
        { xPct: 10, yPct: 25 },
        { xPct: 10, yPct: 50 },
        { xPct: 10, yPct: 75 },
        { xPct: 48, yPct: 25 },
        { xPct: 48, yPct: 50 },
        { xPct: 48, yPct: 75 },
        { xPct: 82, yPct: 50 },
      ],
    },
    {
      id: "1-3-3",
      label: "Attacking Line",
      shape: "1-3-3",
      slots: [
        { xPct: 10, yPct: 50 },
        { xPct: 43, yPct: 22 },
        { xPct: 43, yPct: 50 },
        { xPct: 43, yPct: 78 },
        { xPct: 78, yPct: 18 },
        { xPct: 78, yPct: 50 },
        { xPct: 78, yPct: 82 },
      ],
    },
    {
      id: "2-4-1",
      label: "Midfield Box",
      shape: "2-4-1",
      slots: [
        { xPct: 12, yPct: 35 },
        { xPct: 12, yPct: 65 },
        { xPct: 47, yPct: 14 },
        { xPct: 47, yPct: 38 },
        { xPct: 47, yPct: 62 },
        { xPct: 47, yPct: 86 },
        { xPct: 82, yPct: 50 },
      ],
    },
  ],
  "8v8": [
    {
      id: "3-4-1",
      label: "Eight-a-side Attack",
      shape: "3-4-1",
      slots: [
        { xPct: 10, yPct: 20 },
        { xPct: 10, yPct: 50 },
        { xPct: 10, yPct: 80 },
        { xPct: 45, yPct: 12 },
        { xPct: 45, yPct: 38 },
        { xPct: 45, yPct: 62 },
        { xPct: 45, yPct: 88 },
        { xPct: 82, yPct: 50 },
      ],
    },
  ],
  "9v9": [
    {
      id: "4-2-2",
      label: "Compact Attack",
      shape: "4-2-2",
      slots: [
        { xPct: 8, yPct: 18 },
        { xPct: 8, yPct: 40 },
        { xPct: 8, yPct: 60 },
        { xPct: 8, yPct: 82 },
        { xPct: 43, yPct: 34 },
        { xPct: 43, yPct: 66 },
        { xPct: 74, yPct: 35 },
        { xPct: 74, yPct: 65 },
        { xPct: 90, yPct: 50 },
      ],
    },
    {
      id: "4-4-1",
      label: "Four Midfield + GK",
      shape: "1-4-3-1",
      slots: [
        { xPct: 8, yPct: 50 }, // goalkeeper
        { xPct: 28, yPct: 14 },
        { xPct: 28, yPct: 38 },
        { xPct: 28, yPct: 62 },
        { xPct: 28, yPct: 86 },
        { xPct: 52, yPct: 20 },
        { xPct: 52, yPct: 50 },
        { xPct: 52, yPct: 80 },
        { xPct: 82, yPct: 50 },
      ],
    },
  ],
  "11v11": [
    {
      id: "4-2-3-1",
      label: "4-2-3-1",
      shape: "4-2-3-1",
      slots: [
        { xPct: 6, yPct: 14 },
        { xPct: 6, yPct: 38 },
        { xPct: 6, yPct: 62 },
        { xPct: 6, yPct: 86 },
        { xPct: 34, yPct: 35 },
        { xPct: 34, yPct: 65 },
        { xPct: 58, yPct: 20 },
        { xPct: 58, yPct: 50 },
        { xPct: 58, yPct: 80 },
        { xPct: 82, yPct: 50 },
        { xPct: 94, yPct: 50 },
      ],
    },
    {
      id: "3-4-3",
      label: "3-4-3",
      shape: "3-4-3",
      slots: [
        { xPct: 8, yPct: 25 },
        { xPct: 8, yPct: 50 },
        { xPct: 8, yPct: 75 },
        { xPct: 38, yPct: 12 },
        { xPct: 38, yPct: 38 },
        { xPct: 38, yPct: 62 },
        { xPct: 38, yPct: 88 },
        { xPct: 75, yPct: 18 },
        { xPct: 75, yPct: 50 },
        { xPct: 75, yPct: 82 },
        { xPct: 94, yPct: 50 },
      ],
    },
    {
      id: "5-4-1",
      label: "Defensive Block",
      shape: "5-4-1",
      slots: [
        { xPct: 6, yPct: 10 },
        { xPct: 6, yPct: 30 },
        { xPct: 6, yPct: 50 },
        { xPct: 6, yPct: 70 },
        { xPct: 6, yPct: 90 },
        { xPct: 38, yPct: 14 },
        { xPct: 38, yPct: 38 },
        { xPct: 38, yPct: 62 },
        { xPct: 38, yPct: 86 },
        { xPct: 72, yPct: 50 },
        { xPct: 94, yPct: 50 },
      ],
    },
  ],
};

export const GAME_FORMATS: GameFormat[] = [
  "4v4",
  "5v5",
  "6v6",
  "7v7",
  "8v8",
  "9v9",
  "10v10",
  "11v11",
];

/** Formats without a bespoke matrix use the nearest supported line preset. */
function formationFormat(format: GameFormat): "4v4" | "7v7" | "9v9" | "11v11" {
  if (format === "5v5" || format === "6v6") return "7v7";
  if (format === "8v8") return "9v9";
  if (format === "10v10") return "11v11";
  return format;
}

export function getFormation(format: GameFormat, id: string): Formation {
  const options = getFormationsForFormat(format);
  const found = options.find((f) => f.id === id);
  return found ?? options[0];
}

export function getFormationsForFormat(format: GameFormat): Formation[] {
  return [
    ...FORMATIONS[formationFormat(format)],
    ...(EXTRA_FORMATIONS[format] ?? []),
  ];
}

/**
 * §6.B Coordinate Geometry Field Flipped Array — mirror every active field
 * coordinate 180° using basic matrix mirroring (100 - x, 100 - y).
 */
export function invertPitchCoordinates(
  points: { xPct: number | null; yPct: number | null }[],
): { xPct: number | null; yPct: number | null }[] {
  return points.map((p) => {
    if (p.xPct === null || p.yPct === null) return p;
    return { xPct: 100 - p.xPct, yPct: 100 - p.yPct };
  });
}
