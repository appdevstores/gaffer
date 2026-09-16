// §4 Rule C coach nodes — permanently trapped inside the Technical Area
// wrapper, drag locked to the vertical plane (axis="y"). When the match clock
// runs, the pacing animation glides them up and down their track automatically.
//
// Avatars are drawn locally (offline-first): a neutral unisex face, with the
// head coach wearing a bigger hat and the assistant a smaller cap.

import { useMatchTheme } from "@/state/MatchTheme";
import { useRef } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

interface Props {
  label: string;
  /** 'big' → head coach's wide-brimmed hat, 'small' → assistant's cap. */
  hat: "big" | "small";
  /** One-word instruction shown in a speech bubble while the clock runs. */
  shout?: string | null;
  /** Tablet technical areas run along the touchline horizontally. */
  horizontal?: boolean;
  /** Base position along the track, 0 (top) .. 1 (bottom). */
  baseY: number;
  trackHeight: number;
  onChangeBaseY: (y: number) => void;
  paceStyle?: StyleProp<ViewStyle>;
}

const TOKEN_SIZE = 34;

function CoachAvatar({ hat }: { hat: "big" | "small" }) {
  // Unisex neutral face tone — no gender-coded hair or features.
  const face = "#eab68f";
  const shirt = "#334155";
  if (hat === "big") {
    return (
      <Svg width={TOKEN_SIZE} height={TOKEN_SIZE} viewBox="0 0 34 34">
        {/* wide-brimmed manager hat */}
        <Rect x={12} y={3} width={10} height={12} rx={2} fill="#1e3a8a" />
        <Rect x={7} y={14.5} width={20} height={3} rx={1.5} fill="#1e3a8a" />
        {/* unisex face */}
        <Circle cx={17} cy={23} r={7} fill={face} />
        {/* shoulders */}
        <Circle cx={17} cy={35} r={11} fill={shirt} />
      </Svg>
    );
  }
  return (
    <Svg width={TOKEN_SIZE} height={TOKEN_SIZE} viewBox="0 0 34 34">
      {/* small cap */}
      <Rect x={13.5} y={6} width={7} height={7} rx={1.5} fill="#0f766e" />
      <Rect x={9.5} y={12.5} width={15} height={2.4} rx={1.2} fill="#0f766e" />
      {/* unisex face */}
      <Circle cx={17} cy={22} r={7} fill={face} />
      {/* shoulders */}
      <Circle cx={17} cy={35} r={11} fill={shirt} />
    </Svg>
  );
}

export default function CoachToken({
  label,
  hat,
  shout,
  horizontal = false,
  baseY,
  trackHeight,
  onChangeBaseY,
  paceStyle,
}: Props) {
  const { theme } = useMatchTheme();
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const max = Math.max(1, trackHeight - TOKEN_SIZE - 8);
        const next = Math.min(1, Math.max(0, baseY + gesture.dy / max));
        onChangeBaseY(next);
      },
    }),
  ).current;

  return (
    <View
      {...pan.panHandlers}
      style={[
        styles.positioner,
        horizontal ? styles.horizontalPositioner : { top: `${baseY * 100}%` },
      ]}
    >
      <Animated.View style={[styles.inner, paceStyle]}>
        {shout && (
          <View
            style={[
              styles.bubble,
              theme.name === "anime" && styles.animeBubble,
            ]}
            pointerEvents="none"
          >
            <Text style={styles.bubbleText}>{shout}</Text>
            <View style={styles.bubbleTail} />
          </View>
        )}
        <View style={styles.avatar}>
          <CoachAvatar hat={hat} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  horizontalPositioner: {
    position: "relative",
    left: undefined,
    right: undefined,
    top: 0,
    flex: 1,
  },
  inner: {
    alignItems: "center",
  },
  avatar: {
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    borderRadius: TOKEN_SIZE / 2,
    backgroundColor: "#0f172a",
    borderWidth: 2,
    borderColor: "#f8fafc",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  label: {
    marginTop: 2,
    fontSize: 8,
    color: "#fff",
    textAlign: "center",
    maxWidth: 64,
  },
  bubble: {
    position: "absolute",
    bottom: TOKEN_SIZE + 8,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  animeBubble: {
    backgroundColor: "#fef08a",
    borderWidth: 2,
    borderColor: "#ec4899",
    transform: [{ rotate: "-4deg" }],
  },
  bubbleText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#f8fafc",
  },
});
