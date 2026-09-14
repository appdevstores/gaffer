// §4 pitch token. Purely presentational — animation styles and the two-tap
// cursor logic are owned by PitchField / MatchProvider. The `size` prop lets
// big formats (9v9/11v11) render denser tokens so they don't overlap.

import type { MatchPlayer } from "@/core/types";
import { avatarColor, avatarInitials } from "@/lib/avatars";
import { useMatchTheme } from "@/state/MatchTheme";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export const TOKEN_SIZE = 42;

interface Props {
  player: MatchPlayer;
  size?: number;
  /** Total match playing seconds (accumulated + current stint) — amber badge. */
  totalSeconds?: number;
  /** Current stint seconds (since subbed in) — cyan badge. */
  stintSeconds?: number;
  /**
   * Remaining fair-share charge 0..1 (1 = fresh, 0 = played their average).
   * Drives the ring tint (amber → red) and the battery bar.
   */
  charge?: number;
  selected: boolean;
  /** Glow ring shown when another token is selected (placement target). */
  isTarget: boolean;
  onPress: () => void;
  /** Long-press opens the disciplinary card dialog. */
  onLongPress?: () => void;
  yellowCards?: number;
  sentOff?: boolean;
  bounceStyle?: StyleProp<ViewStyle>;
  ringStyle?: StyleProp<ViewStyle>;
  highlightRingStyle?: StyleProp<ViewStyle>;
}

