/**
 * @file HaloMenuButton.tsx
 * @description One arc slot — entrance stagger, per-frame placement from the gesture's
 * SharedValues, selection push/scale/color inversion, render-prop icon.
 */

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useHaloMenuConfig } from "./config";
import { getButtonAngle } from "./geometry";
import { useHaloMenuState } from "./state";
import type { HaloAction } from "../types";

const APPEAR_TIMING = { duration: 180, reduceMotion: ReduceMotion.System };
const DISAPPEAR_TIMING = { duration: 140, reduceMotion: ReduceMotion.System };
const SPRING_SELECT = {
  stiffness: 200,
  damping: 18,
  mass: 1,
  reduceMotion: ReduceMotion.System,
};
const SPRING_DESELECT = {
  stiffness: 120,
  damping: 14,
  mass: 1,
  reduceMotion: ReduceMotion.System,
};

interface HaloMenuButtonProps {
  index: number;
  /** The action for this slot — passed as prop for reactivity. */
  action: HaloAction | undefined;
}

export function HaloMenuButton({ index, action }: HaloMenuButtonProps) {
  const { menuVisible, centerX, centerY, buttonCount, selectedIndex, arcAngle } =
    useHaloMenuState();
  const { colors, isDarkMode, motion, layout, appearance } = useHaloMenuConfig();
  const staggerDelay = motion.staggerDelay;
  const selectedScale = motion.selectedScale;
  const { buttonSize, buttonBorderRadius, iconSize, radius, selectedPush, arcGapDegrees } = layout;
  const buttonShadowOpacity = appearance.buttonShadowOpacity ?? 0;
  const arcGapRad = (arcGapDegrees * Math.PI) / 180;

  // Separate entrance progress from per-frame position updates: `withDelay`
  // must fire once on state change, not re-evaluate every frame.
  // `useAnimatedReaction` fires only on `menuVisible` transitions.
  const entered = useSharedValue(0);

  // Encode visibility + active as a single number to avoid object allocation
  // per frame (returning an object defeats shallow comparison).
  useAnimatedReaction(
    () => {
      "worklet";
      return menuVisible.get() && index < buttonCount.get() ? 1 : 0;
    },
    (shouldShow, wasShowing) => {
      "worklet";
      if (shouldShow === 1 && wasShowing !== 1) {
        entered.set(withDelay(index * staggerDelay, withTiming(1, APPEAR_TIMING)));
      } else if (shouldShow === 0 && wasShowing === 1) {
        entered.set(withTiming(0, DISAPPEAR_TIMING));
      }
    },
    [],
  );

  // Spring-driven displacement away from finger (selected) or rest (unselected).
  const pushX = useSharedValue(0);
  const pushY = useSharedValue(0);
  const selScale = useSharedValue(1);
  const selProgress = useSharedValue(0);

  // React to selection changes — push the selected button away from the
  // finger, animate scale + color inversion. Primitive return avoids object
  // allocation defeating shallow comparison.
  useAnimatedReaction(
    () => {
      "worklet";
      return selectedIndex.get() === index ? 1 : 0;
    },
    (isSel, prev) => {
      "worklet";
      if (isSel === prev) return;

      if (isSel) {
        const cx = centerX.get();
        const cy = centerY.get();
        const count = buttonCount.get();
        const angle = getButtonAngle(index, count, arcAngle.get(), arcGapRad);
        const btnCx = cx + radius * Math.cos(angle);
        const btnCy = cy + radius * Math.sin(angle);
        const dx = btnCx - cx;
        const dy = btnCy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        pushX.set(withSpring((dx / dist) * selectedPush, SPRING_SELECT));
        pushY.set(withSpring((dy / dist) * selectedPush, SPRING_SELECT));
        selScale.set(withSpring(selectedScale, SPRING_SELECT));
        selProgress.set(withSpring(1, SPRING_SELECT));
      } else {
        pushX.set(withSpring(0, SPRING_DESELECT));
        pushY.set(withSpring(0, SPRING_DESELECT));
        selScale.set(withSpring(1, SPRING_DESELECT));
        selProgress.set(withSpring(0, SPRING_DESELECT));
      }
    },
    [],
  );

  const animStyle = useAnimatedStyle(() => {
    "worklet";
    const count = buttonCount.get();
    const isSlotActive = index < count;
    const cx = centerX.get();
    const cy = centerY.get();
    const progress = entered.get();

    const angle = getButtonAngle(index, count, arcAngle.get(), arcGapRad);
    const baseX = cx + radius * Math.cos(angle) - buttonSize / 2;
    const baseY = cy + radius * Math.sin(angle) - buttonSize / 2;

    // Apply spring-driven push (only when active).
    const px = isSlotActive && progress > 0 ? pushX.get() : 0;
    const py = isSlotActive && progress > 0 ? pushY.get() : 0;
    const finalX = baseX + px;
    const finalY = baseY + py;

    // Interpolate position from center → final based on entrance progress.
    const startX = cx - buttonSize / 2;
    const startY = cy - buttonSize / 2;
    const interpX = startX + (finalX - startX) * progress;
    const interpY = startY + (finalY - startY) * progress;

    const baseScale = 0.3 + 0.7 * progress;

    return {
      opacity: progress,
      transform: [
        { translateX: interpX },
        { translateY: interpY },
        { scale: baseScale * selScale.get() },
      ],
    };
  });

  // Animated background — interpolates surface → inverted on selection.
  const selectedBg = action?.destructive ? colors.destructive : colors.foreground;
  const restIconColor = action?.destructive ? colors.destructive : colors.foreground;
  const surfaceColor = colors.surface;
  // Animated bg + shadow — both driven by selProgress in a single worklet.
  const bgAnimStyle = useAnimatedStyle(() => {
    "worklet";
    const raw = selProgress.get();
    const p = Math.round(Math.max(0, Math.min(1, raw)) * 100) / 100;
    return {
      backgroundColor: interpolateColor(raw, [0, 1], [surfaceColor, selectedBg]),
      boxShadow:
        buttonShadowOpacity > 0
          ? [
              {
                offsetX: 0,
                offsetY: p * 6,
                blurRadius: p * 14,
                color: `rgba(0,0,0,${p * buttonShadowOpacity * (isDarkMode ? 1.45 : 1)})`,
              },
            ]
          : [],
    };
  });

  // Drive icon color via React state — vector icons need the `color` prop,
  // not `style.color`.
  const [isSelected, setIsSelected] = useState(false);
  useAnimatedReaction(
    () => {
      "worklet";
      return selectedIndex.get() === index;
    },
    (isSel, wasSel) => {
      "worklet";
      if (isSel !== wasSel) scheduleOnRN(setIsSelected, isSel);
    },
    [],
  );
  const iconColor = isSelected ? colors.selectionForeground : restIconColor;

  return (
    <Animated.View style={[styles.btnWrap, animStyle]}>
      <Animated.View
        style={[
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonBorderRadius,
          },
          appearance.buttonStyle,
          bgAnimStyle,
          isSelected ? appearance.selectedButtonStyle : null,
        ]}
      >
        <View
          style={[
            styles.buttonInner,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonBorderRadius,
            },
            appearance.buttonInnerStyle,
          ]}
        >
          {action?.renderIcon?.({
            size: iconSize,
            color: iconColor,
            selected: isSelected,
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btnWrap: {
    position: "absolute",
  },
  buttonInner: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
