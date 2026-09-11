// Data access layer over the local SQLite store. Every function maps snake_case
// rows into the camelCase domain types from types.ts.

import { getDb } from "./db";
import { uuid } from "./id";
import type {
  GameFormat,
  MatchEvent,
  MatchEventType,
  MatchPlayer,
  MatchSession,
  MatchStage,
  Player,
  Season,
  Team,
} from "./types";

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

interface SeasonRow {
  id: string;
  name: string;
  is_active: number;
  start_date: string;
  end_date: string | null;
}

function mapSeason(r: SeasonRow): Season {
  return {
    id: r.id,
    name: r.name,
    isActive: r.is_active === 1,
    startDate: r.start_date,
    endDate: r.end_date,
  };
}

export async function listSeasons(): Promise<Season[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SeasonRow>(
    "SELECT * FROM seasons ORDER BY start_date DESC",
  );
  return rows.map(mapSeason);
}

export async function getSeason(id: string): Promise<Season | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SeasonRow>(
    "SELECT * FROM seasons WHERE id = ?",
    id,
  );
  return row ? mapSeason(row) : null;
}

export async function createSeason(name: string): Promise<Season> {
  const db = await getDb();
  const season: Season = {
    id: uuid(),
    name: name.trim() || "Untitled Season",
    isActive: true,
    startDate: new Date().toISOString(),
    endDate: null,
  };
  await db.runAsync(
    "INSERT INTO seasons (id, name, is_active, start_date, end_date) VALUES (?, ?, 1, ?, NULL)",
    season.id,
    season.name,
    season.startDate,
  );
  // Multiple seasons can be active concurrently (e.g. rec + competitive);
  // each is ended individually with Stop Season.
  return season;
}

/** Season Lifecycle End ("Stop Season") — freezes the historical segment. */
export async function stopSeason(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE seasons SET is_active = 0, end_date = ? WHERE id = ?",
    new Date().toISOString(),
    id,
  );
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

interface TeamRow {
  id: string;
  season_id: string;
  name: string;
  default_half_minutes: number;
  default_game_format: GameFormat;
  created_at: string;
}

function mapTeam(r: TeamRow): Team {
  return {
    id: r.id,
    seasonId: r.season_id,
    name: r.name,
    defaultHalfMinutes: r.default_half_minutes,
    defaultGameFormat: r.default_game_format,
    createdAt: r.created_at,
  };
}

export async function listTeams(seasonId: string): Promise<Team[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TeamRow>(
    "SELECT * FROM teams WHERE season_id = ? ORDER BY created_at ASC",
    seasonId,
  );
  return rows.map(mapTeam);
}

export async function createTeam(
  seasonId: string,
  name: string,
  defaultHalfMinutes = 20,
  defaultGameFormat: GameFormat = "7v7",
): Promise<Team> {
  const db = await getDb();
  const team: Team = {
    id: uuid(),
    seasonId,
    name: name.trim(),
    defaultHalfMinutes,
    defaultGameFormat,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    "INSERT INTO teams (id, season_id, name, default_half_minutes, default_game_format, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    team.id,
    team.seasonId,
    team.name,
    team.defaultHalfMinutes,
    team.defaultGameFormat,
    team.createdAt,
  );
  return team;
}

export async function getTeam(id: string): Promise<Team | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TeamRow>(
    "SELECT * FROM teams WHERE id = ?",
    id,
  );
  return row ? mapTeam(row) : null;
}

