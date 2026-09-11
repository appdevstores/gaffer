// §7.A Non-Server System Email Client Routing.
//
// At FULL_TIME the match data is compiled into a plain-text payload and routed
// to the system email client via a mailto: link — zero cloud services, the
// payload never leaves the device except through the user's own mail app.

import type {
  MatchEvent,
  MatchPlayer,
  MatchSession,
  MatchStage,
} from "@/core/types";
import { Linking } from "react-native";

/** Human-readable stage names (shared by dashboard + summary). */
export const STAGE_LABELS: Record<MatchStage, string> = {
  PRE_MATCH: "Pre-match",
  FIRST_HALF: "1st half",
  BREAK: "Half-time",
  SECOND_HALF: "2nd half",
  EXTRA_TIME_1: "ET 1st half",
  EXTRA_TIME_BREAK: "ET break",
  EXTRA_TIME_2: "ET 2nd half",
  FULL_TIME: "Full time",
};

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playerLines(players: MatchPlayer[]): string {
  const sorted = [...players].sort(
    (a, b) =>
      b.totalSeconds - a.totalSeconds ||
      a.playerName.localeCompare(b.playerName),
  );
  return sorted
    .map((p) => {
      const cards = p.sentOff
        ? ", sent off 🟥"
        : p.yellowCards > 0
          ? `, ${p.yellowCards} yellow`
          : "";
      return (
        `• ${p.playerName} (#${p.jerseyNumber}) — ${formatClock(p.totalSeconds)} played` +
        (p.goals > 0 ? `, ${p.goals} goal${p.goals > 1 ? "s" : ""}` : "") +
        cards
      );
    })
    .join("\n");
}

function eventLines(
  events: MatchEvent[],
  scorerName: (id: string | null) => string,
): string {
  if (events.length === 0) return "No events recorded.";
  return events
    .map((e) => {
      const clock = formatClock(e.timestampSeconds);
      switch (e.type) {
        case "GOAL_HOME":
          return `⚽ ${clock} — ${scorerName(e.playerScorerId)} scores for HOME`;
        case "GOAL_AWAY":
          return `⚽ ${clock} — GOAL for AWAY`;
        case "YELLOW_CARD":
          return `🟨 ${clock} — ${scorerName(e.playerScorerId)} yellow card`;
        case "RED_CARD":
          return `🟥 ${clock} — ${scorerName(e.playerScorerId)} sent off`;
      }
    })
    .join("\n");
}

export function buildMatchSummary(
  match: MatchSession,
  players: MatchPlayer[],
  events: MatchEvent[],
): string {
  const scorerName = (id: string | null) => {
    if (!id) return "?";
    const p = players.find((x) => x.playerId === id);
    return p ? `${p.playerName} (#${p.jerseyNumber})` : "?";
  };

  const lines = [
    `Gaffer Match Summary Report`,
    `================================`,
    `Date: ${new Date(match.startedAt).toLocaleString()}`,
    `Match: ${match.teamName} vs ${match.opponentName}`,
    `Format: ${match.gameFormat} (${match.tacticalShape})`,
    `Final: ${match.teamSide === "HOME" ? match.homeScore : match.awayScore} – ${match.teamSide === "HOME" ? match.awayScore : match.homeScore}`,
    `Half length: ${match.targetHalfMinutes} min`,
    match.extraTimeEnabled
      ? `Extra time: ${match.extraTimeHalves} × ${match.extraTimeHalfMinutes} min`
      : null,
    ``,
    `Playing time`,
    `------------`,
    playerLines(players),
    ``,
    `Goals`,
    `-----`,
    eventLines(events, scorerName),
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

/** §7.A mailto routing — subject + body, straight to the system email client. */
export async function sendMatchSummary(
  match: MatchSession,
  players: MatchPlayer[],
  events: MatchEvent[],
): Promise<void> {
  const formattedSummaryString = buildMatchSummary(match, players, events);
  const mailtoLink = `mailto:?subject=Gaffer Match Summary Report&body=${encodeURIComponent(formattedSummaryString)}`;
  await Linking.openURL(mailtoLink);
}
