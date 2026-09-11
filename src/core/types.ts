// Gaffer core domain types — mirrors specs.md §2 "Standalone Relational Data Schema".
// Roster-static fields (name, jersey, avatar) live on `Player`; per-match runtime
// fields (position, stint, shift clock) live on `MatchPlayer` so history survives
// between matches. Season-cumulative counters accumulate on `Player`.

export type PlayerStatus = "field" | "bench";

export type GameFormat = "4v4" | "7v7" | "9v9" | "11v11";

export type MatchStage =
  | "PRE_MATCH"
  | "FIRST_HALF"
  | "BREAK"
  | "SECOND_HALF"
  | "EXTRA_TIME_1"
  | "EXTRA_TIME_BREAK"
  | "EXTRA_TIME_2"
  | "FULL_TIME";

export type FieldOrientation = "NORMAL" | "FLIPPED";
export type TeamSide = "HOME" | "AWAY";

export type MatchEventType =
  | "GOAL_HOME"
  | "GOAL_AWAY"
  | "YELLOW_CARD"
  | "RED_CARD";

export interface Season {
  id: string; // UUID key
  name: string; // User text input (e.g. "Fall 2026 Rec")
  isActive: boolean; // Global lifecycle flag
  startDate: string;
  endDate: string | null;
}

export interface Team {
  id: string;
  seasonId: string;
  name: string;
  defaultHalfMinutes: number;
  createdAt: string;
}

export interface Player {
  id: string;
  seasonId: string; // Enforces data isolation between separate seasons
  teamId: string; // Each player belongs to exactly one team in a season
  name: string;
  jerseyNumber: number;
  avatarSeed: string; // Seed passed to the avatar renderer (Dicebear-style)
  totalSeconds: number; // Global cumulative match playing counter
  matchGoals: number; // Season-cumulative goals
  createdAt: string;
}

export interface MatchSession {
  id: string;
  seasonId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  gameFormat: GameFormat;
  tacticalShape: string; // Selected line preset system (e.g. "diamond", "4-4-2")
  currentStage: MatchStage;
  fieldOrientation: FieldOrientation; // Tracks 180° field flips
  teamSide: TeamSide; // Whether our team is home or away
  targetHalfMinutes: number;
  extraTimeEnabled: boolean; // Playoff extra time (defaults off)
  extraTimeHalfMinutes: number; // Length of each extra-time half
  extraTimeHalves: number; // Number of extra-time halves (usually 2)
  homeScore: number;
  awayScore: number;
  elapsedSeconds: number; // Master running clock stopwatch counter
  isClockActive: boolean;
  stageStartSeconds: number; // Clock timestamp when the current stage began (per-half clock)
  startedAt: string;
  completedAt: string | null;
}

/** Per-match runtime record for one rostered player (join of players + match_players). */
export interface MatchPlayer {
  matchId: string;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  avatarSeed: string;
  /** Field-zone percentage coordinates (0-100). null while on the bench. */
  xPct: number | null;
  yPct: number | null;
  status: PlayerStatus;
  shiftSeconds: number; // Active rolling continuous stint counter
  shiftStartSeconds: number | null; // Clock time the current stint began
  benchStartSeconds: number | null; // Clock time the current bench stint began (null when on field)
  totalSeconds: number; // Accumulated playing time in this match
  goals: number; // Goals in this match
  yellowCards: number; // Yellow cards in this match (2nd yellow → red)
  sentOff: boolean; // Red carded — cannot play again this game
  rosterOrder: number; // Entry order on the roster (used for default lineup)
}

export interface MatchEvent {
  id: string;
  matchId: string;
  timestampSeconds: number;
  type: MatchEventType;
  playerScorerId: string | null; // Null if conceded to opponent
}