export async function updateTeam(
  id: string,
  patch: Partial<
    Pick<Team, "name" | "defaultHalfMinutes" | "defaultGameFormat">
  >,
): Promise<void> {
  const db = await getDb();
  if (patch.name !== undefined) {
    await db.runAsync(
      "UPDATE teams SET name = ? WHERE id = ?",
      patch.name.trim(),
      id,
    );
  }
  if (patch.defaultHalfMinutes !== undefined) {
    await db.runAsync(
      "UPDATE teams SET default_half_minutes = ? WHERE id = ?",
      patch.defaultHalfMinutes,
      id,
    );
  }
  if (patch.defaultGameFormat !== undefined) {
    await db.runAsync(
      "UPDATE teams SET default_game_format = ? WHERE id = ?",
      patch.defaultGameFormat,
      id,
    );
  }
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

interface PlayerRow {
  id: string;
  season_id: string;
  team_id: string;
  name: string;
  jersey_number: number;
  avatar_seed: string;
  total_seconds: number;
  match_goals: number;
  created_at: string;
}

function mapPlayer(r: PlayerRow): Player {
  return {
    id: r.id,
    seasonId: r.season_id,
    teamId: r.team_id,
    name: r.name,
    jerseyNumber: r.jersey_number,
    avatarSeed: r.avatar_seed,
    totalSeconds: r.total_seconds,
    matchGoals: r.match_goals,
    createdAt: r.created_at,
  };
}

export async function listPlayers(
  seasonId: string,
  teamId?: string,
): Promise<Player[]> {
  const db = await getDb();
  const rows = teamId
    ? await db.getAllAsync<PlayerRow>(
        "SELECT * FROM players WHERE season_id = ? AND team_id = ? ORDER BY created_at ASC",
        seasonId,
        teamId,
      )
    : await db.getAllAsync<PlayerRow>(
        "SELECT * FROM players WHERE season_id = ? ORDER BY created_at ASC",
        seasonId,
      );
  return rows.map(mapPlayer);
}

/** A random local avatar seed (Dicebear-style) plus initials color hash. */
export function generateAvatarSeed(name: string): string {
  const h = `${name}-${Math.random().toString(36).slice(2, 10)}`;
  let hash = 0;
  for (let i = 0; i < h.length; i++) {
    hash = (hash * 31 + h.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 8);
}

export async function addPlayer(
  seasonId: string,
  name: string,
  jerseyNumber: number,
  teamId?: string,
): Promise<Player> {
  const db = await getDb();
  const resolvedTeam =
    teamId ??
    (
      await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM teams WHERE season_id = ? ORDER BY created_at ASC LIMIT 1",
        seasonId,
      )
    )?.id;
  if (!resolvedTeam)
    throw new Error("A team is required before adding players");
  const player: Player = {
    id: uuid(),
    seasonId,
    teamId: resolvedTeam,
    name: name.trim(),
    jerseyNumber,
    avatarSeed: generateAvatarSeed(name),
    totalSeconds: 0,
    matchGoals: 0,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    "INSERT INTO players (id, season_id, team_id, name, jersey_number, avatar_seed, total_seconds, match_goals, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)",
    player.id,
    player.seasonId,
    player.teamId,
    player.name,
    player.jerseyNumber,
    player.avatarSeed,
    player.createdAt,
  );
  return player;
}

export async function deletePlayer(
  seasonId: string,
  playerId: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "DELETE FROM players WHERE id = ? AND season_id = ?",
    playerId,
    seasonId,
  );
}

/** Flush per-match playing time/goals into the season-cumulative counters. */
export async function flushPlayerCumulatives(
  entries: { playerId: string; totalSeconds: number; goals: number }[],
): Promise<void> {
  const db = await getDb();
  for (const e of entries) {
    await db.runAsync(
      "UPDATE players SET total_seconds = total_seconds + ?, match_goals = match_goals + ? WHERE id = ?",
      e.totalSeconds,
      e.goals,
      e.playerId,
    );
  }
}

// ---------------------------------------------------------------------------
// Match sessions
// ---------------------------------------------------------------------------

interface MatchRow {
  id: string;
  season_id: string;
  team_id: string;
  team_name: string;
  opponent_name: string;
  game_format: GameFormat;
  tactical_shape: string;
  current_stage: MatchStage;
  field_orientation: "NORMAL" | "FLIPPED";
  team_side: "HOME" | "AWAY";
  target_half_minutes: number;
  extra_time_enabled: number;
  extra_time_half_minutes: number;
  extra_time_halves: number;
  home_score: number;
  away_score: number;
  elapsed_seconds: number;
  is_clock_active: number;
  stage_start_seconds: number;
  started_at: string;
  completed_at: string | null;
}

