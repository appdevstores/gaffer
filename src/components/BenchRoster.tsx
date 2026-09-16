// §4 Rule B local auto-sorting bench array. Sorted ascending by cumulative
// playing time — late arrivals (0:00) naturally pop to the head of the queue.
// Tapping a bench card arms the two-tap substitution cursor (activeSelectionID).

import type { MatchPlayer } from "@/core/types";
import { avatarInitials } from "@/lib/avatars";
import { formatClock } from "@/lib/mailto";
import { useMatchTheme } from "@/state/MatchTheme";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Props {
  bench: MatchPlayer[];
  selectionId: string | null;
  onSelect: (id: string) => void;
  onAddLate: (name: string, jerseyNumber: number) => void;
  /** Match clock elapsed seconds — used to compute live bench stint durations. */
  nowSeconds: number;
  /** Fair-share average game time (seconds) — shown as the playing-time target. */
  fairShareSeconds: number;
  /** Long-press a bench player to open the disciplinary card dialog. */
  onCardPress?: (p: MatchPlayer) => void;
  /** Remove a non-field player from this match-day roster only. */
  onRemove?: (p: MatchPlayer) => void;
  horizontal?: boolean;
  compact?: boolean;
}

export default function BenchRoster({
  bench,
  selectionId,
  onSelect,
  onAddLate,
  nowSeconds,
  fairShareSeconds,
  onCardPress,
  onRemove,
  horizontal,
  compact,
}: Props) {
  const { theme } = useMatchTheme();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    if (selectionId) loop.start();
    else {
      loop.stop();
      pulse.setValue(1);
    }
    return () => loop.stop();
  }, [selectionId, pulse]);

  const submitLate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddLate(trimmed, parseInt(jersey, 10) || 0);
    setName("");
    setJersey("");
  };

  // §space: on phone (compact) render vertical tiles so 4-6 subs fit at once.
  const benchStint = (p: MatchPlayer) =>
    Math.max(0, nowSeconds - (p.benchStartSeconds ?? 0));
  const cards = bench.map((p) => {
    const selected = p.playerId === selectionId;
    if (compact) {
      return (
        <Pressable
          key={p.playerId}
          onPress={() => onSelect(p.playerId)}
          onLongPress={onCardPress ? () => onCardPress(p) : undefined}
          delayLongPress={350}
          style={[
            styles.tile,
            selected && styles.tileSelected,
            p.sentOff && styles.tileSentOff,
          ]}
        >
          {selected && (
            <Animated.View
              style={[styles.selectedBorder, { opacity: pulse }]}
              pointerEvents="none"
            />
          )}
          {onRemove && !p.sentOff && (
            <Pressable
              style={styles.removeMatchPlayer}
              onPress={() => onRemove(p)}
            >
              <Text style={styles.removeMatchPlayerText}>×</Text>
            </Pressable>
          )}
          <View
            style={[
              styles.tileAvatar,
              {
                backgroundColor: theme.benchTokenColor,
                borderRadius: theme.tokenShape === "round" ? 17 : 7,
              },
            ]}
          >
            <Text style={styles.tileAvatarText}>
              {avatarInitials(p.playerName)}
            </Text>
            {p.sentOff ? (
              <View
                style={[
                  styles.cardBadge,
                  styles.redCardBadge,
                  styles.badgeOnAvatar,
                ]}
              >
                <Text style={[styles.cardBadgeText, styles.redCardBadgeText]}>
                  R
                </Text>
              </View>
            ) : (
              p.yellowCards > 0 && (
                <View
                  style={[
                    styles.cardBadge,
                    styles.yellowCardBadge,
                    styles.badgeOnAvatar,
                  ]}
                >
                  <Text style={styles.cardBadgeText}>{p.yellowCards}</Text>
                </View>
              )
            )}
          </View>
          <Text style={styles.tileName} numberOfLines={1}>
            {p.playerName}
          </Text>
          <Text style={styles.tileMeta}>
            {formatClock(p.totalSeconds)} total
          </Text>
          <Text style={[styles.tileBench, p.sentOff && styles.sentOffText]}>
            {p.sentOff ? "sent off" : `bench ${formatClock(benchStint(p))}`}
          </Text>
        </Pressable>
      );
    }
    return (
      <Pressable
        key={p.playerId}
        onPress={() => onSelect(p.playerId)}
        onLongPress={onCardPress ? () => onCardPress(p) : undefined}
        delayLongPress={350}
        style={[
          styles.card,
          selected && styles.cardSelected,
          p.sentOff && styles.tileSentOff,
        ]}
      >
        {selected && (
          <Animated.View
            style={[styles.selectedBorder, { opacity: pulse }]}
            pointerEvents="none"
          />
        )}
        {onRemove && !p.sentOff && (
          <Pressable
            style={styles.removeMatchPlayer}
            onPress={() => onRemove(p)}
          >
            <Text style={styles.removeMatchPlayerText}>×</Text>
          </Pressable>
        )}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.benchTokenColor,
              borderRadius: theme.tokenShape === "round" ? 17 : 7,
            },
          ]}
        >
          <Text style={styles.avatarText}>{avatarInitials(p.playerName)}</Text>
          {p.sentOff ? (
            <View
              style={[
                styles.cardBadge,
                styles.redCardBadge,
                styles.badgeOnAvatar,
              ]}
            >
              <Text style={[styles.cardBadgeText, styles.redCardBadgeText]}>
                R
              </Text>
            </View>
          ) : (
            p.yellowCards > 0 && (
              <View
                style={[
                  styles.cardBadge,
                  styles.yellowCardBadge,
                  styles.badgeOnAvatar,
                ]}
              >
                <Text style={styles.cardBadgeText}>{p.yellowCards}</Text>
              </View>
            )
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>
            {p.playerName}
          </Text>
          <Text style={styles.meta}>{formatClock(p.totalSeconds)} total</Text>
          <Text style={[styles.cardBench, p.sentOff && styles.sentOffText]}>
            {p.sentOff
              ? "🟥 sent off"
              : `⌛ bench ${formatClock(benchStint(p))}`}
          </Text>
        </View>
      </Pressable>
    );
  });

  const addRow = adding ? (
    <View style={styles.addForm}>
      <TextInput
        style={styles.input}
        placeholder="Late arrival name"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
        autoFocus
        onSubmitEditing={submitLate}
        returnKeyType="done"
      />
      <TextInput
        style={[styles.input, styles.jerseyInput]}
        placeholder="#"
        placeholderTextColor="#64748b"
        value={jersey}
        onChangeText={setJersey}
        keyboardType="number-pad"
        onSubmitEditing={submitLate}
      />
      <Pressable style={styles.addButton} onPress={submitLate}>
        <Text style={styles.addButtonText}>Add</Text>
      </Pressable>
      <Pressable style={styles.cancelButton} onPress={() => setAdding(false)}>
        <Text style={styles.cancelText}>✕</Text>
      </Pressable>
    </View>
  ) : (
    <Pressable style={styles.lateButton} onPress={() => setAdding(true)}>
      <Text style={styles.lateButtonText}>+ Late arrival</Text>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.benchSurface, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Subs Bench</Text>
        <View style={styles.headerRight}>
          <Text style={styles.avgTarget}>
            target {formatClock(fairShareSeconds)}
          </Text>
          <Text style={styles.count}>{bench.length} on bench</Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendTotal]} />
          <Text style={styles.legendText}>total</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendStint]} />
          <Text style={styles.legendText}>stint</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendBattery]} />
          <Text style={styles.legendText}>energy</Text>
        </View>
      </View>
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {addRow}
          {cards}
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {addRow}
          {cards}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(15,23,42,0.92)",
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  count: {
    color: "#64748b",
    fontSize: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avgTarget: {
    color: "#fde68a",
    fontSize: 10,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendTotal: {
    backgroundColor: "#fde68a", // amber = total game time
  },
  legendStint: {
    backgroundColor: "#67e8f9", // cyan = current stint
  },
  legendBattery: {
    backgroundColor: "#4ade80", // green = remaining energy
  },
  legendText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "700",
  },
  row: {
    paddingHorizontal: 2,
    paddingBottom: 2,
    gap: 6,
    alignItems: "stretch",
  },
  grid: {
    paddingHorizontal: 2,
    paddingBottom: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 6,
    width: 150,
    position: "relative",
  },
  tile: {
    width: 68,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 3,
    alignItems: "center",
    position: "relative",
  },
  tileSelected: {
    backgroundColor: "#334155",
  },
  tileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  tileAvatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  tileName: {
    color: "#f1f5f9",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
    maxWidth: 64,
  },
  tileMeta: {
    color: "#94a3b8",
    fontSize: 8,
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  tileBench: {
    color: "#67e8f9", // cyan = current bench stint
    fontSize: 7,
    fontWeight: "700",
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  removeMatchPlayer: {
    position: "absolute",
    top: 3,
    right: 3,
    zIndex: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.75)",
  },
  removeMatchPlayerText: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 16,
    fontWeight: "800",
  },
  tileSentOff: {
    opacity: 0.72,
    borderWidth: 1,
    borderColor: "#b91c1c",
  },
  sentOffText: {
    color: "#fca5a5",
    fontWeight: "800",
  },
  cardBadge: {
    position: "absolute",
    width: 15,
    height: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeOnAvatar: {
    top: -4,
    right: -4,
  },
  yellowCardBadge: {
    backgroundColor: "#facc15",
  },
  redCardBadge: {
    backgroundColor: "#dc2626",
  },
  cardBadgeText: {
    color: "#0f172a",
    fontSize: 8,
    fontWeight: "900",
  },
  redCardBadgeText: {
    color: "#fff",
  },
  cardBench: {
    color: "#67e8f9", // cyan = current bench stint
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  cardSelected: {
    backgroundColor: "#334155",
  },
  selectedBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#facc15",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  cardBody: {
    flex: 1,
  },
  name: {
    color: "#f1f5f9",
    fontSize: 12,
    fontWeight: "700",
  },
  meta: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 1,
  },
  lateButton: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    minHeight: 46,
  },
  lateButtonText: {
    color: "#ccfbf1",
    fontSize: 12,
    fontWeight: "700",
  },
  addForm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 6,
    minWidth: 220,
  },
  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#f1f5f9",
    fontSize: 12,
    minWidth: 90,
  },
  jerseyInput: {
    flex: 0,
    width: 44,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#ccfbf1",
    fontSize: 12,
    fontWeight: "700",
  },
  cancelButton: {
    padding: 6,
  },
  cancelText: {
    color: "#94a3b8",
    fontSize: 12,
  },
});
