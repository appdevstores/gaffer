// §3 Steps 2 & 3 — Team Name Memory Capture + Fast-Focus Roster Compilation.
// - The team name is remembered globally; once captured it auto-populates every
//   future setup under this season profile (§3 Step 2 Memory Rule).
// - Submitting a roster entry clears the inputs and programmatically refocuses
//   the player name box for rapid-fire consecutive entry (§3 Step 3).

import FormationPicker from "@/components/FormationPicker";
import { getMetaValue, setMetaValue } from "@/core/db";
import {
  addPlayer,
  applyFormationSlots,
  createMatch,
  deletePlayer,
  listPlayers,
  listTeams,
  seedMatchPlayers,
} from "@/core/repo";
import type { GameFormat, Player, Team, TeamSide } from "@/core/types";
import { avatarColor, avatarInitials } from "@/lib/avatars";
import { getFormation } from "@/lib/formations";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SetupMatch() {
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const router = useRouter();

  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState("");
  const [rememberedTeamName, setRememberedTeamName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [teamSide, setTeamSide] = useState<TeamSide>("HOME");
  const [startError, setStartError] = useState<string | null>(null);
  const [format, setFormat] = useState<GameFormat>("7v7");
  const [formationId, setFormationId] = useState("1-2-3-1");
  const [halfMinutes, setHalfMinutes] = useState("20");
  const [etEnabled, setEtEnabled] = useState(false); // §space: default 'no'
  const [etMinutes, setEtMinutes] = useState("5");
  const [etHalves, setEtHalves] = useState("2");
  const [players, setPlayers] = useState<Player[]>([]);

  const [entryName, setEntryName] = useState("");
  const [entryJersey, setEntryJersey] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  const refreshPlayers = useCallback(async () => {
    if (!seasonId) return;
    const availableTeams = await listTeams(seasonId);
    setTeams(availableTeams);
    const selectedTeam =
      availableTeams.find((t) => t.id === teamId) ?? availableTeams[0];
    if (!selectedTeam) return;
    if (!teamId) {
      setTeamId(selectedTeam.id);
      setTeamName(selectedTeam.name);
      setFormat(selectedTeam.defaultGameFormat);
      setFormationId(getFormation(selectedTeam.defaultGameFormat, "").id);
      setHalfMinutes(String(selectedTeam.defaultHalfMinutes));
    }
    setPlayers(await listPlayers(seasonId, selectedTeam.id));
  }, [seasonId, teamId]);

  useEffect(() => {
    refreshPlayers();
    // §3 Step 2 Memory Rule: pull the remembered team name default.
    getMetaValue("remembered_team_name").then((remembered) => {
      if (remembered) {
        setRememberedTeamName(remembered);
      }
    });
  }, [refreshPlayers]);

  const rememberTeamName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (trimmed) await setMetaValue("remembered_team_name", trimmed);
  }, []);

  const submitPlayer = async () => {
    const name = entryName.trim();
    if (!name || !seasonId) return;
    if (!teamId) return;
    await addPlayer(seasonId, name, parseInt(entryJersey, 10) || 0, teamId);
    setEntryName("");
    setEntryJersey("");
    // §3 Step 3: clear input + FocusNode.requestFocus() back onto the name box.
    nameInputRef.current?.focus();
    refreshPlayers();
  };

  const changeFormat = (f: GameFormat) => {
    setFormat(f);
    // Reset the formation to the first option mapped to this game size.
    const first = getFormation(f, "");
    setFormationId(first.id);
  };

  const handleStart = async () => {
    if (!seasonId) return;
    setStartError(null);
    if (!teamId) {
      setStartError("Create a team in Team Manager first.");
      return;
    }
    if (!teamName.trim()) {
      setStartError("Tap your team name above to select it.");
      return;
    }
    const roster = await listPlayers(seasonId);
    if (roster.length === 0) {
      setStartError("Add at least one player to the roster first.");
      return;
    }
    const formation = getFormation(format, formationId);
    try {
      const match = await createMatch({
        seasonId,
        teamId,
        teamName,
        opponentName: opponentName.trim() || "Opponent",
        teamSide,
        gameFormat: format,
        tacticalShape: formation.id,
        targetHalfMinutes: Math.max(1, parseInt(halfMinutes, 10) || 20),
        extraTimeEnabled: etEnabled,
        extraTimeHalfMinutes: Math.max(1, parseInt(etMinutes, 10) || 5),
        extraTimeHalves: Math.min(2, Math.max(1, parseInt(etHalves, 10) || 2)),
      });
      await rememberTeamName(teamName);
      await seedMatchPlayers(match.id, roster);
      await applyFormationSlots(match.id, formation);
      router.replace(`/season/${seasonId}/match/${match.id}`);
    } catch (e) {
      setStartError("Could not start the match. Please try again.");
      console.error("Start match failed:", e);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>Step 2 · Teams</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Our Team</Text>
        {teams.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamChoices}
          >
            {teams.map((team) => (
              <Pressable
                key={team.id}
                style={[
                  styles.teamSuggestion,
                  teamId === team.id && styles.teamSuggestionActive,
                ]}
                onPress={() => {
                  setTeamId(team.id);
                  setTeamName(team.name);
                  setFormat(team.defaultGameFormat);
                  setFormationId(getFormation(team.defaultGameFormat, "").id);
                  setHalfMinutes(String(team.defaultHalfMinutes));
                  refreshPlayers();
                }}
              >
                <Text style={styles.teamSuggestionIcon}>
                  {teamId === team.id ? "✓" : "○"}
                </Text>
                <View>
                  <Text style={styles.teamSuggestionText}>{team.name}</Text>
                  <Text style={styles.teamSuggestionHint}>
                    {team.defaultHalfMinutes} min halves
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyTeam}>
            Add a team in Team Manager first.
          </Text>
        )}
        <Text style={styles.label}>Opponent Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Riverside FC"
          placeholderTextColor="#475569"
          value={opponentName}
          onChangeText={setOpponentName}
        />
        <Text style={styles.label}>We are</Text>
        <View style={styles.sideRow}>
          {(["HOME", "AWAY"] as TeamSide[]).map((side) => (
            <Pressable
              key={side}
              style={[
                styles.sideChip,
                teamSide === side && styles.sideChipActive,
              ]}
              onPress={() => setTeamSide(side)}
            >
              <Text
                style={[
                  styles.sideChipText,
                  teamSide === side && styles.sideChipTextActive,
                ]}
              >
                {side === "HOME" ? "Home" : "Away"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.stepTitle}>Match Settings</Text>
      <View style={styles.card}>
        <View style={styles.inheritedRow}>
          <Text style={styles.label}>Team format</Text>
          <Text style={styles.inheritedValue}>{format}</Text>
        </View>

        <View style={styles.formationWrap}>
          <FormationPicker
            format={format}
            currentId={formationId}
            onSelect={setFormationId}
          />
        </View>

        <View style={styles.inheritedRow}>
          <Text style={styles.label}>Team half length</Text>
          <Text style={styles.inheritedValue}>{halfMinutes} min</Text>
        </View>

        <View style={styles.etRow}>
          <View style={styles.etInfo}>
            <Text style={styles.etTitle}>Extra Time</Text>
            <Text style={styles.etHint}>
              For playoff matches · sides switch at each new half
            </Text>
          </View>
          <Pressable
            style={[styles.switch, etEnabled && styles.switchOn]}
            onPress={() => setEtEnabled((v) => !v)}
            accessibilityLabel="Toggle extra time"
          >
            <View
              style={[styles.switchKnob, etEnabled && styles.switchKnobOn]}
            />
          </Pressable>
        </View>

        {etEnabled && (
          <View style={styles.etOptions}>
            <View style={styles.etField}>
              <Text style={styles.label}>ET Half (min)</Text>
              <TextInput
                style={[styles.input, styles.etInput]}
                value={etMinutes}
                onChangeText={setEtMinutes}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.etField}>
              <Text style={styles.label}>Halves</Text>
              <View style={styles.etStepper}>
                {[1, 2].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setEtHalves(String(n))}
                    style={[
                      styles.etStepChip,
                      etHalves === String(n) && styles.etStepChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.etStepText,
                        etHalves === String(n) && styles.etStepTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.stepTitle}>Step 3 · Roster ({players.length})</Text>
      <View style={styles.card}>
        <View style={styles.entryRow}>
          <TextInput
            ref={nameInputRef}
            style={[styles.input, styles.nameInput]}
            placeholder="Player name"
            placeholderTextColor="#475569"
            value={entryName}
            onChangeText={setEntryName}
            onSubmitEditing={submitPlayer}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, styles.jerseyInput]}
            placeholder="#"
            placeholderTextColor="#475569"
            value={entryJersey}
            onChangeText={setEntryJersey}
            keyboardType="number-pad"
            onSubmitEditing={submitPlayer}
          />
          <Pressable style={styles.addBtn} onPress={submitPlayer}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        {players.length === 0 && (
          <Text style={styles.empty}>
            Add at least one player, then tap Start Match.
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
            <Text style={styles.playerName}>
              {p.name} <Text style={styles.jersey}>#{p.jerseyNumber}</Text>
            </Text>
            <Pressable
              style={styles.removeBtn}
              onPress={async () => {
                if (seasonId) await deletePlayer(seasonId, p.id);
                refreshPlayers();
              }}
              hitSlop={8}
            >
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {startError && <Text style={styles.startError}>{startError}</Text>}

      <Pressable style={styles.startBtn} onPress={handleStart}>
        <Text style={styles.startBtnText}>▶ Start Match</Text>
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
  stepTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    marginBottom: 14,
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 5,
  },
  teamChoices: {
    gap: 8,
    paddingBottom: 2,
  },
  teamSuggestion: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingHorizontal: 12,
  },
  teamSuggestionActive: {
    backgroundColor: "#14532d",
    borderColor: "#4ade80",
  },
  teamSuggestionIcon: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 9,
  },
  teamSuggestionText: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  teamSuggestionHint: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyTeam: {
    color: "#64748b",
    fontSize: 12,
    paddingVertical: 10,
  },
  sideRow: {
    flexDirection: "row",
    gap: 8,
  },
  sideChip: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingVertical: 10,
    alignItems: "center",
  },
  sideChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#60a5fa",
  },
  sideChipText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  sideChipTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f1f5f9",
    fontSize: 14,
  },
  halfInput: {
    width: 90,
  },
  etRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1e293b",
  },
  etInfo: {
    flex: 1,
    marginRight: 12,
  },
  etTitle: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
  },
  etHint: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#334155",
    padding: 3,
  },
  switchOn: {
    backgroundColor: "#16a34a",
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f1f5f9",
  },
  switchKnobOn: {
    transform: [{ translateX: 20 }],
  },
  etOptions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  etField: {
    flex: 1,
  },
  etInput: {
    width: "100%",
  },
  etStepper: {
    flexDirection: "row",
    gap: 8,
  },
  etStepChip: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingVertical: 9,
    alignItems: "center",
  },
  etStepChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#60a5fa",
  },
  etStepText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  etStepTextActive: {
    color: "#fff",
  },
  formatRow: {
    flexDirection: "row",
    gap: 8,
  },
  formatChip: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingVertical: 9,
    alignItems: "center",
  },
  formatChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#60a5fa",
  },
  formatChipText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  formatChipTextActive: {
    color: "#fff",
  },
  inheritedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: 9,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  inheritedValue: {
    color: "#86efac",
    fontSize: 14,
    fontWeight: "900",
  },
  formationWrap: {
    marginTop: 10,
  },
  entryRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  nameInput: {
    flex: 1,
  },
  jerseyInput: {
    width: 56,
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  empty: {
    color: "#475569",
    fontSize: 12,
    paddingVertical: 8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1e293b",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
  },
  playerName: {
    flex: 1,
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "700",
  },
  jersey: {
    color: "#64748b",
    fontSize: 12,
  },
  removeBtn: {
    padding: 6,
  },
  removeText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
  },
  startError: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  startBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
});