function mapMatch(r: MatchRow): MatchSession {
  return {
    id: r.id,
    seasonId: r.season_id,
    teamId: r.team_id,
    teamName: r.team_name,
    opponentName: r.opponent_name,
    gameFormat: r.game_format,
    tacticalShape: r.tactical_shape,
    currentStage: r.current_stage,
    fieldOrientation: r.field_orientation,
    teamSide: r.team_side,
    targetHalfMinutes: r.target_half_minutes,
    extraTimeEnabled: r.extra_time_enabled === 1,
    extraTimeHalfMinutes: r.extra_time_half_minutes,
    extraTimeHalves: r.extra_time_halves,
    homeScore: r.home_score,
    awayScore: r.away_score,
    elapsedSeconds: r.elapsed_seconds,
    isClockActive: r.is_clock_active === 1,
    stageStartSeconds: r.stage_start_seconds,
    startedAt: r.started_at,
    completedAt: r.completed_at,
  };
}

export interface NewMatchInput {
  seasonId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  teamSide?: "HOME" | "AWAY";
  gameFormat: GameFormat;
  tacticalShape: string;
  targetHalfMinutes: number;
  extraTimeEnabled?: boolean;
  extraTimeHalfMinutes?: number;
  extraTimeHalves?: number;
}

export async function createMatch(input: NewMatchInput): Promise<MatchSession> {
  const db = await getDb();
  const match: MatchSession = {
    id: uuid(),
    seasonId: input.seasonId,
    teamId: input.teamId,
    teamName: input.teamName.trim(),
    opponentName: input.opponentName.trim(),
    gameFormat: input.gameFormat,
    tacticalShape: input.tacticalShape,
    currentStage: "PRE_MATCH",
    fieldOrientation: "NORMAL",
    teamSide: input.teamSide ?? "HOME",
    targetHalfMinutes: input.targetHalfMinutes,
    extraTimeEnabled: input.extraTimeEnabled ?? false,
    extraTimeHalfMinutes: input.extraTimeHalfMinutes ?? 5,
    extraTimeHalves: input.extraTimeHalves ?? 2,
    homeScore: 0,
    awayScore: 0,
    elapsedSeconds: 0,
    isClockActive: false,
    stageStartSeconds: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  await db.runAsync(
    `INSERT INTO matches (
      id, season_id, team_id, team_name, opponent_name, game_format, tactical_shape,
      current_stage, field_orientation, team_side, target_half_minutes,
      extra_time_enabled, extra_time_half_minutes, extra_time_halves,
      home_score, away_score, elapsed_seconds, is_clock_active, stage_start_seconds,
      started_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, NULL)`,
    match.id,
    match.seasonId,
    match.teamId,
    match.teamName,
    match.opponentName,
    match.gameFormat,
    match.tacticalShape,
    match.currentStage,
    match.fieldOrientation,
    match.teamSide,
    match.targetHalfMinutes,
    match.extraTimeEnabled ? 1 : 0,
    match.extraTimeHalfMinutes,
    match.extraTimeHalves,
    match.startedAt,
  );
  return match;
}

export async function getMatch(id: string): Promise<MatchSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MatchRow>(
    "SELECT * FROM matches WHERE id = ?",
    id,
  );
  return row ? mapMatch(row) : null;
}

export async function listMatches(seasonId: string): Promise<MatchSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MatchRow>(
    "SELECT * FROM matches WHERE season_id = ? ORDER BY started_at DESC",
    seasonId,
  );
  return rows.map(mapMatch);
}

/** The most recent non-completed match for a season (for resume flows). */
export async function findLiveMatch(
  seasonId: string,
): Promise<MatchSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MatchRow>(
    "SELECT * FROM matches WHERE season_id = ? AND current_stage <> 'FULL_TIME' ORDER BY started_at DESC LIMIT 1",
    seasonId,
  );
  return row ? mapMatch(row) : null;
}

export async function updateMatch(
  id: string,
  patch: Partial<
    Pick<
      MatchSession,
      | "currentStage"
      | "fieldOrientation"
      | "homeScore"
      | "awayScore"
      | "elapsedSeconds"
      | "isClockActive"
      | "stageStartSeconds"
      | "tacticalShape"
      | "completedAt"
      | "extraTimeEnabled"
      | "extraTimeHalfMinutes"
      | "extraTimeHalves"
    >
  >,
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  const columnMap: Record<string, string> = {
    currentStage: "current_stage",
    fieldOrientation: "field_orientation",
    homeScore: "home_score",
    awayScore: "away_score",
    elapsedSeconds: "elapsed_seconds",
    isClockActive: "is_clock_active",
    stageStartSeconds: "stage_start_seconds",
    tacticalShape: "tactical_shape",
    completedAt: "completed_at",
    extraTimeEnabled: "extra_time_enabled",
    extraTimeHalfMinutes: "extra_time_half_minutes",
    extraTimeHalves: "extra_time_halves",
  };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const col = columnMap[key];
    if (!col) continue;
    sets.push(`${col} = ?`);
    values.push(
      typeof value === "boolean"
        ? value
          ? 1
          : 0
        : (value as string | number | null),
    );
  }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(
    `UPDATE matches SET ${sets.join(", ")} WHERE id = ?`,
    ...values,
  );
}