function formatLive(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PlayerToken({
  player,
  size = TOKEN_SIZE,
  totalSeconds,
  stintSeconds,
  charge,
  selected,
  isTarget,
  onPress,
  onLongPress,
  yellowCards = 0,
  sentOff = false,
  bounceStyle,
  ringStyle,
  highlightRingStyle,
}: Props) {
  const { theme } = useMatchTheme();
  const color = avatarColor(player.avatarSeed);
  const ringInset = Math.round(size * 0.14);

  // Charge-driven visuals: amber ring when approaching the average, red when
  // past it; battery fill + bolt for an at-a-glance "needs to come off" cue.
  const chargeRing =
    charge !== undefined && charge < 0.2
      ? styles.ringRed
      : charge !== undefined && charge < 0.5
        ? styles.ringAmber
        : null;
  const batteryColor =
    charge === undefined
      ? null
      : charge > 0.5
        ? "#4ade80"
        : charge > 0.25
          ? "#fbbf24"
          : "#ef4444";
  const boltLow = charge !== undefined && charge <= 0.25;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[styles.wrapper, { width: size + 14 }]}
      hitSlop={6}
    >
      <Animated.View style={bounceStyle}>
        <View style={[styles.inner, { width: size, height: size }]}>
          {/* Pulsing selection border wrapper */}
          {selected && (
            <Animated.View
              style={[
                styles.selectionRing,
                { borderColor: theme.tokenRing },
                {
                  top: -ringInset,
                  left: -ringInset,
                  right: -ringInset,
                  bottom: -ringInset,
                  borderRadius: (size + ringInset * 2) / 2,
                },
                ringStyle,
              ]}
            />
          )}
          {isTarget && !selected && (
            <Animated.View
              style={[
                styles.targetRing,
                {
                  top: -Math.round(size * 0.1),
                  left: -Math.round(size * 0.1),
                  right: -Math.round(size * 0.1),
                  bottom: -Math.round(size * 0.1),
                  borderRadius: (size + Math.round(size * 0.2)) / 2,
                },
                highlightRingStyle,
              ]}
            />
          )}
          <View
            style={[
              styles.avatar,
              {
                width: size,
                height: size,
                borderRadius:
                  theme.tokenShape === "round"
                    ? size / 2
                    : Math.round(size * 0.2),
              },
              { backgroundColor: theme.fieldTokenColor },
            ]}
          >
            {/* fair-share ring — reddens as the player approaches the average */}
            {chargeRing && (
              <View
                style={[
                  styles.chargeRing,
                  chargeRing,
                  {
                    top: 2,
                    left: 2,
                    right: 2,
                    bottom: 2,
                    borderRadius:
                      theme.tokenShape === "round"
                        ? (size - 4) / 2
                        : Math.round(size * 0.15),
                  },
                ]}
                pointerEvents="none"
              />
            )}
            <Text
              style={[
                styles.initials,
                styles.primaryInitials,
                { fontSize: Math.round(size * 0.38) },
              ]}
            >
              {avatarInitials(player.playerName)}
            </Text>
          </View>
          {/* sent-off dimming */}
          {sentOff && (
            <View
              style={[
                styles.sentOffOverlay,
                {
                  borderRadius:
                    theme.tokenShape === "round"
                      ? size / 2
                      : Math.round(size * 0.2),
                  top: 2,
                  left: 2,
                  right: 2,
                  bottom: 2,
                },
              ]}
              pointerEvents="none"
            />
          )}
          {/* disciplinary card badges */}
          {sentOff ? (
            <View
              style={[
                styles.cardBadge,
                styles.redCardBadge,
                { top: -2, right: -2 },
              ]}
            >
              <Text style={[styles.cardBadgeText, styles.redCardBadgeText]}>
                R
              </Text>
            </View>
          ) : (
            yellowCards > 0 && (
              <View
                style={[
                  styles.cardBadge,
                  styles.yellowCardBadge,
                  { top: -2, right: -2 },
                ]}
              >
                <Text style={styles.cardBadgeText}>{yellowCards}</Text>
              </View>
            )
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {player.playerName}
        </Text>
        {totalSeconds !== undefined && (
          <View
            style={[styles.liveBadge, { borderRadius: Math.round(size * 0.2) }]}
          >
            <Text
              style={[
                styles.liveBadgeText,
                styles.totalBadgeText,
                { fontSize: size >= 42 ? 8 : 7 },
              ]}
            >
              {formatLive(totalSeconds)}
            </Text>
          </View>
        )}
        {stintSeconds !== undefined && (
          <View
            style={[
              styles.liveBadge,
              styles.stintBadge,
              { borderRadius: Math.round(size * 0.2) },
            ]}
          >
            <Text
              style={[
                styles.liveBadgeText,
                styles.stintBadgeText,
                { fontSize: size >= 42 ? 7 : 6 },
              ]}
            >
              in {formatLive(stintSeconds)}
            </Text>
          </View>
        )}
        {charge !== undefined && (
          <View style={[styles.battery, { width: size + 8 }]}>
            <View
              style={[
                styles.batteryFill,
                {
                  width: `${Math.round(Math.max(0, Math.min(1, charge)) * 100)}%`,
                  backgroundColor: batteryColor ?? "#4ade80",
                },
              ]}
            />
            <View
              style={[
                styles.batteryCap,
                { backgroundColor: batteryColor ?? "#4ade80" },
              ]}
            />
          </View>
        )}
        {boltLow && (
          <Text style={styles.bolt} pointerEvents="none">
            ⚡
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  jersey: {
    color: "#fff",
    fontWeight: "800",
    lineHeight: 14,
  },
  initials: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    lineHeight: 9,
  },
  primaryInitials: {
    color: "#fff",
    fontWeight: "900",
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  name: {
    marginTop: 2,
    fontSize: 9,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
    maxWidth: 56,
  },
  liveBadge: {
    marginTop: 1,
    backgroundColor: "rgba(2,6,23,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  liveBadgeText: {
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
  },
  totalBadgeText: {
    color: "#fde68a", // amber = total game time
  },
  stintBadge: {
    marginTop: 1,
  },
  stintBadgeText: {
    color: "#67e8f9", // cyan = current stint
  },
  chargeRing: {
    position: "absolute",
    borderWidth: 2,
  },
  ringAmber: {
    borderColor: "rgba(251,191,36,0.9)", // approaching the average
  },
  sentOffOverlay: {
    position: "absolute",
    backgroundColor: "rgba(2,6,23,0.55)",
  },
  cardBadge: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  yellowCardBadge: {
    backgroundColor: "#facc15",
  },
  redCardBadge: {
    backgroundColor: "#dc2626",
  },
  cardBadgeText: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: "900",
  },
  redCardBadgeText: {
    color: "#fff",
    fontSize: 9,
  },
  ringRed: {
    borderColor: "rgba(239,68,68,0.95)", // past the average — needs to come off
  },
  battery: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(2,6,23,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    marginTop: 2,
    overflow: "hidden",
    position: "relative",
  },
  batteryFill: {
    height: "100%",
    borderRadius: 1,
  },
  batteryCap: {
    position: "absolute",
    right: -3,
    top: 1,
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  bolt: {
    position: "absolute",
    right: -4,
    top: 6,
    fontSize: 9,
    color: "#ef4444",
  },
  selectionRing: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#facc15",
  },
  targetRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#67e8f9",
    backgroundColor: "rgba(103,232,249,0.25)",
  },
});
