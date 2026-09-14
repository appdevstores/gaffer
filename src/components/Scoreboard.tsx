// §5 Whistle Overtime Clock & score hub (compact layout).
// - One row: score | clock + stage | score. All stage shifts are gated behind
//   manual button commands (referee whistle).
// - Tap the HOME score to credit a scorer; tap the AWAY score for an away goal
//   (removes two dedicated goal buttons — §space).
// - The clock keeps counting through stoppage; the display turns bright red.
// - Score title alignment swaps with the field orientation (§6.B).

import type {
  MatchEvent,
  MatchEventType,
  MatchSession,
  MatchStage,
} from "@/core/types";
import { formatClock } from "@/lib/mailto";
import { useMatch } from "@/state/MatchProvider";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const STAGE_LABEL: Record<MatchStage, string> = {
  PRE_MATCH: "Pre-Match",
  FIRST_HALF: "1st Half",
  BREAK: "Half-Time Break",
  SECOND_HALF: "2nd Half",
  EXTRA_TIME_1: "ET 1st Half",
  EXTRA_TIME_BREAK: "ET Break",
  EXTRA_TIME_2: "ET 2nd Half",
  FULL_TIME: "Full Time",
};

/** The whistle button is the only clock control: a kickoff starts the clock,
 * a whistle stops it, and sides switch automatically when a new half starts.
 * Playoff matches route 2nd-half full time through extra time. */
function getStageAction(
  match: MatchSession,
): { label: string; next: MatchStage } | null {
  switch (match.currentStage) {
    case "PRE_MATCH":
      return { label: "▶ Start Match", next: "FIRST_HALF" };
    case "FIRST_HALF":
      return { label: "🛑 Half Time", next: "BREAK" };
    case "BREAK":
      return { label: "▶ Start 2nd Half", next: "SECOND_HALF" };
    case "SECOND_HALF":
      return match.extraTimeEnabled
        ? { label: "➕ Extra Time", next: "EXTRA_TIME_BREAK" }
        : { label: "🔚 Full Time", next: "FULL_TIME" };
    case "EXTRA_TIME_BREAK":
      return { label: "▶ Start Extra Time", next: "EXTRA_TIME_1" };
    case "EXTRA_TIME_1":
      return match.extraTimeHalves > 1
        ? { label: "🛑 ET Half Time", next: "EXTRA_TIME_BREAK" }
        : { label: "🔚 Full Time", next: "FULL_TIME" };
    case "EXTRA_TIME_2":
      return { label: "🔚 Full Time", next: "FULL_TIME" };
    default:
      return null;
  }
}

interface ScoreboardProps {
  dense?: boolean;
  /** When provided, renders a ⚙ settings button in the action rail. */
  onOpenSettings?: () => void;
}