// ---------------------------------------------------------------------------
// Match players
// ---------------------------------------------------------------------------

interface MatchPlayerRow {
  match_id: string;
  player_id: string;
  name: string;
  jersey_number: number;
  avatar_seed: string;
  x_pct: number | null;
  y_pct: number | null;
  status: "field" | "bench";
  shift_seconds: number;
  shift_start_seconds: number | null;
  bench_start_seconds: number | null;
  total_seconds: number;
  goals: number;
  yellow_cards: number;
  sent_off: number;
  roster_order: number;
}

function mapMatchPlayer(r: MatchPlayerRow): MatchPlayer {
  return {
    matchId: r.match_id,
    playerId: r.player_id,
    playerName: r.name,
    jerseyNumber: r.jersey_number,
    avatarSeed: r.avatar_seed,
    xPct: r.x_pct,
    yPct: r.y_pct,
    status: r.status,
    shiftSeconds: r.shift_seconds,
    shiftStartSeconds: r.shift_start_seconds,
    benchStartSeconds: r.bench_start_seconds,
    totalSeconds: r.total_seconds,
    goals: r.goals,
    yellowCards: r.yellow_cards,
    sentOff: r.sent_off === 1,
    rosterOrder: r.roster_order,
  };
}

export async function getMatchPlayers(matchId: string): Promise<MatchPlayer[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MatchPlayerRow>(
    `SELECT mp.*, p.name, p.jersey_number, p.avatar_seed
     FROM match_players mp
     JOIN players p ON p.id = mp.player_id
     WHERE mp.match_id = ?
     ORDER BY mp.roster_order ASC`,
    matchId,
  );
  return rows.map(mapMatchPlayer);
}

/** Snapshot the current season roster into the match (all start on the bench). */
export async function seedMatchPlayers(
  matchId: string,
  players: Player[],
): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    await db.runAsync(
      `INSERT INTO match_players (match_id, player_id, x_pct, y_pct, status, shift_seconds, shift_start_seconds, bench_start_seconds, total_seconds, goals, yellow_cards, sent_off, roster_order)
       VALUES (?, ?, NULL, NULL, 'bench', 0, NULL, 0, 0, 0, 0, 0, ?)`,
      matchId,
      p.id,
      i,
    );
  }
}

/** Snap the roster onto a formation's percentage line map (§6.A). */
export async function applyFormationSlots(
  matchId: string,
  formation: { slots: { xPct: number; yPct: number }[] },
): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ player_id: string }>(
    "SELECT player_id FROM match_players WHERE match_id = ? ORDER BY roster_order ASC",
    matchId,
  );
  for (let i = 0; i < rows.length; i++) {
    const slot = formation.slots[i];
    if (slot) {
      await db.runAsync(
        `UPDATE match_players SET x_pct = ?, y_pct = ?, status = 'field', shift_seconds = 0, shift_start_seconds = 0, bench_start_seconds = NULL
         WHERE match_id = ? AND player_id = ?`,
        slot.xPct,
        slot.yPct,
        matchId,
        rows[i].player_id,
      );
    } else {
      await db.runAsync(
        `UPDATE match_players SET x_pct = NULL, y_pct = NULL, status = 'bench', shift_seconds = 0, shift_start_seconds = NULL, bench_start_seconds = 0
         WHERE match_id = ? AND player_id = ?`,
        matchId,
        rows[i].player_id,
      );
    }
  }
}

