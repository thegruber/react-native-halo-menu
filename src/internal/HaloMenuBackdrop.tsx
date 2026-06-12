/**
 * @file HaloMenuBackdrop.tsx
 * @description Default backdrop — solid dim fade. Hosts that want frosted glass inject
 * one via the provider's `renderBackdrop` (keeps expo-blur out of the core).
 */

import { StyleSheet } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useHaloMenuConfig } from "./config";

interface HaloMenuBackdropProps {
  visible: SharedValue<boolean>;
}

export function HaloMenuBackdrop({ visible }: HaloMenuBackdropProps) {
  const { timingConfig } = useHaloMenuConfig();

  const backdropStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: withTiming(visible.get() ? 1 : 0, timingConfig),
    };
  });

  return <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />;
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
