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
import { getFormation } from "@/lib/formations";
import { MatchProvider, useMatch } from "@/state/MatchProvider";
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

function MatchShell() {
  const { width, height } = useWindowDimensions();
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
    applyFormation,
    fairShareSeconds,
  } = useMatch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cardTargetId, setCardTargetId] = useState<string | null>(null);
  if (!match) return null;

  const cardTarget =
    cardTargetId !== null
      ? (players.find((p) => p.playerId === cardTargetId) ?? null)
      : null;
  const openCardDialog = (playerId: string) => setCardTargetId(playerId);

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
        </View>
      </View>
    </Modal>
  );

  const header = (
    <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={() => router.push(`/season/${seasonId}`)} hitSlop={8}>
        <Text style={styles.backText}>‹ Dashboard</Text>
      </Pressable>
      <Text style={styles.topBarTitle} numberOfLines={1}>
        {match.teamName} vs {match.opponentName}
      </Text>
      <View style={styles.topBarSpacer} />
    </View>
  );

  if (fullTime) {
    return (
      <View style={styles.root}>
        {header}
        <MatchSummary />
      </View>
    );
  }

  if (isTablet) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.tabletRow}>
          <View style={styles.tabletCanvas}>
            <PitchField onCardPress={openCardDialog} />
          </View>
          <View style={styles.tabletPanel}>
            <ScrollView
              contentContainerStyle={styles.tabletPanelContent}
              showsVerticalScrollIndicator={false}
            >
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
                />
              </View>
            </ScrollView>
          </View>
        </View>
        {settingsModal}
        <CardDialog player={cardTarget} onClose={() => setCardTargetId(null)} />
      </View>
    );
  }

  // Phone: canvas on top at 70% viewport, bench/actions scrolling beneath.
  return (
    <View style={styles.root}>
      {header}
      <View style={[styles.phoneCanvas, { height: Math.round(height * 0.7) }]}>
        <PitchField onCardPress={openCardDialog} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.phoneStrip}
      >
        <Scoreboard dense />
        <View style={styles.phoneFormation}>{settingsButton}</View>
        <BenchRoster
          bench={sortedBench}
          selectionId={selectionId}
          onSelect={selectPlayer}
          onAddLate={addLateArrival}
          nowSeconds={match.elapsedSeconds}
          fairShareSeconds={fairShareSeconds}
          onCardPress={(p) => openCardDialog(p.playerId)}
          horizontal
          compact
        />
      </ScrollView>
      {settingsModal}
      <CardDialog player={cardTarget} onClose={() => setCardTargetId(null)} />
    </View>
  );
}

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  if (!matchId) return null;
  return (
    <MatchProvider matchId={matchId}>
      <MatchShell />
    </MatchProvider>
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
  topBarSpacer: {
    width: 70,
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
  phoneCanvas: {
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  phoneStrip: {
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 16,
    alignItems: "flex-start",
  },
  phoneFormation: {
    minWidth: 122,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 6,
  },
});
