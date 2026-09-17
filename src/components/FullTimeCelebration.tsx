// Full-time team huddle. A short, celebratory transition before the report:
// players animate into a circle around the coaches, count down 3-2-1, then
// cheer the team name before the summary is revealed.

import type { MatchPlayer, MatchSession } from "@/core/types";
import { avatarColor, avatarInitials } from "@/lib/avatars";
import { useMatchTheme } from "@/state/MatchTheme";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";

interface Props {
  match: MatchSession;
  players: MatchPlayer[];
  onComplete: () => void;
}

const TOKEN_SIZE = 38;

export default function FullTimeCelebration({
  match,
  players,
  onComplete,
}: Props) {
  const { theme } = useMatchTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [chant, setChant] = useState("FULL TIME");
  const positions = useRef<Animated.ValueXY[]>([]).current;
  const completed = useRef(false);

  useEffect(() => {
    while (positions.length < players.length) {
      positions.push(new Animated.ValueXY({ x: 0, y: 0 }));
    }
  }, [players.length, positions]);

  useEffect(() => {
    if (size.width === 0 || size.height === 0 || players.length === 0) return;
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const radius = Math.min(size.width, size.height) * 0.28;

    const animations = players.map((_, index) => {
      const angle =
        (index / Math.max(players.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const startX = index % 2 === 0 ? -TOKEN_SIZE : size.width + TOKEN_SIZE;
      const startY = 40 + ((index * 47) % Math.max(size.height - 80, 1));
      positions[index].setValue({ x: startX, y: startY });
      return Animated.timing(positions[index], {
        toValue: {
          x: centerX + Math.cos(angle) * radius - TOKEN_SIZE / 2,
          y: centerY + Math.sin(angle) * radius - TOKEN_SIZE / 2,
        },
        duration: 5200,
        delay: index * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start();
    const timers = [
      setTimeout(() => setChant("3"), 5600),
      setTimeout(() => setChant("2"), 6600),
      setTimeout(() => setChant("1"), 7600),
      setTimeout(() => setChant(match.teamName.toUpperCase()), 8500),
      setTimeout(() => {
        if (!completed.current) {
          completed.current = true;
          onComplete();
        }
      }, 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [match.teamName, onComplete, players, positions, size.height, size.width]);

  return (
    <View
      style={[styles.root, { backgroundColor: theme.root }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      <View style={styles.fieldBackdrop} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={theme.pitchBackground}
          />
          <Rect
            x="0"
            y="0"
            width="50"
            height="100"
            fill="rgba(255,255,255,0.045)"
          />
          <Rect
            x="50"
            y="0"
            width="50"
            height="100"
            fill="rgba(0,40,20,0.035)"
          />
          <Line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="rgba(226,232,240,0.8)"
            strokeWidth="0.35"
          />
          <Circle
            cx="50"
            cy="50"
            r="12"
            stroke="rgba(226,232,240,0.8)"
            strokeWidth="0.35"
            fill="none"
          />
          <Circle cx="50" cy="50" r="0.8" fill="rgba(226,232,240,0.9)" />
          <Rect
            x="0"
            y="28"
            width="10"
            height="44"
            stroke="rgba(226,232,240,0.8)"
            strokeWidth="0.35"
            fill="none"
          />
          <Rect
            x="90"
            y="28"
            width="10"
            height="44"
            stroke="rgba(226,232,240,0.8)"
            strokeWidth="0.35"
            fill="none"
          />
          <Rect
            x="0"
            y="39"
            width="4"
            height="22"
            stroke="rgba(226,232,240,0.8)"
            strokeWidth="0.35"
            fill="none"
          />
          <Rect
            x="96"
            y="39"
            width="4"
            height="22"
            stroke="rgba(226,232,240,0.8)"
            strokeWidth="0.35"
            fill="none"
          />
        </Svg>
      </View>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.accentStrong }]}>
          FULL TIME
        </Text>
        <Text style={[styles.score, { color: theme.text }]}>
          {match.teamName}{" "}
          {match.teamSide === "HOME" ? match.homeScore : match.awayScore}
          <Text style={styles.dash}> – </Text>
          {match.teamSide === "HOME" ? match.awayScore : match.homeScore}{" "}
          {match.opponentName}
        </Text>
      </View>

      <View style={styles.huddle} pointerEvents="none">
        <View style={[styles.coachCircle, { borderColor: theme.accent }]}>
          <Text style={styles.coachIcon}>⚽</Text>
        </View>
        <View
          style={[
            styles.coachCircle,
            styles.secondCoach,
            { borderColor: theme.accentStrong },
          ]}
        >
          <Text style={styles.coachIcon}>🧢</Text>
        </View>
        <Text
          style={[
            styles.chanter,
            { color: theme.name === "anime" ? "#fef08a" : theme.text },
            theme.name === "anime" && styles.animeChanter,
          ]}
          numberOfLines={1}
        >
          {chant}
        </Text>
      </View>

      {players.map((player, index) => (
        <Animated.View
          key={player.playerId}
          style={[
            styles.player,
            {
              backgroundColor: avatarColor(player.avatarSeed),
              transform: positions[index]
                ? positions[index].getTranslateTransform()
                : undefined,
            },
          ]}
        >
          <Text style={styles.playerText}>
            {avatarInitials(player.playerName)}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  header: {
    position: "absolute",
    top: 24,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  kicker: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
  score: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
  },
  dash: {
    color: "#64748b",
  },
  huddle: {
    width: 150,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  coachCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  secondCoach: {
    position: "absolute",
    marginLeft: 58,
    marginTop: 24,
  },
  coachIcon: {
    fontSize: 22,
  },
  chanter: {
    position: "absolute",
    top: 112,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    maxWidth: "90%",
  },
  animeChanter: {
    textShadowColor: "#ec4899",
    textShadowRadius: 12,
    transform: [{ skewX: "-8deg" }],
  },
  player: {
    position: "absolute",
    left: 0,
    top: 0,
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    borderRadius: TOKEN_SIZE / 2,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  playerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
});