export default function Scoreboard({ dense, onOpenSettings }: ScoreboardProps) {
  const {
    match,
    events,
    perHalfSeconds,
    inStoppage,
    transitionStage,
    registerGoal,
    editGoalScorer,
    flipField,
    fieldPlayers,
  } = useMatch();

  const [scorerPicker, setScorerPicker] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MatchEvent | null>(null);
  if (!match) return null;

  const goalEvents = events.filter(
    (event) => event.type === "GOAL_HOME" || event.type === "GOAL_AWAY",
  );

  const stageAction = getStageAction(match);
  const teamIsHome = match.teamSide === "HOME";
  const teamScore = teamIsHome ? match.homeScore : match.awayScore;
  const opponentScore = teamIsHome ? match.awayScore : match.homeScore;
  const ownGoalType: MatchEventType = teamIsHome ? "GOAL_HOME" : "GOAL_AWAY";
  const opponentGoalType: MatchEventType = teamIsHome
    ? "GOAL_AWAY"
    : "GOAL_HOME";

  // §space: tap-to-score. Home opens the scorer picker, away registers directly.
  const scoreSide = (
    name: string,
    score: number,
    side: "left" | "right",
    onPress: () => void,
  ) => (
    <Pressable
      style={[styles.scoreSide, side === "right" && styles.scoreSideRight]}
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={`${name} score ${score} — tap to add a goal`}
    >
      <Text style={styles.teamName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.scoreWrap}>
        <Text style={styles.scoreNumber}>{score}</Text>
        <Text style={styles.plus}>+</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, dense && styles.containerDense]}>
      <View style={styles.topRow}>
        {/* Team and opponent stay in fixed columns; flipping never re-centers or swaps them. */}
        {scoreSide(
          match.teamName,
          teamScore,
          "left",
          () => (setEditingGoal(null), setScorerPicker(true)),
        )}
        {centerClock(
          inStoppage,
          perHalfSeconds,
          STAGE_LABEL[match.currentStage],
        )}
        {scoreSide(match.opponentName, opponentScore, "right", () =>
          registerGoal(opponentGoalType, null),
        )}
      </View>

      {/* Action rail: whistle stage button · flip. The whistle drives the clock. */}
      <View style={styles.actionRow}>
        {stageAction && (
          <Pressable
            style={[styles.stageBtn, styles.btnStage]}
            onPress={() => transitionStage(stageAction.next)}
          >
            <Text style={styles.stageBtnText}>{stageAction.label}</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.iconBtn, styles.btnFlip]}
          onPress={flipField}
          accessibilityLabel="Flip sides"
        >
          <Text style={styles.iconBtnText}>🔄</Text>
        </Pressable>
        {onOpenSettings && (
          <Pressable
            style={[styles.iconBtn, styles.btnSettings]}
            onPress={onOpenSettings}
            accessibilityLabel="Match settings"
          >
            <Text style={styles.iconBtnText}>⚙</Text>
          </Pressable>
        )}
      </View>

      {goalEvents.length > 0 && (
        <View style={styles.goalEvents}>
          {goalEvents.map((event) => {
            const scorer = event.playerScorerId
              ? (fieldPlayers.find((p) => p.playerId === event.playerScorerId)
                  ?.playerName ?? "Unknown scorer")
              : "No scorer credited";
            return (
              <Pressable
                key={event.id}
                style={styles.goalEvent}
                onPress={() => {
                  setEditingGoal(event);
                  setScorerPicker(true);
                }}
              >
                <Text style={styles.goalEventText}>
                  ⚽ {formatClock(event.timestampSeconds)} · {scorer}
                </Text>
                <Text style={styles.goalEventEdit}>Edit</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Scorer selection for new goals or correcting a logged goal */}
      <Modal visible={scorerPicker} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingGoal
                ? "Correct scorer"
                : `Who scored for ${match.teamName}?`}
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {fieldPlayers.map((p) => (
                <Pressable
                  key={p.playerId}
                  style={styles.scorerRow}
                  onPress={() => {
                    if (editingGoal) {
                      editGoalScorer(editingGoal.id, p.playerId);
                    } else {
                      registerGoal(ownGoalType, p.playerId);
                    }
                    setScorerPicker(false);
                    setEditingGoal(null);
                  }}
                >
                  <Text style={styles.scorerName}>
                    {p.playerName}{" "}
                    <Text style={styles.scorerJersey}>#{p.jerseyNumber}</Text>
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={[
                styles.scorerRow,
                { borderTopWidth: 1, borderTopColor: "#1e293b" },
              ]}
              onPress={() => {
                if (editingGoal) {
                  editGoalScorer(editingGoal.id, null);
                } else {
                  registerGoal(ownGoalType, null);
                }
                setScorerPicker(false);
                setEditingGoal(null);
              }}
            >
              <Text style={styles.scorerName}>Own goal / no credit</Text>
            </Pressable>
            <Pressable
              style={styles.modalClose}
              onPress={() => {
                setScorerPicker(false);
                setEditingGoal(null);
              }}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Center column: clock above the stage label, stoppage flips the clock red. */
function centerClock(inStoppage: boolean, seconds: number, stageLabel: string) {
  return (
    <View style={styles.center}>
      <Text style={[styles.clock, inStoppage && styles.clockStoppage]}>
        {formatClock(seconds)}
      </Text>
      <View style={styles.stagePill}>
        <Text
          style={[styles.stageText, inStoppage && styles.stageTextStoppage]}
        >
          {stageLabel}
          {inStoppage ? " +" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  containerDense: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreSide: {
    flex: 1,
    alignItems: "flex-start",
  },
  scoreSideRight: {
    alignItems: "flex-end",
  },
  teamName: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: "100%",
  },
  scoreWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreNumber: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  plus: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "800",
    opacity: 0.55,
  },
  center: {
    alignItems: "center",
    marginHorizontal: 10,
    minWidth: 88,
  },
  clock: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  clockStoppage: {
    color: "#ef4444", // bright red stoppage hook (§5 Rule A)
  },
  stagePill: {
    backgroundColor: "#1e293b",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 1,
  },
  stageText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  stageTextStoppage: {
    color: "#ef4444",
  },
  goalEvents: {
    marginTop: 6,
    gap: 4,
  },
  goalEvent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  goalEventText: {
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "700",
  },
  goalEventEdit: {
    color: "#60a5fa",
    fontSize: 10,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 36,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  stageBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 32,
    justifyContent: "center",
  },
  stageBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  btnStart: {
    backgroundColor: "#16a34a",
  },
  btnPause: {
    backgroundColor: "#d97706",
  },
  btnStage: {
    backgroundColor: "#2563eb",
  },
  btnFlip: {
    backgroundColor: "#7c3aed",
  },
  btnSettings: {
    backgroundColor: "#334155",
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
    padding: 16,
  },
  modalTitle: {
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  scorerRow: {
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  scorerName: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },
  scorerJersey: {
    color: "#64748b",
  },
  modalClose: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  modalCloseText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
});
