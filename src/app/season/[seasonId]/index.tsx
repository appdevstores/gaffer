// Season dashboard: roster with season-cumulative stats, match history,
// live-match resume, and entry points to setup / storage management.

import { setMetaValue } from "@/core/db";
import {
  deletePlayer,
  findLiveMatch,
  getSeason,
  listMatches,
  listPlayers,
  stopSeason,
} from "@/core/repo";
import type { MatchSession, Player, Season } from "@/core/types";
import { avatarColor, avatarInitials } from "@/lib/avatars";
import { formatClock, STAGE_LABELS } from "@/lib/mailto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SeasonDashboard() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [season, setSeason] = useState<Season | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchSession[]>([]);
  const [liveMatch, setLiveMatch] = useState<MatchSession | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);

  const refresh = useCallback(async () => {
    if (!seasonId) return;
    const [s, ps, ms, live] = await Promise.all([
      getSeason(seasonId),
      listPlayers(seasonId),
      listMatches(seasonId),
      findLiveMatch(seasonId),
    ]);
    setSeason(s);
    setPlayers(ps);
    setMatches(ms);
    setLiveMatch(live);
  }, [seasonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStop = () => {
    if (!season) return;
    setConfirmStop(true);
  };

  const confirmStopSeason = async () => {
    if (!season) return;
    await stopSeason(season.id);
    await setMetaValue("active_season_id", "");
    setConfirmStop(false);
    router.replace("/");
  };

  const removePlayer = (p: Player) => {
    Alert.alert(
      `Remove ${p.name}?`,
      "They will be deleted from this season’s roster.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (seasonId) await deletePlayer(seasonId, p.id);
            refresh();
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/")} hitSlop={8}>
          <Text style={styles.back}>‹ Seasons</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.seasonName}>{season?.name ?? "…"}</Text>
          {season?.isActive ? (
            <Text style={styles.activePill}>● ACTIVE</Text>
          ) : (
            <Text style={styles.frozenPill}>FROZEN</Text>
          )}
        </View>
        {season?.isActive && (
          <Pressable style={styles.stopBtn} onPress={handleStop}>
            <Text style={styles.stopBtnText}>Stop</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {liveMatch && (
          <Pressable
            style={styles.liveBanner}
            onPress={() =>
              router.push(`/season/${seasonId}/match/${liveMatch.id}`)
            }
          >
            <Text style={styles.liveBannerTitle}>▶ LIVE MATCH IN PROGRESS</Text>
            <Text style={styles.liveBannerMeta}>
              {liveMatch.teamName}{" "}
              {liveMatch.teamSide === "HOME"
                ? liveMatch.homeScore
                : liveMatch.awayScore}{" "}
              –{" "}
              {liveMatch.teamSide === "HOME"
                ? liveMatch.awayScore
                : liveMatch.homeScore}{" "}
              {liveMatch.opponentName} · {STAGE_LABELS[liveMatch.currentStage]}
            </Text>
            <Text style={styles.liveBannerTap}>Tap to resume</Text>
          </Pressable>
        )}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={() => router.push(`/season/${seasonId}/teams`)}
          >
            <Text style={styles.actionText}>👥 Teams</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionSecondary]}
            onPress={() => router.push(`/season/${seasonId}/setup-match`)}
          >
            <Text style={styles.actionText}>+ New Match</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionSecondary]}
            onPress={() => router.push(`/season/${seasonId}/storage`)}
          >
            <Text style={styles.actionText}>🧹 Storage</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Roster ({players.length})</Text>
        <View style={styles.card}>
          {players.length === 0 && (
            <Text style={styles.empty}>
              No players yet — add them during Match Setup.
            </Text>
          )}
          {players.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: avatarColor(p.avatarSeed) },
                ]}
              >
                <Text style={styles.avatarText}>{avatarInitials(p.name)}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {p.name} <Text style={styles.jersey}>#{p.jerseyNumber}</Text>
                </Text>
                <Text style={styles.playerMeta}>
                  {formatClock(p.totalSeconds)} played · {p.matchGoals} goal
                  {p.matchGoals === 1 ? "" : "s"}
                </Text>
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => removePlayer(p)}
                hitSlop={8}
              >
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Match History ({matches.length})
        </Text>
        <View style={styles.card}>
          {matches.length === 0 && (
            <Text style={styles.empty}>No matches yet.</Text>
          )}
          {matches.map((m) => (
            <Pressable
              key={m.id}
              style={styles.matchRow}
              onPress={() => router.push(`/season/${seasonId}/match/${m.id}`)}
            >
              <View style={styles.matchInfo}>
                <Text style={styles.matchTeams}>
                  {m.teamName}{" "}
                  {m.teamSide === "HOME" ? m.homeScore : m.awayScore} –{" "}
                  {m.teamSide === "HOME" ? m.awayScore : m.homeScore}{" "}
                  {m.opponentName}
                </Text>
                <Text style={styles.matchMeta}>
                  {new Date(m.startedAt).toLocaleDateString()} · {m.gameFormat}{" "}
                  · {STAGE_LABELS[m.currentStage]}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {confirmStop && (
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Stop this season?</Text>
            <Text style={styles.confirmBody}>
              {season?.name} will be marked inactive and its history will be
              frozen.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmCancel}
                onPress={() => setConfirmStop(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmStop} onPress={confirmStopSeason}>
                <Text style={styles.confirmStopText}>Stop Season</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  back: {
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  seasonName: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  activePill: {
    color: "#4ade80",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  frozenPill: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "800",
  },
  stopBtn: {
    backgroundColor: "#7f1d1d",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stopBtnText: {
    color: "#fecaca",
    fontSize: 11,
    fontWeight: "800",
  },
  body: {
    paddingBottom: 30,
  },
  liveBanner: {
    backgroundColor: "#14532d",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#22c55e",
    padding: 14,
    marginBottom: 12,
  },
  liveBannerTitle: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  liveBannerMeta: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  liveBannerTap: {
    color: "#86efac",
    fontSize: 11,
    marginTop: 3,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  actionPrimary: {
    backgroundColor: "#16a34a",
  },
  actionSecondary: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 18,
    overflow: "hidden",
  },
  empty: {
    color: "#475569",
    fontSize: 13,
    padding: 14,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e293b",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "700",
  },
  jersey: {
    color: "#64748b",
    fontSize: 12,
  },
  playerMeta: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e293b",
  },
  matchInfo: {
    flex: 1,
  },
  matchTeams: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "700",
  },
  matchMeta: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: "#475569",
    fontSize: 18,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 20,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 18,
  },
  confirmTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  confirmBody: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  confirmCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmCancelText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  confirmStop: {
    backgroundColor: "#991b1b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmStopText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
