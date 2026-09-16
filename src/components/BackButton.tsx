import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
}

export default function BackButton({ label, onPress, color = "#60a5fa" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Svg width={16} height={20} viewBox="0 0 16 20">
        <Path
          d="M10.5 3.5 L4.5 10 L10.5 16.5"
          stroke={color}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.65,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
});
