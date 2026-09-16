// Live match-day engine screen.
// Responsive breakpoint (§1): <600dp → vertical scroll, canvas on top at 70%
// viewport with bench/actions scrolling horizontally beneath; ≥600dp →
// horizontal split-frame, pitch at 70% width with the control sidebar docked
// permanently on the right 30% panel.

import BenchRoster from "@/components/BenchRoster";
import CardDialog from "@/components/CardDialog";
import FormationPicker from "@/components/FormationPicker";
import MatchSummary from "@/components/MatchSummary";
import PitchField from "@/components/PitchField";
import Scoreboard from "@/components/Scoreboard";
import type { MatchPlayer } from "@/core/types";
import { getFormation } from "@/lib/formations";
import { formatClock } from "@/lib/mailto";
import { MatchProvider, useMatch } from "@/state/MatchProvider";
import { MatchThemeProvider, useMatchTheme } from "@/state/MatchTheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

function MatchShell() {
  const { theme, toggleTheme } = useMatchTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { seasonId } = useLocalSearchParams<{ seasonId: string }>();
  const {
    match,
    players,
    sortedBench,
    selectionId,
    selectPlayer,
    addLateArrival,
    removeBenchPlayer,
    applyFormation,
    fairShareSeconds,
    showRotationBadges,
    setShowRotationBadges,
  } = useMatch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tabletControlsCollapsed, setTabletControlsCollapsed] = useState(false);
  const [cardTargetId, setCardTargetId] = useState<string | null>(null);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  if (!match) return null;

  const cardTarget =
    cardTargetId !== null
      ? (players.find((p) => p.playerId === cardTargetId) ?? null)
      : null;
  const openCardDialog = (playerId: string) => setCardTargetId(playerId);
  const removeTarget = removeTargetId
    ? (players.find((player) => player.playerId === removeTargetId) ?? null)
    : null;

  const changeFormation = (id: string) =>
    applyFormation(getFormation(match.gameFormat, id));

  const isTablet = width >= 600;
  const fullTime = match.currentStage === "FULL_TIME";

  const settingsButton = (
    <Pressable
      style={styles.settingsButton}
      onPress={() => setSettingsOpen(true)}
    >
      <Text style={styles.settingsIcon}>⚙</Text>
      <Text style={styles.settingsButtonText}>Settings</Text>
    </Pressable>
  );

  const settingsModal = (
    <Modal
      visible={settingsOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setSettingsOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.settingsModalCard}>
          <View style={styles.settingsHeader}>
            <View>
              <Text style={styles.settingsTitle}>Match Settings</Text>
              <Text style={styles.settingsSubtitle}>
                Formation · {match.gameFormat}
              </Text>
            </View>
            <Pressable onPress={() => setSettingsOpen(false)} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <FormationPicker
            format={match.gameFormat}
            currentId={match.tacticalShape}
            onSelect={(id) => {
              changeFormation(id);
              setSettingsOpen(false);
            }}
          />
          <View style={styles.settingsOption}>
            <View style={styles.settingsOptionCopy}>
              <Text style={styles.settingsOptionTitle}>Rotation badges</Text>
              <Text style={styles.settingsOptionSubtitle}>
                Show who has been on the longest
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: showRotationBadges }}
              style={[styles.switch, showRotationBadges && styles.switchOn]}
              onPress={() => setShowRotationBadges(!showRotationBadges)}
            >
              <View
                style={[
                  styles.switchThumb,
                  showRotationBadges && styles.switchThumbOn,
                ]}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const header = (
    <View
      style={[
        styles.topBar,
        { paddingTop: insets.top + 6 },
        { backgroundColor: theme.root },
      ]}
    >
      <Pressable onPress={() => router.push(`/season/${seasonId}`)} hitSlop={8}>
        <Text style={styles.backText}>‹ Dashboard</Text>
      </Pressable>
      <Text style={styles.topBarTitle} numberOfLines={1}>
        {match.teamName} vs {match.opponentName}
      </Text>
      <Pressable
        style={[styles.themeToggle, { backgroundColor: theme.surfaceAlt }]}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleText}>
          {theme.name === "professional" ? "🎨" : "🧭"}
        </Text>
      </Pressable>
    </View>
  );

  if (fullTime) {
    return (
      <View style={[styles.root, { backgroundColor: theme.root }]}>
        {header}
        <MatchSummary />
      </View>
    );
  }

  if (isTablet) {
    return (
      <View style={[styles.root, { backgroundColor: theme.root }]}>
        {header}
        <View style={styles.tabletRow}>
          <View
            style={[
              styles.tabletCanvas,
              tabletControlsCollapsed && styles.tabletCanvasExpanded,
            ]}
          >
            <PitchField onCardPress={openCardDialog} />
          </View>
          {tabletControlsCollapsed ? (
            <View
              style={[
                styles.collapsedPanel,
                { backgroundColor: theme.surface },
              ]}
            >
              <Text style={styles.collapsedTeam} numberOfLines={1}>
                {match.teamName}
              </Text>
              <Text style={styles.collapsedScore}>
                {match.teamSide === "HOME" ? match.homeScore : match.awayScore}
              </Text>
              <Text style={styles.collapsedClock}>
                {formatClock(match.elapsedSeconds - match.stageStartSeconds)}
              </Text>
              <Text style={styles.collapsedStage}>
                {match.currentStage.replaceAll("_", " ")}
              </Text>
              <Text style={styles.collapsedVs}>—</Text>
              <Text style={styles.collapsedTeam} numberOfLines={1}>
                {match.opponentName}
              </Text>
              <Text style={styles.collapsedScore}>
                {match.teamSide === "HOME" ? match.awayScore : match.homeScore}
              </Text>
              <Pressable
                style={[styles.expandButton, { backgroundColor: theme.accent }]}
                onPress={() => setTabletControlsCollapsed(false)}
                accessibilityLabel="Expand match controls"
              >
                <PanelToggleIcon direction="left" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.tabletPanel}>
              <ScrollView
                contentContainerStyle={styles.tabletPanelContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelHeaderText}>Match Controls</Text>
                  <Pressable
                    style={styles.collapseButton}
                    onPress={() => setTabletControlsCollapsed(true)}
                    accessibilityLabel="Collapse match controls"
                  >
                    <PanelToggleIcon direction="right" />
                  </Pressable>
                </View>
                <Scoreboard />
                <View style={styles.panelSection}>{settingsButton}</View>
                <View style={styles.panelSection}>
                  <BenchRoster
                    bench={sortedBench}
                    selectionId={selectionId}
                    onSelect={selectPlayer}
                    onAddLate={addLateArrival}
                    nowSeconds={match.elapsedSeconds}
                    fairShareSeconds={fairShareSeconds}
                    onCardPress={(p) => openCardDialog(p.playerId)}
                    onRemove={(p) => setRemoveTargetId(p.playerId)}
                  />
                </View>
              </ScrollView>
            </View>
          )}
        </View>
        {settingsModal}
        <CardDialog player={cardTarget} onClose={() => setCardTargetId(null)} />
        <RemoveMatchPlayerDialog
          player={removeTarget}
          onCancel={() => setRemoveTargetId(null)}
          onConfirm={() => {
            if (removeTarget) removeBenchPlayer(removeTarget.playerId);
            setRemoveTargetId(null);
          }}
        />
      </View>
    );
  }

  // Phone: vertical stack — scoreboard, pitch, then an always-visible bench
  // grid (no sideways scrolling; extra subs scroll vertically inside it).
  return (
    <View style={[styles.root, { backgroundColor: theme.root }]}>
      {header}
      <View style={styles.phoneScoreboard}>
        <Scoreboard dense onOpenSettings={() => setSettingsOpen(true)} />
      </View>
      <View style={styles.phoneCanvas}>
        <PitchField onCardPress={openCardDialog} />
      </View>
      <View style={styles.phoneBench}>
        <BenchRoster
          bench={sortedBench}
          selectionId={selectionId}
          onSelect={selectPlayer}
          onAddLate={addLateArrival}
          nowSeconds={match.elapsedSeconds}
          fairShareSeconds={fairShareSeconds}
          onCardPress={(p) => openCardDialog(p.playerId)}
          compact
        />
      </View>
      {settingsModal}
      <CardDialog player={cardTarget} onClose={() => setCardTargetId(null)} />
    </View>
  );
}

