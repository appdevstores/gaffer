// §6.A Size-filtered formations matrix. Only reveals the structural options
// mapped to the active game format (4v4 → diamond/box/2-1-1, 11v11 → 4-4-2/…).

import type { GameFormat } from "@/core/types";
import { getFormationsForFormat } from "@/lib/formations";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface Props {
  format: GameFormat;
  currentId: string;
  onSelect: (id: string) => void;
}

export default function FormationPicker({
  format,
  currentId,
  onSelect,
}: Props) {
  const options = getFormationsForFormat(format);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Formation</Text>
      <ScrollView
        horizontal
        scrollEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        persistentScrollbar
        directionalLockEnabled
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {options.map((f) => {
          const active = f.id === currentId;
          return (
            <Pressable
              key={f.id}
              onPress={() => onSelect(f.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text
                style={[styles.chipLabel, active && styles.chipLabelActive]}
              >
                {f.label}
              </Text>
              <Text
                style={[styles.chipShape, active && styles.chipShapeActive]}
              >
                {f.shape}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 0,
  },
  scroll: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 18,
    alignItems: "stretch",
  },
  chip: {
    flexShrink: 0,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#60a5fa",
  },
  chipLabel: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  chipShape: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: "#fff",
  },
  chipShapeActive: {
    color: "#bfdbfe",
  },
});