/** Add a late-arriving player mid-match (starts at zero runtime). */
export async function addLatePlayerToMatch(
  matchId: string,
  player: Player,
  rosterOrder: number,
  benchStartSeconds = 0,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO match_players (match_id, player_id, x_pct, y_pct, status, shift_seconds, shift_start_seconds, bench_start_seconds, total_seconds, goals, yellow_cards, sent_off, roster_order)
     VALUES (?, ?, NULL, NULL, 'bench', 0, NULL, ?, 0, 0, 0, 0, ?)`,
    matchId,
    player.id,
    benchStartSeconds,
    rosterOrder,
  );
}

export async function upsertMatchPlayer(
  matchId: string,
  mp: Pick<
    MatchPlayer,
    | "playerId"
    | "xPct"
    | "yPct"
    | "status"
    | "shiftSeconds"
    | "shiftStartSeconds"
    | "benchStartSeconds"
    | "totalSeconds"
    | "goals"
    | "yellowCards"
    | "sentOff"
  >,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE match_players SET
       x_pct = ?, y_pct = ?, status = ?, shift_seconds = ?,
       shift_start_seconds = ?, bench_start_seconds = ?, total_seconds = ?, goals = ?,
       yellow_cards = ?, sent_off = ?
     WHERE match_id = ? AND player_id = ?`,
    mp.xPct,
    mp.yPct,
    mp.status,
    mp.shiftSeconds,
    mp.shiftStartSeconds,
    mp.benchStartSeconds,
    mp.totalSeconds,
    mp.goals,
    mp.yellowCards,
    mp.sentOff ? 1 : 0,
    matchId,
    mp.playerId,
  );
}

// ---------------------------------------------------------------------------
// Match events
// ---------------------------------------------------------------------------

interface MatchEventRow {
  id: string;
  match_id: string;
  timestamp_seconds: number;
  type: MatchEventType;
  player_scorer_id: string | null;
}

function mapEvent(r: MatchEventRow): MatchEvent {
  return {
    id: r.id,
    matchId: r.match_id,
    timestampSeconds: r.timestamp_seconds,
    type: r.type,
    playerScorerId: r.player_scorer_id,
  };
}

export async function addMatchEvent(
  matchId: string,
  timestampSeconds: number,
  type: MatchEventType,
  playerScorerId: string | null,
): Promise<MatchEvent> {
  const db = await getDb();
  const ev: MatchEvent = {
    id: uuid(),
    matchId,
    timestampSeconds,
    type,
    playerScorerId,
  };
  await db.runAsync(
    "INSERT INTO match_events (id, match_id, timestamp_seconds, type, player_scorer_id) VALUES (?, ?, ?, ?, ?)",
    ev.id,
    ev.matchId,
    ev.timestampSeconds,
    ev.type,
    ev.playerScorerId,
  );
  return ev;
}

export async function listMatchEvents(matchId: string): Promise<MatchEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MatchEventRow>(
    "SELECT * FROM match_events WHERE match_id = ? ORDER BY timestamp_seconds ASC",
    matchId,
  );
  return rows.map(mapEvent);
}

// ---------------------------------------------------------------------------
// §7.B Cascading Space Eraser — purge one match (and every trace of it).
// ---------------------------------------------------------------------------

export async function purgeStoredMatch(targetId: string): Promise<void> {
  const db = await getDb();
  await db.execAsync("BEGIN TRANSACTION;");
  try {
    await db.runAsync("DELETE FROM match_players WHERE match_id = ?", targetId);
    await db.runAsync("DELETE FROM match_events WHERE match_id = ?", targetId);
    await db.runAsync("DELETE FROM matches WHERE id = ?", targetId);
    await db.execAsync("COMMIT;");
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
  }
}

export async function purgeSeason(seasonId: string): Promise<void> {
  const db = await getDb();
  await db.execAsync("BEGIN TRANSACTION;");
  try {
    await db.runAsync(
      "DELETE FROM match_players WHERE match_id IN (SELECT id FROM matches WHERE season_id = ?)",
      seasonId,
    );
    await db.runAsync(
      "DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE season_id = ?)",
      seasonId,
    );
    await db.runAsync("DELETE FROM matches WHERE season_id = ?", seasonId);
    await db.runAsync("DELETE FROM players WHERE season_id = ?", seasonId);
    await db.runAsync("DELETE FROM seasons WHERE id = ?", seasonId);
    await db.execAsync("COMMIT;");
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
  }
}
