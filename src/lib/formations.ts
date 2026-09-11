// §6.A Context-Aware Formations Matrix.
//
// Coordinates are expressed as canvas *percentages* (x_pct, y_pct) within the
// field zone, 0-100. The pitch component maps these onto whatever physical
// screen factor is active (iPhone vs. iPad) — no raw pixel units anywhere.
// Slot counts always equal the game format size (4v4 → 4 slots, etc.).
//
// x=0 is the goal line the team defends (NORMAL orientation), x=100 is the goal
// they attack. y=0 is the top touchline, y=100 the bottom.

import type { GameFormat } from '@/core/types';

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

export const FORMATIONS: Record<GameFormat, Formation[]> = {
  '4v4': [
    {
      id: 'diamond',
      label: 'Diamond',
      shape: '1-2-1',
      slots: [
        { xPct: 16, yPct: 50 }, // back
        { xPct: 46, yPct: 28 }, // mid left
        { xPct: 46, yPct: 72 }, // mid right
        { xPct: 80, yPct: 50 }, // forward
      ],
    },
    {
      id: 'box',
      label: 'Box Square',
      shape: '2-2',
      slots: [
        { xPct: 22, yPct: 34 },
        { xPct: 22, yPct: 66 },
        { xPct: 62, yPct: 34 },
        { xPct: 62, yPct: 66 },
      ],
    },
    {
      id: 'defensive-2-1-1',
      label: 'Defensive',
      shape: '2-1-1',
      slots: [
        { xPct: 16, yPct: 38 },
        { xPct: 16, yPct: 62 },
        { xPct: 52, yPct: 50 },
        { xPct: 82, yPct: 50 },
      ],
    },
  ],
  '7v7': [
    {
      id: '1-2-3-1',
      label: 'Diamond',
      shape: '1-2-3-1',
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
      id: '2-3-1',
      label: '2-3-1',
      shape: '2-3-1',
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
      id: '3-2-1',
      label: '3-2-1',
      shape: '3-2-1',
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
      id: '2-2-2',
      label: '2-2-2',
      shape: '2-2-2',
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
  '9v9': [
    {
      id: '3-3-2',
      label: '3-3-2',
      shape: '3-3-2',
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
      id: '3-2-3',
      label: '3-2-3',
      shape: '3-2-3',
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
      id: '4-3-1',
      label: '4-3-1',
      shape: '4-3-1',
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
      id: '2-4-2',
      label: '2-4-2',
      shape: '2-4-2',
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
  '11v11': [
    {
      id: '4-4-2',
      label: '4-4-2',
      shape: '4-4-2',
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
      id: '4-3-3',
      label: '4-3-3',
      shape: '4-3-3',
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
      id: '5-3-2',
      label: '5-3-2',
      shape: '5-3-2',
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
      id: '3-5-2',
      label: '3-5-2',
      shape: '3-5-2',
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

export const GAME_FORMATS: GameFormat[] = ['4v4', '7v7', '9v9', '11v11'];

export function getFormation(format: GameFormat, id: string): Formation {
  const found = FORMATIONS[format].find((f) => f.id === id);
  return found ?? FORMATIONS[format][0];
}

export function getFormationsForFormat(format: GameFormat): Formation[] {
  return FORMATIONS[format];
}

/**
 * §6.B Coordinate Geometry Field Flipped Array — mirror every active field
 * coordinate 180° using basic matrix mirroring (100 - x, 100 - y).
 */
export function invertPitchCoordinates(
  points: { xPct: number | null; yPct: number | null }[]
): { xPct: number | null; yPct: number | null }[] {
  return points.map((p) => {
    if (p.xPct === null || p.yPct === null) return p;
    return { xPct: 100 - p.xPct, yPct: 100 - p.yPct };
  });
}
