/**
 * @file HaloMenuPreviewFrame.tsx
 * @description Positions and clips the lifted preview — page-coordinate placement,
 * lift scale, signed tilt, and an animated levitation shadow. Wrap your preview
 * content in this inside `renderPreview` to get the standard transform.
 */

import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useHaloMenuConfig } from "./internal/config";
import { useHaloMenuState } from "./internal/state";

export interface HaloMenuPreviewFrameProps {
  /** Measured trigger size — forwarded from `renderPreview`. */
  width: number;
  height: number;
  /** Padding between the measured trigger bounds and the clipped preview. */
  inset?: number;
  /** Corner radius of the clipped preview. */
  borderRadius?: number;
  children: ReactNode;
}

export function HaloMenuPreviewFrame({
  width,
  height,
  inset = 0,
  borderRadius = 32,
  children,
}: HaloMenuPreviewFrameProps) {
  const { cardPageX, cardPageY, cardLiftScale, cardTiltDeg } = useHaloMenuState();
  const { motion } = useHaloMenuConfig();

  const previewPositionStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      left: cardPageX.get(),
      top: cardPageY.get(),
    };
  });

  const previewAnimStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [
        { perspective: 800 },
        { scale: cardLiftScale.get() },
        { rotateZ: `${cardTiltDeg.get()}deg` },
      ],
    };
  });

  // Guard liftScale === 1 (no lift) — the shadow progress would be 0/0.
  const liftRange = Math.max(motion.liftScale - 1, 1e-6);
  const previewShadowStyle = useAnimatedStyle(() => {
    "worklet";
    const t = (cardLiftScale.get() - 1) / liftRange;
    const p = Math.round(Math.max(0, Math.min(1, t)) * 100) / 100;
    return {
      boxShadow: [
        {
          offsetX: 0,
          offsetY: p * 8,
          blurRadius: p * 24,
          color: `rgba(0,0,0,${p * 0.45})`,
        },
        {
          offsetX: 0,
          offsetY: p * 4,
          blurRadius: p * 4,
          color: `rgba(255,255,255,${p * 0.4})`,
          inset: true,
        },
        {
          offsetX: 0,
          offsetY: p * -4,
          blurRadius: p * 4,
          color: `rgba(0,0,0,${p * 0.25})`,
          inset: true,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.previewOuter, { width, height }, previewPositionStyle, previewAnimStyle]}
    >
      <View style={[styles.previewPadding, { padding: inset }]}>
        <Animated.View style={[styles.previewInner, { borderRadius }, previewShadowStyle]}>
          {children}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  previewOuter: {
    position: "absolute",
  },
  previewPadding: {
    flex: 1,
  },
  previewInner: {
    flex: 1,
    overflow: "hidden",
  },
});
