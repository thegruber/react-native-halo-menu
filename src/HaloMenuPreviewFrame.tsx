/**
 * @file HaloMenuPreviewFrame.tsx
 * @description Positions and clips the lifted preview — page-coordinate placement,
 * lift scale, signed tilt, and an animated levitation shadow. Wrap your preview
 * content in this inside `renderPreview` to get the standard transform.
 */

import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
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
  /** Static style for the positioned preview wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Static style for the clipped preview content wrapper. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Overrides the provider preview shadow multiplier for this frame. */
  shadowOpacity?: number;
  children: ReactNode;
}

export function HaloMenuPreviewFrame({
  width,
  height,
  inset = 0,
  borderRadius = 32,
  style,
  contentStyle,
  shadowOpacity,
  children,
}: HaloMenuPreviewFrameProps) {
  const { cardPageX, cardPageY, cardLiftScale, cardTiltDeg } = useHaloMenuState();
  const { motion, appearance } = useHaloMenuConfig();
  const resolvedShadowOpacity = shadowOpacity ?? appearance.previewShadowOpacity ?? 0;

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
      boxShadow:
        resolvedShadowOpacity > 0
          ? [
              {
                offsetX: 0,
                offsetY: p * 10,
                blurRadius: p * 28,
                color: `rgba(0,0,0,${p * resolvedShadowOpacity})`,
              },
            ]
          : [],
    };
  });

  return (
    <Animated.View
      style={[
        styles.previewOuter,
        { width, height },
        appearance.previewContainerStyle,
        style,
        previewPositionStyle,
        previewAnimStyle,
      ]}
    >
      <View style={[styles.previewPadding, { padding: inset }]}>
        <Animated.View
          style={[
            styles.previewInner,
            { borderRadius },
            appearance.previewContentStyle,
            contentStyle,
            previewShadowStyle,
          ]}
        >
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
