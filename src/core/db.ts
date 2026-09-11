// Local SQLite bootstrap. Gaffer is 100% offline-first: every byte lives in this
// on-device database file — no cloud, no servers.
//
// Schema versions are tracked with `PRAGMA user_version`. v1 is the initial
// release; future releases (e.g. v2.x monetization) bump the version and append
// idempotent migration steps.

import * as SQLite from "expo-sqlite";
import { uuid } from "./id";

export const DB_NAME = "gaffer.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY NOT NULL,
      season_id TEXT NOT NULL,
      name TEXT NOT NULL,
      default_half_minutes INTEGER NOT NULL DEFAULT 20,
      default_game_format TEXT NOT NULL DEFAULT '7v7',
      created_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY NOT NULL,
      season_id TEXT NOT NULL,
      team_id TEXT,
      name TEXT NOT NULL,
      jersey_number INTEGER NOT NULL DEFAULT 0,
      avatar_seed TEXT NOT NULL,
      total_seconds INTEGER NOT NULL DEFAULT 0,
      match_goals INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY NOT NULL,
      season_id TEXT NOT NULL,
      team_id TEXT,
      team_name TEXT NOT NULL,
      opponent_name TEXT NOT NULL,
      game_format TEXT NOT NULL,
      tactical_shape TEXT NOT NULL,
      current_stage TEXT NOT NULL,
      field_orientation TEXT NOT NULL,
      team_side TEXT NOT NULL DEFAULT 'HOME',
      target_half_minutes INTEGER NOT NULL DEFAULT 20,
      home_score INTEGER NOT NULL DEFAULT 0,
      away_score INTEGER NOT NULL DEFAULT 0,
      elapsed_seconds INTEGER NOT NULL DEFAULT 0,
      is_clock_active INTEGER NOT NULL DEFAULT 0,
      stage_start_seconds INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS match_players (
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      x_pct REAL,
      y_pct REAL,
      status TEXT NOT NULL DEFAULT 'bench',
      shift_seconds INTEGER NOT NULL DEFAULT 0,
      shift_start_seconds INTEGER,
      bench_start_seconds INTEGER,
      total_seconds INTEGER NOT NULL DEFAULT 0,
      goals INTEGER NOT NULL DEFAULT 0,
      yellow_cards INTEGER NOT NULL DEFAULT 0,
      sent_off INTEGER NOT NULL DEFAULT 0,
      roster_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (match_id, player_id),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS match_events (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      timestamp_seconds INTEGER NOT NULL,
      type TEXT NOT NULL,
      player_scorer_id TEXT,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
  await migrateV2ExtraTime(db);
}

/** v2: playoff extra-time columns on existing installs (idempotent). */
async function migrateV2ExtraTime(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(matches)",
  );
  const has = (col: string) => columns.some((c) => c.name === col);
  if (!has("extra_time_enabled")) {
    await db.execAsync(
      "ALTER TABLE matches ADD COLUMN extra_time_enabled INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!has("extra_time_half_minutes")) {
    await db.execAsync(
      "ALTER TABLE matches ADD COLUMN extra_time_half_minutes INTEGER NOT NULL DEFAULT 5",
    );
  }
  if (!has("extra_time_halves")) {
    await db.execAsync(
      "ALTER TABLE matches ADD COLUMN extra_time_halves INTEGER NOT NULL DEFAULT 2",
    );
  }
  // v3: bench stint tracking on match_players.
  const mp = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(match_players)",
  );
  if (!mp.some((c) => c.name === "bench_start_seconds")) {
    await db.execAsync(
      "ALTER TABLE match_players ADD COLUMN bench_start_seconds INTEGER",
    );
  }
  // v4: preserve whether our team is home or away.
  if (!columns.some((c) => c.name === "team_side")) {
    await db.execAsync(
      "ALTER TABLE matches ADD COLUMN team_side TEXT NOT NULL DEFAULT 'HOME'",
    );
  }
  // v5: card tracking on match_players.
  if (!mp.some((c) => c.name === "yellow_cards")) {
    await db.execAsync(
      "ALTER TABLE match_players ADD COLUMN yellow_cards INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!mp.some((c) => c.name === "sent_off")) {
    await db.execAsync(
      "ALTER TABLE match_players ADD COLUMN sent_off INTEGER NOT NULL DEFAULT 0",
    );
  }

  // v6: introduce teams and migrate existing season-wide players into one
  // default team. Existing matches remain valid and can be assigned later.
  const playerColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(players)",
  );
  if (!playerColumns.some((c) => c.name === "team_id")) {
    await db.execAsync("ALTER TABLE players ADD COLUMN team_id TEXT");
  }
  const matchColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(matches)",
  );
  if (!matchColumns.some((c) => c.name === "team_id")) {
    await db.execAsync("ALTER TABLE matches ADD COLUMN team_id TEXT");
  }
  const teamColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(teams)",
  );
  if (!teamColumns.some((c) => c.name === "default_game_format")) {
    await db.execAsync(
      "ALTER TABLE teams ADD COLUMN default_game_format TEXT NOT NULL DEFAULT '7v7'",
    );
  }
  const seasons = await db.getAllAsync<{ id: string; name: string }>(
    "SELECT id, name FROM seasons",
  );
  for (const season of seasons) {
    let team = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM teams WHERE season_id = ? ORDER BY created_at ASC LIMIT 1",
      season.id,
    );
    if (!team) {
      const id = uuid();
      await db.runAsync(
        "INSERT INTO teams (id, season_id, name, default_half_minutes, created_at) VALUES (?, ?, ?, 20, ?)",
        id,
        season.id,
        season.name,
        new Date().toISOString(),
      );
      team = { id };
    }
    await db.runAsync(
      "UPDATE players SET team_id = ? WHERE season_id = ? AND team_id IS NULL",
      team.id,
      season.id,
    );
    await db.runAsync(
      "UPDATE matches SET team_id = ? WHERE season_id = ? AND team_id IS NULL",
      team.id,
      season.id,
    );
  }
}

export type MetaKey =
  | "active_season_id"
  | "remembered_team_name"
  | "premium_v2_receipt";

export async function getMetaValue(key: MetaKey): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string | null }>(
    "SELECT value FROM app_meta WHERE key = ?",
    key,
  );
  return row?.value ?? null;
}

export async function setMetaValue(key: MetaKey, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
