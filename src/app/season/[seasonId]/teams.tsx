import {
  addPlayer,
  createTeam,
  listPlayers,
  listTeams,
  updateTeam,
} from "@/core/repo";
import type { GameFormat, Player, Team } from "@/core/types";
import { GAME_FORMATS } from "@/lib/formations";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function TeamsScreen() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState("");
  const [halfMinutes, setHalfMinutes] = useState("20");
  const [gameFormat, setGameFormat] = useState<GameFormat>("7v7");
  const [playerName, setPlayerName] = useState("");
  const [jersey, setJersey] = useState("");

  const refresh = useCallback(async () => {
    if (!seasonId) return;
    const next = await listTeams(seasonId);
    setTeams(next);
    const active = selected
      ? (next.find((t) => t.id === selected.id) ?? next[0])
      : next[0];
    if (active) {
      setSelected(active);
      setTeamName(active.name);
      setHalfMinutes(String(active.defaultHalfMinutes));
      setGameFormat(active.defaultGameFormat);
      setPlayers(await listPlayers(seasonId, active.id));
    }
  }, [seasonId, selected?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const chooseTeam = async (team: Team) => {
    setSelected(team);
    setTeamName(team.name);
    setHalfMinutes(String(team.defaultHalfMinutes));
    setGameFormat(team.defaultGameFormat);
    if (seasonId) setPlayers(await listPlayers(seasonId, team.id));
  };

  const addTeam = async () => {
    if (!seasonId || !teamName.trim()) return;
    const team = await createTeam(
      seasonId,
      teamName,
      Math.max(1, parseInt(halfMinutes, 10) || 20),
      gameFormat,
    );
    setTeams((prev) => [...prev, team]);
    setSelected(team);
    setPlayers([]);
    setTeamName("");
  };

  const saveTeam = async () => {
    if (!selected) return;
    await updateTeam(selected.id, {
      name: teamName,
      defaultHalfMinutes: Math.max(1, parseInt(halfMinutes, 10) || 20),
      defaultGameFormat: gameFormat,
    });
    refresh();
  };

  const addRosterPlayer = async () => {
    if (!seasonId || !selected || !playerName.trim()) return;
    await addPlayer(
      seasonId,
      playerName,
      parseInt(jersey, 10) || 0,
      selected.id,
    );
    setPlayerName("");
    setJersey("");
    setPlayers(await listPlayers(seasonId, selected.id));
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Season</Text>
        </Pressable>
        <Text style={styles.title}>Teams</Text>
        <View style={{ width: 60 }} />
      </View>
      <Text style={styles.subtitle}>
        Set up each team's roster and default half length before match day.
      </Text>

      <Text style={styles.section}>Teams in this season</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.teamRow}
      >
        {teams.map((team) => (
          <Pressable
            key={team.id}
            style={[
              styles.teamChip,
              selected?.id === team.id && styles.teamChipActive,
            ]}
            onPress={() => chooseTeam(team)}
          >
            <Text
              style={[
                styles.teamChipText,
                selected?.id === team.id && styles.teamChipTextActive,
              ]}
            >
              {team.name}
            </Text>
            <Text style={styles.teamChipMeta}>
              {team.defaultHalfMinutes} min halves
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.section}>
          {selected ? `Edit ${selected.name}` : "Add a team"}
        </Text>
        <TextInput
          style={styles.input}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Team name"
          placeholderTextColor="#64748b"
        />
        <Text style={styles.label}>Default half length (minutes)</Text>
        <TextInput
          style={styles.input}
          value={halfMinutes}
          onChangeText={setHalfMinutes}
          keyboardType="number-pad"
        />
        <Text style={styles.label}>Default game format</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.formatRow}
        >
          {GAME_FORMATS.map((format) => (
            <Pressable
              key={format}
              onPress={() => setGameFormat(format)}
              style={[
                styles.formatChip,
                gameFormat === format && styles.formatChipActive,
              ]}
            >
              <Text
                style={[
                  styles.formatText,
                  gameFormat === format && styles.formatTextActive,
                ]}
              >
                {format}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={styles.primary}
          onPress={selected ? saveTeam : addTeam}
        >
          <Text style={styles.primaryText}>
            {selected ? "Save Team Settings" : "+ Add Team"}
          </Text>
        </Pressable>
      </View>

      {selected && (
        <View style={styles.card}>
          <View style={styles.rosterHeader}>
            <Text style={styles.section}>Roster ({players.length})</Text>
            <Text style={styles.meta}>{selected.name}</Text>
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Player name"
              placeholderTextColor="#64748b"
              onSubmitEditing={addRosterPlayer}
            />
            <TextInput
              style={[styles.input, styles.jersey]}
              value={jersey}
              onChangeText={setJersey}
              placeholder="#"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              onSubmitEditing={addRosterPlayer}
            />
            <Pressable style={styles.addButton} onPress={addRosterPlayer}>
              <Text style={styles.primaryText}>Add</Text>
            </Pressable>
          </View>
          {players.map((p) => (
            <View key={p.id} style={styles.player}>
              <Text style={styles.playerName}>{p.name}</Text>
              <Text style={styles.playerMeta}>#{p.jerseyNumber}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.matchButton}
        onPress={() => router.push(`/season/${seasonId}/setup-match`)}
      >
        <Text style={styles.primaryText}>Set Up New Match →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: { color: "#60a5fa", fontWeight: "700" },
  title: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginBottom: 18 },
  section: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  teamRow: { gap: 8, paddingBottom: 14 },
  teamChip: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
    minWidth: 120,
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  teamChipActive: { backgroundColor: "#14532d", borderColor: "#4ade80" },
  teamChipText: { color: "#cbd5e1", fontWeight: "800" },
  teamChipTextActive: { color: "#fff" },
  teamChipMeta: { color: "#64748b", fontSize: 10, marginTop: 3 },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 9,
    padding: 10,
    color: "#f8fafc",
    fontSize: 14,
    marginBottom: 8,
  },
  label: { color: "#94a3b8", fontSize: 11, marginBottom: 5 },
  formatRow: { gap: 6, paddingBottom: 8 },
  formatChip: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formatChipActive: { backgroundColor: "#1d4ed8", borderColor: "#60a5fa" },
  formatText: { color: "#cbd5e1", fontSize: 11, fontWeight: "800" },
  formatTextActive: { color: "#fff" },
  primary: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    alignItems: "center",
    padding: 12,
    marginTop: 4,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  rosterHeader: { flexDirection: "row", justifyContent: "space-between" },
  meta: { color: "#64748b", fontSize: 11 },
  addRow: { flexDirection: "row", gap: 6 },
  jersey: { width: 48, textAlign: "center" },
  addButton: {
    backgroundColor: "#0f766e",
    borderRadius: 9,
    padding: 11,
    marginBottom: 8,
  },
  player: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1e293b",
    paddingVertical: 9,
  },
  playerName: { color: "#f1f5f9", fontWeight: "700" },
  playerMeta: { color: "#94a3b8" },
  matchButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    padding: 14,
  },
});
