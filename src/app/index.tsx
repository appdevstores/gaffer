// §3 Step 1 — The Season Lifecycle Gate Launcher.
// On launch the app evaluates local storage and presents: Start a New Season,
// Open an Existing Season, or Season Lifecycle End (Stop Season).

import { getMetaValue, setMetaValue } from "@/core/db";
import { isPremiumUnlocked } from "@/core/premium";
import { createSeason, createTeam, listSeasons, stopSeason } from "@/core/repo";
import type { Season as SeasonType } from "@/core/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SeasonGate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [seasons, setSeasons] = useState<SeasonType[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [confirmStop, setConfirmStop] = useState<SeasonType | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, active] = await Promise.all([
        listSeasons(),
        getMetaValue("active_season_id"),
      ]);
      setSeasons(list);
      setActiveSeasonId(active);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const openSeason = async (s: SeasonType) => {
    await setMetaValue("active_season_id", s.id);
    router.push(`/season/${s.id}`);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    const team = newTeamName.trim();
    if (!name || !team) return;
    const season = await createSeason(name);
    await createTeam(season.id, team, 20);
    await setMetaValue("active_season_id", season.id);
    await setMetaValue("remembered_team_name", team);
    setShowNew(false);
    setNewName("");
    setNewTeamName("");
    router.push(`/season/${season.id}/teams`);
  };

  const handleStopSeason = (s: SeasonType) => {
    setConfirmStop(s);
  };

  const confirmStopSeason = async () => {
    if (!confirmStop) return;
    await stopSeason(confirmStop.id);
    if (activeSeasonId === confirmStop.id)
      await setMetaValue("active_season_id", "");
    setConfirmStop(null);
    refresh();
  };

  const activeSeasons = seasons.filter((s) => s.isActive);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <Image
        source={require("../../assets/images/gaffer-logo.png")}
        style={styles.logoImage}
        accessibilityLabel="Gaffer logo"
      />
      <Text style={styles.tagline}>Tactical match-day manager</Text>
      {!isPremiumUnlocked() && (
        <Text style={styles.premiumLock}>
          🔒 Premium required for this build
        </Text>
      )}

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {activeSeasons.length > 0 && (
          <View style={styles.resumeGroup}>
            <Text style={styles.resumeGroupTitle}>
              Active Seasons ({activeSeasons.length})
            </Text>
            {activeSeasons.map((s) => (
              <Pressable
                key={s.id}
                style={styles.resumeCard}
                onPress={() => openSeason(s)}
              >
                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeName}>{s.name}</Text>
                  <Text style={styles.resumeMeta}>
                    Active since {new Date(s.startDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.resumeArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          style={styles.primaryButton}
          onPress={() => setShowNew(true)}
        >
          <Text style={styles.primaryButtonText}>+ Start a New Season</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Previous Seasons</Text>
        {!loaded && <Text style={styles.empty}>Loading…</Text>}
        {loaded && seasons.length === 0 && (
          <Text style={styles.empty}>
            No seasons yet. Create one to get started.
          </Text>
        )}
        {seasons.map((s) => (
          <View key={s.id} style={styles.seasonRow}>
            <Pressable style={styles.seasonMain} onPress={() => openSeason(s)}>
              <View style={styles.seasonInfo}>
                <Text style={styles.seasonName}>
                  {s.name}
                  {s.isActive && (
                    <Text style={styles.activeBadge}> ACTIVE</Text>
                  )}
                </Text>
                <Text style={styles.seasonMeta}>
                  {new Date(s.startDate).toLocaleDateString()}
                  {s.endDate
                    ? ` — ${new Date(s.endDate).toLocaleDateString()}`
                    : " — ongoing"}
                </Text>
              </View>
            </Pressable>
            {s.isActive && (
              <Pressable
                style={styles.stopButton}
                onPress={() => handleStopSeason(s)}
              >
                <Text style={styles.stopButtonText}>Stop</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showNew} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start a New Season</Text>
            <TextInput
              style={styles.input}
              placeholder="Season name (e.g. Fall 2026 Rec)"
              placeholderTextColor="#64748b"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="next"
            />
            <TextInput
              style={[styles.input, styles.teamInput]}
              placeholder="Your team name (e.g. Hedgehogs)"
              placeholderTextColor="#64748b"
              value={newTeamName}
              onChangeText={setNewTeamName}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowNew(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleCreate}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmStop !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmStop(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Stop this season?</Text>
            <Text style={styles.confirmBody}>
              {confirmStop?.name} will be marked inactive and its history will
              be frozen.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setConfirmStop(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.stopConfirm} onPress={confirmStopSeason}>
                <Text style={styles.stopConfirmText}>Stop Season</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 18,
    alignSelf: "center",
    marginBottom: 8,
  },
  tagline: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  premiumLock: {
    color: "#fbbf24",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    paddingBottom: 24,
  },
  resumeGroup: {
    marginBottom: 16,
  },
  resumeGroupTitle: {
    color: "#86efac",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#166534",
    padding: 14,
    marginBottom: 10,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  resumeMeta: {
    color: "#86efac",
    fontSize: 11,
    marginTop: 2,
  },
  resumeArrow: {
    color: "#86efac",
    fontSize: 20,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 22,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
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
  empty: {
    color: "#475569",
    fontSize: 13,
    marginVertical: 8,
  },
  seasonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 8,
    overflow: "hidden",
  },
  seasonMain: {
    flex: 1,
    padding: 12,
  },
  seasonInfo: {
    flex: 1,
  },
  seasonName: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "800",
  },
  activeBadge: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "800",
  },
  seasonMeta: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  stopButton: {
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: "#fecaca",
    fontSize: 11,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 18,
  },
  modalTitle: {
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f1f5f9",
    fontSize: 14,
  },
  teamInput: {
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBody: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  stopConfirm: {
    backgroundColor: "#991b1b",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  stopConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  modalConfirm: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
