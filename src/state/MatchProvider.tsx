// Live match session state engine. Owns the match row, per-match player
// runtime, events, the two-tap substitution cursor, and the whistle clock.
// Every mutation is persisted straight to the local SQLite store so the match
// can be resumed from any device state.

import {
  addLatePlayerToMatch,
  addMatchEvent,
  addPlayer,
  flushPlayerCumulatives,
  getMatch,
  getMatchPlayers,
  listMatchEvents,
  updateMatch,
  upsertMatchPlayer,
} from "@/core/repo";
import type {
  GameFormat,
  MatchEvent,
  MatchEventType,
  MatchPlayer,
  MatchSession,
  MatchStage,
  Player,
  PlayerStatus,
} from "@/core/types";
import { invertPitchCoordinates, type Formation } from "@/lib/formations";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const HALF_MINUTES_DEFAULT = 20;

/** Field-player slots per game format (used for the fair-share target). */
export const FIELD_SLOTS: Record<GameFormat, number> = {
  "4v4": 4,
  "7v7": 7,
  "9v9": 9,
  "11v11": 11,
};

/** Planned match duration in seconds: regulation halves + optional extra time. */
export function plannedMatchSeconds(match: MatchSession): number {
  const regulation = match.targetHalfMinutes * 2;
  const extra = match.extraTimeEnabled
    ? match.extraTimeHalfMinutes * match.extraTimeHalves
    : 0;
  return (regulation + extra) * 60;
}

interface MatchContextValue {
  match: MatchSession | null;
  players: MatchPlayer[];
  events: MatchEvent[];
  selectionId: string | null;
  notice: string | null;

  fieldPlayers: MatchPlayer[];
  sortedBench: MatchPlayer[];

  /** Seconds elapsed within the current stage (per-half clock). */
  perHalfSeconds: number;
  /** True when the running clock has passed the target half interval. */
  inStoppage: boolean;
  isRunning: boolean;
  /**
   * Fair-share average game time (seconds): elapsed × field slots ÷ players.
   * The equal-playing-time target for deciding who needs to come off.
   */
  fairShareSeconds: number;

  startClock(): void;
  stopClock(): void;
  transitionStage(next: MatchStage): void;
  selectPlayer(id: string): void;
  clearSelection(): void;
  tapPitch(xPct: number, yPct: number, inTechnicalArea: boolean): void;
  registerGoal(type: MatchEventType, scorerId: string | null): void;
  /** Give a yellow or red card. A 2nd yellow auto-converts to red (sent off). */
  giveCard(playerId: string, kind: "yellow" | "red"): void;
  flipField(): void;
  applyFormation(formation: Formation): void;
  addLateArrival(name: string, jerseyNumber: number): Promise<Player>;
  showNotice(msg: string): void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error("useMatch must be used inside MatchProvider");
  return ctx;
}

interface Props {
  matchId: string;
  children: React.ReactNode;
}