function PanelToggleIcon({ direction }: { direction: "left" | "right" }) {
  const d =
    direction === "right"
      ? "M4 3 L10 11 L4 19 M12 3 L18 11 L12 19"
      : "M18 3 L12 11 L18 19 M10 3 L4 11 L10 19";
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      accessibilityLabel={direction === "right" ? "Collapse" : "Expand"}
    >
      <Path
        d={d}
        stroke="#fff"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RemoveMatchPlayerDialog({
  player,
  onCancel,
  onConfirm,
}: {
  player: MatchPlayer | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={player !== null}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.settingsModalCard}>
          <Text style={styles.settingsTitle}>Remove from match?</Text>
          <Text style={styles.settingsSubtitle}>
            {player?.playerName} will leave this match-day bench, but remain on
            the team roster for future matches.
          </Text>
          <View style={styles.removeActions}>
            <Pressable style={styles.modalCancel} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.removeConfirm} onPress={onConfirm}>
              <Text style={styles.removeConfirmText}>Remove Player</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  if (!matchId) return null;
  return (
    <MatchThemeProvider>
      <MatchProvider matchId={matchId}>
        <MatchShell />
      </MatchProvider>
    </MatchThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  backText: {
    color: "#60a5fa",
    fontSize: 13,
    fontWeight: "700",
  },
  topBarTitle: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  themeToggle: {
    width: 38,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#475569",
  },
  themeToggleText: {
    fontSize: 16,
  },
  tabletRow: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 10,
  },
  tabletCanvas: {
    flex: 7,
  },
  tabletCanvasExpanded: {
    flex: 1,
  },
  collapsedPanel: {
    width: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    paddingVertical: 10,
  },
  collapsedTeam: {
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "800",
    maxWidth: 78,
    textAlign: "center",
  },
  collapsedScore: {
    color: "#fff",
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "900",
  },
  collapsedClock: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  collapsedStage: {
    color: "#94a3b8",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
  },
  collapsedVs: {
    color: "#475569",
    fontSize: 18,
    marginVertical: 6,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  expandButtonText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 27,
  },
  panelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  panelHeaderText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  collapseButton: {
    width: 28,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  collapseButtonText: {
    color: "#f8fafc",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "900",
  },
  tabletPanel: {
    flex: 3,
  },
  tabletPanelContent: {
    gap: 12,
    paddingBottom: 12,
  },
  panelSection: {
    flexShrink: 1,
  },
  settingsButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  settingsIcon: {
    color: "#cbd5e1",
    fontSize: 17,
  },
  settingsButtonText: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    padding: 20,
  },
  settingsModalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  settingsTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  settingsSubtitle: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },
  closeText: {
    color: "#94a3b8",
    fontSize: 18,
    padding: 2,
  },
  settingsOption: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingsOptionCopy: {
    flex: 1,
  },
  settingsOptionTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsOptionSubtitle: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: "center",
    backgroundColor: "#334155",
  },
  switchOn: {
    backgroundColor: "#2563eb",
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#cbd5e1",
  },
  switchThumbOn: {
    alignSelf: "flex-end",
    backgroundColor: "#fff",
  },
  removeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  removeConfirm: {
    backgroundColor: "#991b1b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  removeConfirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  phoneScoreboard: {
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  phoneCanvas: {
    flex: 1,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  phoneBench: {
    height: 220,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
});
