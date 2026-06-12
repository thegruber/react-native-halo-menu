/**
 * @file HaloMenuHoverLabel.tsx
 * @description Floating action title above (or below) the arc — fades per selection,
 * drifts subtly with the finger.
 */

import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useHaloMenuConfig } from "./config";
import { MENU_RADIUS } from "./geometry";
import { useHaloMenuState } from "./state";

/** Distance from arc center to the floating label. */
const LABEL_OFFSET = MENU_RADIUS + 180;

export function HaloMenuHoverLabel() {
  const state = useHaloMenuState();
  const { selectedIndex, centerY, originX, fingerX, fingerY } = state;
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const { colors, motion, labelTextStyle } = useHaloMenuConfig();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const labelOpacity = useSharedValue(0);
  const labelFadeDuration = motion.labelFadeDuration;

  useAnimatedReaction(
    () => {
      "worklet";
      return selectedIndex.get();
    },
    (idx, prevIdx) => {
      "worklet";
      if (idx !== prevIdx) {
        // Update text on the JS thread — keep previous text visible during fade-out.
        if (idx >= 0) scheduleOnRN(setSelectedIdx, idx);
        labelOpacity.set(
          withTiming(idx >= 0 ? 1 : 0, {
            duration: labelFadeDuration,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }
    },
    [],
  );

  const labelText = selectedIdx >= 0 ? (state.renderActions[selectedIdx]?.title ?? "") : "";
  const insetTop = insets.top;

  const labelStyle = useAnimatedStyle(() => {
    "worklet";
    const cy = centerY.get();

    // Above normally, flip below if the label would hit the top safe-area inset.
    const aboveY = cy - LABEL_OFFSET;
    const labelY = aboveY < insetTop + 10 ? cy + LABEL_OFFSET : aboveY;

    // Anchor text to the opposite edge from the touch.
    const isLeftTouch = originX.get() < screenWidth / 2;

    // Subtle drift with finger movement (horizontal + vertical) — creates a
    // responsive feel where the label follows the finger slightly.
    const safeWidth = Math.max(screenWidth, 1);
    const fingerProgressX = fingerX.get() / safeWidth;
    const fingerOffsetY = (fingerY.get() - cy) * 0.08;
    const trackAmount = 20;

    return {
      opacity: labelOpacity.get(),
      top: labelY + fingerOffsetY,
      flexDirection: "row",
      justifyContent: isLeftTouch ? "flex-end" : "flex-start",
      paddingLeft: isLeftTouch ? 0 : fingerProgressX * trackAmount,
      paddingRight: isLeftTouch ? (1 - fingerProgressX) * trackAmount : 0,
    };
  });

  return (
    <Animated.View style={[styles.anchor, labelStyle]}>
      <Text
        style={[styles.text, { color: colors.foreground }, labelTextStyle]}
        accessibilityLabel={labelText}
      >
        {labelText}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  text: {
    fontSize: 32,
    textTransform: "lowercase",
  },
});
