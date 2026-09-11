// §7.B Cascading Space Eraser — select historic match records to wipe from
// device memory. The purge cycle deletes the match plus every dependent row
// (players-in-match, events) inside one transaction so no residual trace files
// linger.

import {
  getSeason,
  listMatches,
  purgeSeason,
  purgeStoredMatch,
} from "@/core/repo";
import type { MatchSession, Season } from "@/core/types";
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

export default function StorageScreen() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const router = useRouter();
  const [season, setSeason] = useState<Season | null>(null);
  const [matches, setMatches] = useState<MatchSession[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!seasonId) return;
    const [s, ms] = await Promise.all([
      getSeason(seasonId),
      listMatches(seasonId),
    ]);
    setSeason(s);
    setMatches(ms);
  }, [seasonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === matches.length
        ? new Set()
        : new Set(matches.map((m) => m.id)),
    );
  };

  const handlePurge = () => {
    const count = selected.size;
    if (count === 0) return;
    Alert.alert(
      `Delete ${count} match${count === 1 ? "" : "es"}?`,
      "Match sessions, player runtime records, and events will be wiped from device storage. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            for (const id of selected) {
              await purgeStoredMatch(id);
            }
            setSelected(new Set());
            refresh();
          },
        },
      ],
    );
  };

  const handlePurgeSeason = () => {
    if (!season) return;
    Alert.alert(
      `Delete entire season "${season.name}"?`,
      "All seasons, players, matches, and events for this profile will be erased from device memory. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await purgeSeason(season.id);
            router.replace("/");
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.body}>
      <Text style={styles.intro}>
        Select historic matches to wipe device memory. Each deletion runs a
        clean cleanup cycle across all related keys — zero residual traces.
      </Text>

      <View style={styles.card}>
        <Pressable style={styles.selectAllRow} onPress={toggleAll}>
          <Text style={styles.selectAllText}>
            {selected.size === matches.length ? "Deselect all" : "Select all"} (
            {matches.length})
          </Text>
        </Pressable>
        {matches.length === 0 && (
          <Text style={styles.empty}>No stored matches for this season.</Text>
        )}
        {matches.map((m) => {
          const checked = selected.has(m.id);
          return (
            <Pressable
              key={m.id}
              style={styles.matchRow}
              onPress={() => toggle(m.id)}
            >
              <View
                style={[styles.checkbox, checked && styles.checkboxChecked]}
              >
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchTeams}>
                  {m.teamName}{" "}
                  {m.teamSide === "HOME" ? m.homeScore : m.awayScore} –{" "}
                  {m.teamSide === "HOME" ? m.awayScore : m.homeScore}{" "}
                  {m.opponentName}
                </Text>
                <Text style={styles.matchMeta}>
                  {new Date(m.startedAt).toLocaleDateString()} · {m.gameFormat}{" "}
                  ·{" "}
                  {m.currentStage === "FULL_TIME" ? "completed" : "in progress"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[
          styles.purgeBtn,
          selected.size === 0 && styles.purgeBtnDisabled,
        ]}
        onPress={handlePurge}
        disabled={selected.size === 0}
      >
        <Text style={styles.purgeBtnText}>
          🗑 Delete {selected.size > 0 ? `${selected.size} selected` : ""}
        </Text>
      </Pressable>

      <Pressable style={styles.dangerZone} onPress={handlePurgeSeason}>
        <Text style={styles.dangerZoneText}>
          Delete entire season (all data)
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  body: {
    padding: 14,
    paddingBottom: 40,
  },
  intro: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 14,
    overflow: "hidden",
  },
  selectAllRow: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e293b",
  },
  selectAllText: {
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: "700",
  },
  empty: {
    color: "#475569",
    fontSize: 13,
    padding: 14,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e293b",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#475569",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
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
  purgeBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  purgeBtnDisabled: {
    backgroundColor: "#1e293b",
  },
  purgeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  dangerZone: {
    marginTop: 22,
    alignItems: "center",
    paddingVertical: 10,
  },
  dangerZoneText: {
    color: "#7f1d1d",
    fontSize: 12,
    fontWeight: "700",
  },
});
