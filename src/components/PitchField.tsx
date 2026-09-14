// §4 Tactical Canvas Coordinate & Boundary Engine.
//
// Coordinate space: the pitch container maps field-zone percentages (0-100)
// directly onto its own box (left/top %). The Technical Area strip is rendered
// *outside* the pitch container on the sideline, so players can structurally
// never be dropped inside it (§4 Rule C). Coach nodes live inside the strip,
// drag-locked to the vertical plane, and auto-pace while the clock runs.
//
// §5 Rule B live animations: field tokens soft-bounce (translateY -4px, 0.8s),
// coaches pace their track, and the ball glides possession between field
// players (1.2s interpolation). Everything freezes the instant the clock stops.

import { useMatch } from "@/state/MatchProvider";
import { useMatchTheme } from "@/state/MatchTheme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Ellipse, Line, Path, Rect } from "react-native-svg";
import CoachToken from "./CoachToken";
import PlayerToken, { TOKEN_SIZE } from "./PlayerToken";
import SoccerBall from "./SoccerBall";

const PITCH = { w: 76, h: 92 }; // viewBox units
const CENTER_CIRCLE_R = 6.6;
const BALL_SIZE = 20;

function pitchLines(containerW: number, containerH: number) {
  // Radii corrected so the center circle renders round at any aspect ratio.
  const rx = CENTER_CIRCLE_R;
  const ry =
    (CENTER_CIRCLE_R * (containerW / PITCH.w)) / (containerH / PITCH.h);
  return { rx, ry };
}

interface PitchFieldProps {
  /** Long-press a token to open the disciplinary card dialog. */
  onCardPress?: (playerId: string) => void;
}

