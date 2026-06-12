/**
 * @file HaloMenuProvider.tsx
 * @description Mount once near the app root (inside GestureHandlerRootView). Owns the
 * SharedValue graph, show/hide orchestration, and the full-screen overlay. The overlay
 * is `pointerEvents="none"` so the pan gesture on the trigger stays alive.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, useColorScheme, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  type SharedValue,
  type WithTimingConfig,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  DEFAULT_MOTION,
  DEFAULT_ON_WARN,
  HaloMenuConfigCtx,
  getDefaultColors,
  type HaloMenuConfig,
} from "./internal/config";
import { HaloMenuBackdrop } from "./internal/HaloMenuBackdrop";
import { HaloMenuButton } from "./internal/HaloMenuButton";
import { HaloMenuHoverLabel } from "./internal/HaloMenuHoverLabel";
import { BUTTON_SLOTS, MAX_ACTIONS, clampCenter, computeArcAngle } from "./internal/geometry";
import { HaloMenuStateCtx, type HaloMenuActivePreview, type HaloMenuState } from "./internal/state";
import type {
  HaloAction,
  HaloMenuColors,
  HaloMenuHaptics,
  HaloMenuMotion,
  HaloMenuPreviewRenderer,
  HaloMenuProviderProps,
} from "./types";

// ─── Touch origin dot ────────────────────────────────────────────────────

const DOT_SIZE = 44;

function TouchOriginDot({
  menuVisible,
  originX,
  originY,
  timingConfig,
}: {
  menuVisible: SharedValue<boolean>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  timingConfig: WithTimingConfig;
}) {
  const dotStyle = useAnimatedStyle(() => {
    "worklet";
    const vis = menuVisible.get();
    return {
      opacity: withTiming(vis ? 0.35 : 0, timingConfig),
      transform: [
        { translateX: originX.get() - DOT_SIZE / 2 },
        { translateY: originY.get() - DOT_SIZE / 2 },
        { scale: withTiming(vis ? 1 : 0.5, timingConfig) },
      ],
    };
  });

  return <Animated.View style={[styles.originDot, dotStyle]} />;
}

// ─── Overlay ─────────────────────────────────────────────────────────────

function HaloMenuOverlay({ state, config }: { state: HaloMenuState; config: HaloMenuConfig }) {
  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {config.renderBackdrop ? (
        config.renderBackdrop({
          visible: state.menuVisible,
          isDarkMode: config.isDarkMode,
        })
      ) : (
        <HaloMenuBackdrop visible={state.menuVisible} />
      )}

      {state.activePreview?.render({
        width: state.activePreview.width,
        height: state.activePreview.height,
      })}

      <TouchOriginDot
        menuVisible={state.menuVisible}
        originX={state.originX}
        originY={state.originY}
        timingConfig={config.timingConfig}
      />

      {BUTTON_SLOTS.map((i) => (
        <HaloMenuButton key={i} index={i} action={state.renderActions[i]} />
      ))}

      <HaloMenuHoverLabel />
    </Animated.View>
  );
}

// ─── Provider ────────────────────────────────────────────────────────────

const NO_HAPTICS: HaloMenuHaptics = {};

export function HaloMenuProvider({
  children,
  colors: colorsProp,
  colorScheme,
  motion: motionProp,
  haptics = NO_HAPTICS,
  suppressActivationWhen,
  renderBackdrop,
  labelTextStyle,
  onWarn = DEFAULT_ON_WARN,
  overlayContainerComponent: OverlayContainer,
}: HaloMenuProviderProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const systemScheme = useColorScheme();
  const isDarkMode = (colorScheme ?? systemScheme) === "dark";

  // Latched at mount: the trigger hook's never-recreated pan closure and the
  // per-frame worklets capture these on first render.
  const [motion] = useState<HaloMenuMotion>(() => ({
    ...DEFAULT_MOTION,
    ...motionProp,
  }));
  const [timingConfig] = useState<WithTimingConfig>(() => ({
    duration: motion.duration,
    easing: Easing.out(Easing.quad),
    reduceMotion: ReduceMotion.System,
  }));

  const colors: HaloMenuColors = {
    ...getDefaultColors(isDarkMode),
    ...colorsProp,
  };

  const config = useMemo<HaloMenuConfig>(
    () => ({
      colors,
      isDarkMode,
      motion,
      timingConfig,
      haptics,
      suppressActivationWhen,
      renderBackdrop,
      labelTextStyle,
      onWarn,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colors compared by field, motion/timing latched at mount
    [
      colors.foreground,
      colors.surface,
      colors.destructive,
      colors.selectionForeground,
      isDarkMode,
      haptics,
      suppressActivationWhen,
      renderBackdrop,
      labelTextStyle,
      onWarn,
    ],
  );

  const menuVisible = useSharedValue(false);
  const centerX = useSharedValue(0);
  const centerY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const buttonCount = useSharedValue(0);
  const selectedIndex = useSharedValue(-1);
  const arcAngle = useSharedValue(0);
  const cardPageX = useSharedValue(0);
  const cardPageY = useSharedValue(0);
  const cardMeasuredWidth = useSharedValue(0);
  const cardMeasuredHeight = useSharedValue(0);
  const cardLiftScale = useSharedValue(1);
  const cardTiltDeg = useSharedValue(0);
  const actionsRef = useRef<HaloAction[]>([]);
  const [renderActions, setRenderActions] = useState<HaloAction[]>([]);
  const [activePreview, setActivePreview] = useState<HaloMenuActivePreview | null>(null);

  const showMenu = useCallback(
    (tx: number, ty: number, actions: HaloAction[], renderPreview: HaloMenuPreviewRenderer) => {
      let visibleActions = actions;
      if (actions.length > MAX_ACTIONS) {
        onWarn(
          `showMenu received ${actions.length} actions — only the first ${MAX_ACTIONS} render.`,
        );
        visibleActions = actions.slice(0, MAX_ACTIONS);
      }

      actionsRef.current = visibleActions;
      setRenderActions(visibleActions);
      // Attach measured dimensions for static sizing (no layout animation).
      setActivePreview({
        render: renderPreview,
        width: cardMeasuredWidth.get(),
        height: cardMeasuredHeight.get(),
      });

      const angle = computeArcAngle(tx, ty, screenWidth);
      const clamped = clampCenter(tx, ty, screenWidth, screenHeight);

      arcAngle.set(angle);
      centerX.set(clamped.cx);
      centerY.set(clamped.cy);
      originX.set(tx);
      originY.set(ty);
      fingerX.set(tx);
      fingerY.set(ty);
      buttonCount.set(visibleActions.length);
      selectedIndex.set(-1);
      menuVisible.set(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs
    [screenWidth, screenHeight, onWarn],
  );

  const hideMenu = useCallback(() => {
    menuVisible.set(false);
    selectedIndex.set(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs
  }, []);

  // Called from the close-animation completion callback so no stale preview
  // flashes on scroll.
  const clearPreview = useCallback(() => {
    setActivePreview(null);
  }, []);

  const state = useMemo<HaloMenuState>(
    () => ({
      menuVisible,
      centerX,
      centerY,
      originX,
      originY,
      fingerX,
      fingerY,
      buttonCount,
      selectedIndex,
      arcAngle,
      cardPageX,
      cardPageY,
      cardMeasuredWidth,
      cardMeasuredHeight,
      cardLiftScale,
      cardTiltDeg,
      showMenu,
      hideMenu,
      clearPreview,
      actionsRef,
      renderActions,
      activePreview,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs
    [showMenu, hideMenu, clearPreview, renderActions, activePreview],
  );

  const overlay = <HaloMenuOverlay state={state} config={config} />;

  return (
    <HaloMenuConfigCtx.Provider value={config}>
      <HaloMenuStateCtx.Provider value={state}>
        {children}
        {OverlayContainer ? <OverlayContainer>{overlay}</OverlayContainer> : overlay}
      </HaloMenuStateCtx.Provider>
    </HaloMenuConfigCtx.Provider>
  );
}

const styles = StyleSheet.create({
  originDot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "white",
  },
});