export function MatchProvider({ matchId, children }: Props) {
  const [match, setMatch] = useState<MatchSession | null>(null);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const playersRef = useRef(players);
  playersRef.current = players;
  const matchRef = useRef(match);
  matchRef.current = match;

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 1800);
  }, []);

  // ---- Load ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let m = await getMatch(matchId);
      const ps = await getMatchPlayers(matchId);
      const evs = await listMatchEvents(matchId);
      if (cancelled) return;

      // Matches created before the break timer was added may already be saved
      // at BREAK with isClockActive=false. Resume their break stopwatch on load.
      if (m?.currentStage === "BREAK" && !m.isClockActive) {
        await updateMatch(m.id, { isClockActive: true });
        m = { ...m, isClockActive: true };
      }
      setMatch(m);
      setPlayers(ps);
      setEvents(evs);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  // ---- Whistle clock tick ----
  useEffect(() => {
    if (!match || !match.isClockActive) return;
    const interval = setInterval(() => {
      const m = matchRef.current;
      if (!m) return;
      const elapsed = m.elapsedSeconds + 1;
      setMatch((prev) => (prev ? { ...prev, elapsedSeconds: elapsed } : prev));
      // Rolling stint counters for every player currently on the field.
      // A break has its own running display, but never advances player minutes.
      const playingStage =
        m.currentStage === "FIRST_HALF" ||
        m.currentStage === "SECOND_HALF" ||
        m.currentStage === "EXTRA_TIME_1" ||
        m.currentStage === "EXTRA_TIME_2";
      for (const p of playersRef.current) {
        if (
          playingStage &&
          p.status === "field" &&
          p.shiftStartSeconds !== null
        ) {
          const shift = elapsed - p.shiftStartSeconds;
          if (shift !== p.shiftSeconds) {
            upsertMatchPlayer(m.id, { ...p, shiftSeconds: shift });
            setPlayers((prev) =>
              prev.map((x) =>
                x.playerId === p.playerId ? { ...x, shiftSeconds: shift } : x,
              ),
            );
          }
        }
      }
      updateMatch(m.id, { elapsedSeconds: elapsed }).catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [match?.isClockActive]);

  // ---- Clock control ----
  const startClock = useCallback(() => {
    if (!matchRef.current) return;
    updateMatch(matchRef.current.id, { isClockActive: true }).catch(() => {});
    setMatch((prev) => (prev ? { ...prev, isClockActive: true } : prev));
  }, []);

  const stopClock = useCallback(() => {
    if (!matchRef.current) return;
    updateMatch(matchRef.current.id, { isClockActive: false }).catch(() => {});
    setMatch((prev) => (prev ? { ...prev, isClockActive: false } : prev));
  }, []);

  // ---- §6.B Field flipping (shared by the manual Flip button and the
  // automatic side-switch when a new half starts) ----
  const applyFlip = useCallback(() => {
    const m = matchRef.current;
    if (!m) return;
    const nextOrientation =
      m.fieldOrientation === "NORMAL" ? "FLIPPED" : "NORMAL";
    // invertPitchCoordinates mirrors each active field point by (100 - x, 100 - y).
    const mirrored = playersRef.current.map((p) => {
      if (p.status !== "field") return p;
      const inv = invertPitchCoordinates([p])[0];
      return { ...p, xPct: inv.xPct, yPct: inv.yPct };
    });
    for (const p of mirrored) {
      if (p.status === "field") {
        upsertMatchPlayer(m.id, { ...p, xPct: p.xPct, yPct: p.yPct }).catch(
          () => {},
        );
      }
    }
    updateMatch(m.id, { fieldOrientation: nextOrientation }).catch(() => {});
    setMatch((prev) =>
      prev ? { ...prev, fieldOrientation: nextOrientation } : prev,
    );
    setPlayers(mirrored);
  }, []);

  /** Automatic half change: record the new end without moving the tactical layout. */
  const toggleOrientationOnly = useCallback(() => {
    const m = matchRef.current;
    if (!m) return;
    const nextOrientation =
      m.fieldOrientation === "NORMAL" ? "FLIPPED" : "NORMAL";
    updateMatch(m.id, { fieldOrientation: nextOrientation }).catch(() => {});
    setMatch((prev) =>
      prev ? { ...prev, fieldOrientation: nextOrientation } : prev,
    );
  }, []);

  // ---- Stage transitions (gated behind the referee's whistle commands) ----
  // The whistle buttons are the only clock control: a kickoff starts the clock
  // and a whistle stops it. Sides automatically switch when a new half starts
  // (2nd half, and the 2nd extra-time half).
  const transitionStage = useCallback(
    (next: MatchStage) => {
      const m = matchRef.current;
      if (!m) return;
      const now = m.elapsedSeconds;
      const autoRun =
        next === "FIRST_HALF" ||
        next === "SECOND_HALF" ||
        next === "EXTRA_TIME_1" ||
        next === "EXTRA_TIME_2";
      // Keep the master clock alive during the break so the referee can see
      // how long the team has been off the field. Pitch animations remain
      // paused because isRunning below only reflects playing stages.
      const clockRuns = autoRun || next === "BREAK";

      if (next === "FULL_TIME") {
        // Compile final runtimes into the season-cumulative counters.
        flushPlayerCumulatives(
          playersRef.current.map((p) => ({
            playerId: p.playerId,
            totalSeconds: p.totalSeconds,
            goals: p.goals,
          })),
        ).catch(() => {});
      }

      if (next === "SECOND_HALF" || next === "EXTRA_TIME_2") {
        // A new half changes ends, but the coach's tactical layout stays put.
        toggleOrientationOnly();
      }

      if (next === "FULL_TIME") {
        updateMatch(m.id, {
          currentStage: next,
          isClockActive: false,
          stageStartSeconds: now,
          completedAt: new Date().toISOString(),
        }).catch(() => {});
      } else {
        updateMatch(m.id, {
          currentStage: next,
          isClockActive: clockRuns,
          stageStartSeconds: now,
        }).catch(() => {});
      }
      setMatch((prev) =>
        prev
          ? {
              ...prev,
              currentStage: next,
              isClockActive: next === "FULL_TIME" ? false : clockRuns,
              stageStartSeconds: now,
              completedAt:
                next === "FULL_TIME"
                  ? new Date().toISOString()
                  : prev.completedAt,
            }
          : prev,
      );
    },
    [toggleOrientationOnly],
  );

  // ---- Two-tap substitution engine (§4 Rule A) ----
  const selectPlayer = useCallback(
    (id: string) => {
      const target = playersRef.current.find((p) => p.playerId === id);
      if (!target) return;
      if (target.sentOff) {
        showNotice(`${target.playerName} is sent off — cannot play`);
        return;
      }
      if (selectionId === id) {
        setSelectionId(null); // second tap on self = toggle off
        return;
      }
      if (selectionId === null) {
        setSelectionId(id); // first tap: arm the cursor
        return;
      }
      // Second tap: execute the swap.
      const sel = playersRef.current.find((p) => p.playerId === selectionId);
      if (!sel) {
        setSelectionId(null);
        return;
      }
      if (target.status === "bench") {
        // Switching the cursor to another bench/roster player.
        setSelectionId(id);
      } else if (sel.status === "bench") {
        // Substitution: bench player replaces the field player.
        applySubstitution(sel, target);
      } else {
        // Position swap between two live players.
        swapFieldPositions(sel, target);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectionId],
  );

  const applySubstitution = useCallback(
    (incoming: MatchPlayer, exiting: MatchPlayer) => {
      const m = matchRef.current;
      if (!m) return;
      const now = m.elapsedSeconds;
      const exitingTotal = exiting.totalSeconds + exiting.shiftSeconds;

      const updatedExiting: MatchPlayer = {
        ...exiting,
        status: "bench" as PlayerStatus,
        shiftSeconds: 0,
        shiftStartSeconds: null,
        benchStartSeconds: now, // bench stint starts the moment they sit down
        xPct: null,
        yPct: null,
        totalSeconds: exitingTotal,
      };
      const updatedIncoming: MatchPlayer = {
        ...incoming,
        status: "field" as PlayerStatus,
        shiftSeconds: 0,
        shiftStartSeconds: now,
        benchStartSeconds: null,
        xPct: exiting.xPct,
        yPct: exiting.yPct,
      };
      upsertMatchPlayer(m.id, updatedExiting).catch(() => {});
      upsertMatchPlayer(m.id, updatedIncoming).catch(() => {});
      setPlayers((prev) =>
        prev.map((p) =>
          p.playerId === exiting.playerId
            ? updatedExiting
            : p.playerId === incoming.playerId
              ? updatedIncoming
              : p,
        ),
      );
      setSelectionId(null);
    },
    [],
  );

  const swapFieldPositions = useCallback((a: MatchPlayer, b: MatchPlayer) => {
    const m = matchRef.current;
    if (!m) return;
    const updatedA = { ...a, xPct: b.xPct, yPct: b.yPct };
    const updatedB = { ...b, xPct: a.xPct, yPct: a.yPct };
    upsertMatchPlayer(m.id, updatedA).catch(() => {});
    upsertMatchPlayer(m.id, updatedB).catch(() => {});
    setPlayers((prev) =>
      prev.map((p) =>
        p.playerId === a.playerId
          ? updatedA
          : p.playerId === b.playerId
            ? updatedB
            : p,
      ),
    );
    setSelectionId(null);
  }, []);

  /** Second tap on empty pitch ground / boundary check (§4 Rule C). */
  const tapPitch = useCallback(
    (xPct: number, yPct: number, inTechnicalArea: boolean) => {
      const m = matchRef.current;
      const sel = playersRef.current.find((p) => p.playerId === selectionId);
      if (!m || !sel) return;
      if (inTechnicalArea) {
        showNotice("Players cannot enter the technical area");
        return;
      }
      if (sel.sentOff) {
        showNotice(`${sel.playerName} is sent off — cannot play`);
        return;
      }
      const now = m.elapsedSeconds;
      const updated: MatchPlayer = {
        ...sel,
        status: "field" as PlayerStatus,
        shiftStartSeconds: sel.status === "bench" ? now : sel.shiftStartSeconds,
        shiftSeconds: sel.status === "bench" ? 0 : sel.shiftSeconds,
        benchStartSeconds: null, // off the bench — bench stint ends
        xPct,
        yPct,
      };
      upsertMatchPlayer(m.id, updated).catch(() => {});
      setPlayers((prev) =>
        prev.map((p) => (p.playerId === sel.playerId ? updated : p)),
      );
      setSelectionId(null);
    },
    [selectionId, showNotice],
  );

  // ---- Goals ----
  const registerGoal = useCallback(
    (type: MatchEventType, scorerId: string | null) => {
      const m = matchRef.current;
      if (!m) return;
      addMatchEvent(m.id, m.elapsedSeconds, type, scorerId).then((ev) => {
        setEvents((prev) => [...prev, ev]);
      });
      if (type === "GOAL_HOME") {
        updateMatch(m.id, { homeScore: m.homeScore + 1 }).catch(() => {});
        setMatch((prev) =>
          prev ? { ...prev, homeScore: prev.homeScore + 1 } : prev,
        );
      } else {
        updateMatch(m.id, { awayScore: m.awayScore + 1 }).catch(() => {});
        setMatch((prev) =>
          prev ? { ...prev, awayScore: prev.awayScore + 1 } : prev,
        );
      }
      // A scorer selected for our team gets credit whether we are home or away.
      if (scorerId) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.playerId === scorerId ? { ...p, goals: p.goals + 1 } : p,
          ),
        );
      }
    },
    [],
  );

  // ---- Cards ----
  const giveCard = useCallback((playerId: string, kind: "yellow" | "red") => {
    const m = matchRef.current;
    if (!m) return;
    const player = playersRef.current.find((p) => p.playerId === playerId);
    if (!player || player.sentOff) return;
    const now = m.elapsedSeconds;

    if (kind === "red" || player.yellowCards >= 1) {
      // Red card (or a 2nd yellow, which auto-converts): sent off for the
      // game — bench them, bank their minutes, and lock them out of play.
      const banked =
        player.status === "field"
          ? player.totalSeconds + player.shiftSeconds
          : player.totalSeconds;
      const updated: MatchPlayer = {
        ...player,
        status: "bench" as PlayerStatus,
        shiftSeconds: 0,
        shiftStartSeconds: null,
        benchStartSeconds: now,
        xPct: null,
        yPct: null,
        totalSeconds: banked,
        sentOff: true,
      };
      addMatchEvent(m.id, now, "RED_CARD", playerId).then((ev) =>
        setEvents((prev) => [...prev, ev]),
      );
      upsertMatchPlayer(m.id, updated).catch(() => {});
      setPlayers((prev) =>
        prev.map((p) => (p.playerId === playerId ? updated : p)),
      );
      setSelectionId((sel) => (sel === playerId ? null : sel));
    } else {
      const updated: MatchPlayer = {
        ...player,
        yellowCards: player.yellowCards + 1,
      };
      addMatchEvent(m.id, now, "YELLOW_CARD", playerId).then((ev) =>
        setEvents((prev) => [...prev, ev]),
      );
      upsertMatchPlayer(m.id, updated).catch(() => {});
      setPlayers((prev) =>
        prev.map((p) => (p.playerId === playerId ? updated : p)),
      );
    }
  }, []);

  // Manual flip (coin toss, corrections) — same engine as the auto flip.
  const flipField = useCallback(() => {
    applyFlip();
  }, [applyFlip]);

  // ---- §6.A Formation snap ----
  const applyFormation = useCallback((formation: Formation) => {
    const m = matchRef.current;
    if (!m) return;
    const roster = [...playersRef.current].sort(
      (a, b) => a.rosterOrder - b.rosterOrder,
    );
    const now = m.elapsedSeconds;
    let slotIndex = 0;
    const next = roster.map((p) => {
      if (!p.sentOff && slotIndex < formation.slots.length) {
        const slot = formation.slots[slotIndex++];
        return {
          ...p,
          status: "field" as PlayerStatus,
          xPct: slot.xPct,
          yPct: slot.yPct,
          shiftSeconds: p.status === "field" ? p.shiftSeconds : 0,
          shiftStartSeconds: p.status === "field" ? p.shiftStartSeconds : now,
          benchStartSeconds: null,
        };
      }
      return {
        ...p,
        status: "bench" as PlayerStatus,
        xPct: null,
        yPct: null,
        shiftSeconds: 0,
        shiftStartSeconds: null,
        benchStartSeconds: p.status === "field" ? now : p.benchStartSeconds,
      };
    });
    for (const p of next) {
      upsertMatchPlayer(m.id, p).catch(() => {});
    }
    updateMatch(m.id, { tacticalShape: formation.id }).catch(() => {});
    setMatch((prev) =>
      prev ? { ...prev, tacticalShape: formation.id } : prev,
    );
    setPlayers(next);
  }, []);

  // ---- §4 Rule B: late arrival entry ----
  const addLateArrival = useCallback(
    async (name: string, jerseyNumber: number): Promise<Player> => {
      const m = matchRef.current;
      if (!m) return Promise.reject(new Error("No active match"));
      const player = await addPlayer(m.seasonId, name, jerseyNumber);
      const maxOrder = playersRef.current.reduce(
        (max, p) => Math.max(max, p.rosterOrder),
        0,
      );
      await addLatePlayerToMatch(m.id, player, maxOrder + 1, m.elapsedSeconds);
      const mp: MatchPlayer = {
        matchId: m.id,
        playerId: player.id,
        playerName: player.name,
        jerseyNumber: player.jerseyNumber,
        avatarSeed: player.avatarSeed,
        xPct: null,
        yPct: null,
        status: "bench",
        shiftSeconds: 0,
        shiftStartSeconds: null,
        benchStartSeconds: m.elapsedSeconds, // bench stint from arrival
        totalSeconds: 0, // zero runtime footprint → head of the bench queue
        goals: 0,
        yellowCards: 0,
        sentOff: false,
        rosterOrder: maxOrder + 1,
      };
      setPlayers((prev) => [...prev, mp]);
      return player;
    },
    [],
  );

  // ---- Derived ----
  const fieldPlayers = useMemo(
    () => players.filter((p) => p.status === "field"),
    [players],
  );

  // §4 Rule B: persistent ascending chronological sort by cumulative playing time.
  const sortedBench = useMemo(
    () =>
      players
        .filter((p) => p.status === "bench")
        .sort(
          (a, b) =>
            (a.sentOff ? 1 : 0) - (b.sentOff ? 1 : 0) ||
            a.totalSeconds - b.totalSeconds ||
            a.rosterOrder - b.rosterOrder,
        ),
    [players],
  );

  const perHalfSeconds = match
    ? match.elapsedSeconds - match.stageStartSeconds
    : 0;

  // Fair-share target: planned match duration (halves + extra time) × field
  // slots ÷ rostered players. Stable during play — only shifts when a late
  // arrival joins, since the game duration is known up front.
  const fairShareSeconds =
    match && players.length > 0
      ? (plannedMatchSeconds(match) * FIELD_SLOTS[match.gameFormat]) /
        players.length
      : 0;
  // Stoppage time applies to regulation halves and extra-time halves alike.
  const inStoppage =
    !!match &&
    (match.currentStage === "FIRST_HALF" ||
      match.currentStage === "SECOND_HALF" ||
      match.currentStage === "EXTRA_TIME_1" ||
      match.currentStage === "EXTRA_TIME_2") &&
    perHalfSeconds >=
      (match.currentStage.startsWith("EXTRA_TIME")
        ? match.extraTimeHalfMinutes
        : match.targetHalfMinutes) *
        60;

  const isPlayingStage =
    match?.currentStage === "FIRST_HALF" ||
    match?.currentStage === "SECOND_HALF" ||
    match?.currentStage === "EXTRA_TIME_1" ||
    match?.currentStage === "EXTRA_TIME_2";

  const value = useMemo<MatchContextValue>(
    () => ({
      match,
      players,
      events,
      selectionId,
      notice,
      fieldPlayers,
      sortedBench,
      perHalfSeconds,
      inStoppage,
      isRunning: Boolean(match?.isClockActive && isPlayingStage),
      fairShareSeconds,
      startClock,
      stopClock,
      transitionStage,
      selectPlayer,
      clearSelection: () => setSelectionId(null),
      tapPitch,
      registerGoal,
      giveCard,
      flipField,
      applyFormation,
      addLateArrival,
      showNotice,
    }),
    [
      match,
      players,
      events,
      selectionId,
      notice,
      fieldPlayers,
      sortedBench,
      perHalfSeconds,
      inStoppage,
      isPlayingStage,
      fairShareSeconds,
      startClock,
      stopClock,
      transitionStage,
      selectPlayer,
      tapPitch,
      registerGoal,
      giveCard,
      flipField,
      applyFormation,
      addLateArrival,
      showNotice,
    ],
  );

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
}