export default function PitchField({ onCardPress }: PitchFieldProps) {
  const { theme } = useMatchTheme();
  const {
    match,
    fieldPlayers,
    selectionId,
    selectPlayer,
    tapPitch,
    isRunning,
    fairShareSeconds,
  } = useMatch();

  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 600;

  const [pitchSize, setPitchSize] = useState({ w: 0, h: 0 });
  const [stripHeight, setStripHeight] = useState(0);
  const [coachY, setCoachY] = useState({ head: 0.55, assistant: 0.3 });

  // §space: scale tokens down for big formats so they stop overlapping.
  const tokenSize =
    match?.gameFormat === "11v11"
      ? 34
      : match?.gameFormat === "9v9"
        ? 38
        : TOKEN_SIZE;

  // ---- per-token bounce values ----
  const bobs = useRef<Record<string, Animated.Value>>({});
  const bobLoops = useRef<Record<string, Animated.CompositeAnimation>>({});

  const getBob = useCallback((id: string) => {
    if (!bobs.current[id]) bobs.current[id] = new Animated.Value(0);
    return bobs.current[id];
  }, []);

  const syncFieldPlayerIds = useCallback((ids: string[]) => {
    const current = new Set(Object.keys(bobs.current));
    for (const id of current) {
      if (!ids.includes(id)) {
        bobLoops.current[id]?.stop();
        delete bobLoops.current[id];
        delete bobs.current[id];
      }
    }
    for (const id of ids) {
      if (!bobs.current[id]) {
        bobs.current[id] = new Animated.Value(id.length % 2 === 0 ? 0 : 1);
      }
    }
  }, []);

  const fieldIds = useMemo(
    () => fieldPlayers.map((p) => p.playerId).join(","),
    [fieldPlayers],
  );

  useEffect(() => {
    syncFieldPlayerIds(fieldPlayers.map((p) => p.playerId));
  }, [fieldIds, fieldPlayers, syncFieldPlayerIds]);

  // §5 Rule B: bounce loops tied to the clock state.
  useEffect(() => {
    for (const id of Object.keys(bobs.current)) {
      bobLoops.current[id]?.stop();
    }
    if (isRunning) {
      for (const id of Object.keys(bobs.current)) {
        const v = bobs.current[id];
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(v, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(v, {
              toValue: 1,
              duration: 400,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        );
        bobLoops.current[id] = loop;
        loop.start();
      }
    }
    return () => {
      for (const id of Object.keys(bobLoops.current)) {
        bobLoops.current[id]?.stop();
      }
    };
  }, [isRunning, fieldIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- selection pulse ----
  const selPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(selPulse, {
          toValue: 0.35,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(selPulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    if (selectionId) loop.start();
    else {
      loop.stop();
      selPulse.setValue(1);
    }
    return () => loop.stop();
  }, [selectionId, selPulse]);

  // ---- coach pacing (translateY offset on top of the dragged base position) ----
  const paceValues = useRef({
    head: new Animated.Value(0),
    assistant: new Animated.Value(0),
  }).current;
  const paceLoops = useRef<{
    head: Animated.CompositeAnimation | null;
    assistant: Animated.CompositeAnimation | null;
  }>({
    head: null,
    assistant: null,
  }).current;

  useEffect(() => {
    paceLoops.head?.stop();
    paceLoops.assistant?.stop();
    if (isRunning && stripHeight > 0) {
      const maxShift = stripHeight * 0.16;
      const run = (key: "head" | "assistant", duration: number) => {
        const loop = Animated.loop(
          Animated.timing(paceValues[key], {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
        paceLoops[key] = loop;
        loop.start();
      };
      run("head", 4200);
      run("assistant", 3600);
    }
    return () => {
      paceLoops.head?.stop();
      paceLoops.assistant?.stop();
    };
  }, [isRunning, stripHeight, paceLoops, paceValues]);

  const paceStyle = (key: "head" | "assistant") => ({
    transform: [
      {
        translateY: paceValues[key].interpolate({
          inputRange: [0, 1],
          outputRange: [0, stripHeight * 0.16],
        }),
      },
    ],
  });

  // ---- ball possession glide (§5 Rule B) ----
  const ballAnim = useRef(new Animated.ValueXY({ x: 50, y: 50 })).current;
  const ballTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ballPlaced, setBallPlaced] = useState(false);

  useEffect(() => {
    if (ballTimer.current) {
      clearInterval(ballTimer.current);
      ballTimer.current = null;
    }
    if (fieldPlayers.length === 0) {
      setBallPlaced(false);
      return;
    }
    if (!ballPlaced) {
      // First placement — possession starts on the first field player.
      const target = fieldPlayers[0];
      const initial = { x: target.xPct ?? 50, y: target.yPct ?? 50 };
      ballAnim.setValue(initial);
      setBallPlaced(true);
    }
    if (!isRunning) {
      ballAnim.stopAnimation(); // §5 Rule B: freeze statically in place.
      return;
    }
    ballTimer.current = setInterval(() => {
      const pool = fieldPlayers.filter(
        (p) => p.xPct !== null && p.yPct !== null,
      );
      if (pool.length === 0) return;
      const next = pool[Math.floor(Math.random() * pool.length)];
      const dest = { x: next.xPct ?? 50, y: next.yPct ?? 50 };
      Animated.timing(ballAnim, {
        toValue: dest,
        duration: 1200, // transition: left 1.2s, top 1.2s
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }, 4000);
    return () => {
      if (ballTimer.current) clearInterval(ballTimer.current);
    };
  }, [isRunning, fieldIds, ballPlaced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ball spin — slow rotation while the clock runs, frozen when it stops.
  const spin = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    spinLoop.current?.stop();
    if (isRunning) {
      spinLoop.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 3200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinLoop.current.start();
    } else {
      spin.stopAnimation();
    }
    return () => spinLoop.current?.stop();
  }, [isRunning, spin]);

  // Coach shouts — both coaches bark the same one-word instruction in sync
  // while the clock runs, cycling the command list every few seconds.
  const SHOUT_WORDS = [
    "run",
    "pass",
    "shoot",
    "away",
    "press",
    "hold",
    "switch",
    "clear",
  ];
  const [shoutIndex, setShoutIndex] = useState(0);
  useEffect(() => {
    if (!isRunning) {
      setShoutIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setShoutIndex((i) => (i + 1) % SHOUT_WORDS.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [isRunning]);
  const shout = isRunning ? SHOUT_WORDS[shoutIndex] : null;

  const flipped = match?.fieldOrientation === "FLIPPED";
  const { rx, ry } = pitchLines(pitchSize.w || 1, pitchSize.h || 1);

  const handleGroundTap = (e: any) => {
    if (!selectionId) return;
    // Native exposes locationX/Y; react-native-web exposes offsetX/Y.
    const locationX = e.nativeEvent?.locationX ?? e.nativeEvent?.offsetX ?? 0;
    const locationY = e.nativeEvent?.locationY ?? e.nativeEvent?.offsetY ?? 0;
    const w = pitchSize.w || 1;
    const h = pitchSize.h || 1;
    const x = Math.min(100, Math.max(0, (locationX / w) * 100));
    const y = Math.min(100, Math.max(0, (locationY / h) * 100));
    tapPitch(x, y, false);
  };

  const selected = selectionId
    ? fieldPlayers.find((p) => p.playerId === selectionId)
    : null;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.pitchBackground,
          borderColor: theme.pitchBorder,
        },
      ]}
    >
      {/* Technical Area strip — §4 Rule C: pinned outside the field lines */}
      {flipped && (
        <TechnicalStrip
          compact={compact}
          height={stripHeight}
          onLayout={setStripHeight}
          coachY={coachY}
          onCoachY={setCoachY}
          paceStyle={paceStyle}
          shout={shout}
        />
      )}

      <View
        style={styles.pitch}
        onLayout={(e) =>
          setPitchSize({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${PITCH.w} ${PITCH.h}`}
          preserveAspectRatio="none"
        >
          <Rect x={0} y={0} width={PITCH.w} height={PITCH.h} fill="#15803d" />
          {/* mowing stripes */}
          <Rect
            x={0}
            y={0}
            width={PITCH.w / 2}
            height={PITCH.h}
            fill="rgba(255,255,255,0.05)"
          />
          {/* halfway line + center circle + spot */}
          <Line
            x1={PITCH.w / 2}
            y1={0}
            x2={PITCH.w / 2}
            y2={PITCH.h}
            stroke="#e2e8f0"
            strokeWidth={0.35}
          />
          <Ellipse
            cx={PITCH.w / 2}
            cy={PITCH.h / 2}
            rx={rx}
            ry={ry}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          <Ellipse
            cx={PITCH.w / 2}
            cy={PITCH.h / 2}
            rx={0.6}
            ry={0.6}
            fill="#e2e8f0"
          />
          {/* penalty boxes */}
          <Rect
            x={0}
            y={PITCH.h * 0.2}
            width={8}
            height={PITCH.h * 0.6}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          <Rect
            x={PITCH.w - 8}
            y={PITCH.h * 0.2}
            width={8}
            height={PITCH.h * 0.6}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          {/* goal areas */}
          <Rect
            x={0}
            y={PITCH.h * 0.34}
            width={4}
            height={PITCH.h * 0.32}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          <Rect
            x={PITCH.w - 4}
            y={PITCH.h * 0.34}
            width={4}
            height={PITCH.h * 0.32}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          {/* penalty spots */}
          <Ellipse cx={6.4} cy={PITCH.h / 2} rx={0.5} ry={0.5} fill="#e2e8f0" />
          <Ellipse
            cx={PITCH.w - 6.4}
            cy={PITCH.h / 2}
            rx={0.5}
            ry={0.5}
            fill="#e2e8f0"
          />
          {/* goals */}
          <Rect
            x={-0.6}
            y={PITCH.h * 0.36}
            width={1.2}
            height={PITCH.h * 0.28}
            fill="#fff"
          />
          <Rect
            x={PITCH.w - 0.6}
            y={PITCH.h * 0.36}
            width={1.2}
            height={PITCH.h * 0.28}
            fill="#fff"
          />
          {/* corner arcs */}
          <Path
            d={`M 0 1.2 A 1.2 1.2 0 0 1 1.2 0`}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          <Path
            d={`M ${PITCH.w} 1.2 A 1.2 1.2 0 0 0 ${PITCH.w - 1.2} 0`}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          <Path
            d={`M 0 ${PITCH.h - 1.2} A 1.2 1.2 0 0 0 1.2 ${PITCH.h}`}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
          <Path
            d={`M ${PITCH.w} ${PITCH.h - 1.2} A 1.2 1.2 0 0 1 ${PITCH.w - 1.2} ${PITCH.h}`}
            stroke="#e2e8f0"
            strokeWidth={0.35}
            fill="none"
          />
        </Svg>

        {/* ground tap layer (behind tokens) */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleGroundTap} />

        {/* hint banner */}
        {selectionId && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>
              Tap a field player or open pitch spot to place{" "}
              {selected?.playerName ?? "player"}
            </Text>
          </View>
        )}
        {!selectionId &&
          fieldPlayers.length === 0 &&
          match?.currentStage !== "FULL_TIME" && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>
                Tap a bench player, then tap the pitch to place them
              </Text>
            </View>
          )}

        {/* ball (§5 Rule B) — realistic sphere, frozen in place when the clock stops */}
        {ballPlaced && fieldPlayers.length > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ball,
              {
                left: ballAnim.x.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
                top: ballAnim.y.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: spin.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              }}
            >
              <SoccerBall size={BALL_SIZE} />
            </Animated.View>
          </Animated.View>
        )}

        {/* field tokens */}
        {fieldPlayers.map((p) => (
          <View
            key={p.playerId}
            style={[
              styles.tokenPos,
              {
                left: `${p.xPct ?? 50}%`,
                top: `${p.yPct ?? 50}%`,
                marginLeft: -tokenSize / 2,
                marginTop: -tokenSize / 2,
              },
            ]}
          >
            <PlayerToken
              player={p}
              size={tokenSize}
              totalSeconds={p.totalSeconds + p.shiftSeconds}
              stintSeconds={p.shiftSeconds}
              charge={
                fairShareSeconds > 0
                  ? Math.max(
                      0,
                      Math.min(
                        1,
                        1 -
                          (p.totalSeconds + p.shiftSeconds) / fairShareSeconds,
                      ),
                    )
                  : undefined
              }
              selected={selectionId === p.playerId}
              isTarget={selectionId !== null && selectionId !== p.playerId}
              onPress={() => selectPlayer(p.playerId)}
              onLongPress={
                onCardPress ? () => onCardPress(p.playerId) : undefined
              }
              yellowCards={p.yellowCards}
              sentOff={p.sentOff}
              bounceStyle={
                isRunning
                  ? {
                      transform: [
                        {
                          translateY: getBob(p.playerId).interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -4],
                          }),
                        },
                      ],
                    }
                  : undefined
              }
              ringStyle={{ opacity: selPulse }}
            />
          </View>
        ))}
      </View>

      {!flipped && (
        <TechnicalStrip
          compact={compact}
          height={stripHeight}
          onLayout={setStripHeight}
          coachY={coachY}
          onCoachY={setCoachY}
          paceStyle={paceStyle}
          shout={shout}
        />
      )}
    </View>
  );
}

function TechnicalStrip({
  compact,
  height,
  onLayout,
  coachY,
  onCoachY,
  paceStyle,
  shout,
}: {
  compact: boolean;
  height: number;
  onLayout: (h: number) => void;
  coachY: { head: number; assistant: number };
  onCoachY: (y: { head: number; assistant: number }) => void;
  paceStyle: (key: "head" | "assistant") => {
    transform: { translateY: any }[];
  };
  shout: string | null;
}) {
  return (
    <View
      style={[styles.techStrip, compact && styles.techStripCompact]}
      onLayout={(e) => onLayout(e.nativeEvent.layout.height)}
    >
      {!compact && (
        <Text style={styles.techLabel} numberOfLines={1}>
          TECHNICAL AREA
        </Text>
      )}
      <CoachToken
        label="Head Coach"
        hat="big"
        shout={shout}
        baseY={coachY.head}
        trackHeight={height}
        onChangeBaseY={(y) => onCoachY({ ...coachY, head: y })}
        paceStyle={paceStyle("head")}
      />
      <CoachToken
        label="Asst. Coach"
        hat="small"
        shout={shout}
        baseY={coachY.assistant}
        trackHeight={height}
        onChangeBaseY={(y) => onCoachY({ ...coachY, assistant: y })}
        paceStyle={paceStyle("assistant")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
    padding: 4,
    backgroundColor: "#052e16",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#14532d",
  },
  pitch: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  tokenPos: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  ball: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
    zIndex: 3,
    marginLeft: -BALL_SIZE / 2,
    marginTop: -BALL_SIZE / 2,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  hint: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 6,
  },
  hintText: {
    color: "#fde68a",
    fontSize: 11,
    fontWeight: "700",
  },
  techStrip: {
    width: 64,
    backgroundColor: "rgba(30,41,59,0.55)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#475569",
    borderStyle: "dashed",
    position: "relative",
    alignItems: "center",
    paddingTop: 6,
  },
  techStripCompact: {
    width: 44,
    paddingTop: 0,
  },
  techLabel: {
    color: "#94a3b8",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 4,
  },
});
