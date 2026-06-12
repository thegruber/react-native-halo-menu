/**
 * @file index.tsx
 * @description Optional Expo extras — import from "react-native-halo-menu/expo".
 * Requires expo-blur (optional peer); the main entry never touches this module,
 * so bare React Native consumers pay nothing.
 */

import { BlurView, type BlurTint, type BlurViewProps } from "expo-blur";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useHaloMenuConfig } from "../internal/config";
import type { HaloMenuBackdropProps } from "../types";

export interface HaloBlurBackdropProps
  extends HaloMenuBackdropProps, Omit<BlurViewProps, "children" | "style" | "tint" | "intensity"> {
  /** expo-blur intensity (0-100). */
  intensity?: number;
  /** expo-blur tint. Defaults to light/dark based on the provider color scheme. */
  tint?: BlurTint;
  /** Style applied to the animated backdrop container. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style applied to the underlying BlurView. */
  blurStyle?: StyleProp<ViewStyle>;
  /** Optional overlay tint on top of the blur for more consistent contrast. */
  overlayColor?: string;
  /** Style applied to the optional overlay tint. */
  overlayStyle?: StyleProp<ViewStyle>;
}

/**
 * Frosted-glass backdrop. Wire it up via the provider:
 *
 *   <HaloMenuProvider renderBackdrop={(p) => <HaloBlurBackdrop {...p} />}>
 */
export function HaloBlurBackdrop({
  visible,
  isDarkMode,
  intensity = 40,
  tint,
  containerStyle,
  blurStyle,
  overlayColor,
  overlayStyle,
  ...blurProps
}: HaloBlurBackdropProps) {
  const { timingConfig } = useHaloMenuConfig();

  const fadeStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: withTiming(visible.get() ? 1 : 0, timingConfig),
    };
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, containerStyle, fadeStyle]}
      pointerEvents="none"
    >
      <BlurView
        {...blurProps}
        intensity={intensity}
        tint={tint ?? (isDarkMode ? "dark" : "light")}
        style={[StyleSheet.absoluteFill, blurStyle]}
      />
      {overlayColor ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }, overlayStyle]}
        />
      ) : null}
    </Animated.View>
  );
}
