// §7.A Full-time report: compiled match data, routed to the system email
// client via a mailto: link — zero servers involved.

import { buildMatchSummary, formatClock, sendMatchSummary } from "@/lib/mailto";
import { useMatch } from "@/state/MatchProvider";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MatchSummary() {
  const { match, players, events } = useMatch();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!match) return null;

  const scorers = new Map<string, number>();
  for (const p of players) {
    if (p.goals > 0) scorers.set(p.playerName, p.goals);
  }

  const ranked = [...players].sort(
    (a, b) =>
      b.totalSeconds - a.totalSeconds ||
      a.playerName.localeCompare(b.playerName),
  );

  const handleEmail = async () => {
    setSending(true);
    setError(null);
    try {
      await sendMatchSummary(match, players, events);
    } catch {
      setError("Could not open the email app. Summary copied below.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Full Time</Text>
      <Text style={styles.final}>
        {match.teamName}{" "}
        {match.teamSide === "HOME" ? match.homeScore : match.awayScore} –{" "}
        {match.teamSide === "HOME" ? match.awayScore : match.homeScore}{" "}
        {match.opponentName}
      </Text>
      <Text style={styles.subtitle}>
        {match.gameFormat} · {match.tacticalShape} · halves of{" "}
        {match.targetHalfMinutes} min
        {match.extraTimeEnabled &&
          ` · ET ${match.extraTimeHalves}×${match.extraTimeHalfMinutes}`}
      </Text>

      <Text style={styles.section}>Playing Time</Text>
      <View style={styles.table}>
        {ranked.map((p, i) => (
          <View
            key={p.playerId}
            style={[styles.row, i % 2 === 1 && styles.rowAlt]}
          >
            <Text style={styles.rowName}>
              {p.playerName}{" "}
              <Text style={styles.rowJersey}>#{p.jerseyNumber}</Text>
            </Text>
            <Text style={styles.rowTime}>{formatClock(p.totalSeconds)}</Text>
            {p.goals > 0 && <Text style={styles.rowGoals}>⚽ {p.goals}</Text>}
            {p.sentOff ? (
              <Text style={styles.rowCards}>🟥</Text>
            ) : (
              p.yellowCards > 0 && (
                <Text style={styles.rowCards}>
                  {"🟨".repeat(p.yellowCards)}
                </Text>
              )
            )}
          </View>
        ))}
        {ranked.length === 0 && (
          <Text style={styles.empty}>No players in this match.</Text>
        )}
      </View>

      <Text style={styles.section}>Match Events</Text>
      <View style={styles.table}>
        {events.length === 0 && (
          <Text style={styles.empty}>No events recorded.</Text>
        )}
        {events.map((e) => {
          const player = e.playerScorerId
            ? players.find((p) => p.playerId === e.playerScorerId)
            : null;
          const name = player?.playerName ?? null;
          return (
            <View key={e.id} style={styles.row}>
              <Text style={styles.rowName}>
                {e.type === "GOAL_HOME" && `⚽ ${name ?? "Home goal"}`}
                {e.type === "GOAL_AWAY" && "⚽ Away goal"}
                {e.type === "YELLOW_CARD" && `🟨 ${name ?? "?"} — yellow`}
                {e.type === "RED_CARD" && `🟥 ${name ?? "?"} — sent off`}
              </Text>
              <Text style={styles.rowTime}>
                {formatClock(e.timestampSeconds)}
              </Text>
            </View>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.emailButton}
        onPress={handleEmail}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.emailButtonText}>✉️ Email Match Report</Text>
        )}
      </Pressable>

      <Text style={styles.rawPreview} selectable>
        {buildMatchSummary(match, players, events)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: "#86efac",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  final: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 6,
  },
  table: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowAlt: {
    backgroundColor: "rgba(30,41,59,0.5)",
  },
  rowName: {
    flex: 1,
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "600",
  },
  rowJersey: {
    color: "#64748b",
    fontSize: 11,
  },
  rowTime: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginLeft: 8,
  },
  rowGoals: {
    color: "#fde047",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 10,
  },
  rowCards: {
    fontSize: 12,
    marginLeft: 8,
  },
  empty: {
    color: "#64748b",
    fontSize: 12,
    padding: 12,
  },
  error: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 10,
  },
  emailButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  emailButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  rawPreview: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 10,
    fontFamily: "monospace",
  },
});
