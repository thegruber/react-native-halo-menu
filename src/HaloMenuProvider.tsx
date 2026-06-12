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
import { scheduleOnRN } from "react-native-worklets";
import {
  DEFAULT_MOTION,
  DEFAULT_ON_WARN,
  HaloMenuConfigCtx,
  getDefaultColors,
  resolveAppearance,
  resolveLayout,
  type HaloMenuConfig,
} from "./internal/config";
import { HaloMenuBackdrop } from "./internal/HaloMenuBackdrop";
import { HaloMenuButton } from "./internal/HaloMenuButton";
import { HaloMenuHoverLabel } from "./internal/HaloMenuHoverLabel";
import { clampCenter, computeArcAngle } from "./internal/geometry";
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

function TouchOriginDot({
  menuVisible,
  originX,
  originY,
  timingConfig,
  config,
}: {
  menuVisible: SharedValue<boolean>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  timingConfig: WithTimingConfig;
  config: HaloMenuConfig;
}) {
  const showOriginDot = config.appearance.showOriginDot;
  const dotSize = config.appearance.originDotSize;
  const dotOpacity = config.appearance.originDotOpacity;

  const dotStyle = useAnimatedStyle(() => {
    "worklet";
    const vis = menuVisible.get() && showOriginDot;
    return {
      opacity: withTiming(vis ? dotOpacity : 0, timingConfig),
      transform: [
        { translateX: originX.get() - dotSize / 2 },
        { translateY: originY.get() - dotSize / 2 },
        { scale: withTiming(vis ? 1 : 0.5, timingConfig) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.originDot,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: config.appearance.originDotColor,
        },
        config.appearance.originDotStyle,
        dotStyle,
      ]}
    />
  );
}

// ─── Overlay ─────────────────────────────────────────────────────────────

function HaloMenuOverlay({ state, config }: { state: HaloMenuState; config: HaloMenuConfig }) {
  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      // The gesture-driven overlay is never navigable by assistive technology —
      // screen-reader users act through the trigger's native accessibility
      // actions — so keep its (always-mounted) contents out of the a11y tree.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
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
        config={config}
      />

      {state.actionSlots.map((i) => (
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
  layout: layoutProp,
  appearance: appearanceProp,
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
  const [layout] = useState(() => resolveLayout(layoutProp));
  const [appearance] = useState(() => resolveAppearance(appearanceProp));
  const [actionSlots] = useState(() => Array.from({ length: layout.actionLimit }, (_, i) => i));
  const callbackWarningNamesRef = useRef(new Set<string>());

  const colors: HaloMenuColors = {
    ...getDefaultColors(isDarkMode),
    ...colorsProp,
  };

  const config = useMemo<HaloMenuConfig>(
    () => ({
      colors,
      isDarkMode,
      motion,
      layout,
      appearance,
      timingConfig,
      haptics,
      suppressActivationWhen,
      renderBackdrop,
      labelTextStyle,
      onWarn,
      callbackWarningNames: callbackWarningNamesRef.current,
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
  const [renderActions, setRenderActions] = useState<HaloAction[]>([]);
  const [activePreview, setActivePreview] = useState<HaloMenuActivePreview | null>(null);
  // Ref mirror so the stable closeMenu callback can no-op without subscribing
  // to preview state (its identity must never go stale in unmount cleanups).
  const activePreviewRef = useRef<HaloMenuActivePreview | null>(null);

  const showMenu = useCallback(
    (tx: number, ty: number, actions: HaloAction[], renderPreview: HaloMenuPreviewRenderer) => {
      let visibleActions = actions;
      if (actions.length > layout.actionLimit) {
        onWarn(
          `showMenu received ${actions.length} actions — only the first ${layout.actionLimit} render.`,
        );
        visibleActions = actions.slice(0, layout.actionLimit);
      }

      setRenderActions(visibleActions);
      // Attach measured dimensions for static sizing (no layout animation).
      const preview: HaloMenuActivePreview = {
        render: renderPreview,
        width: cardMeasuredWidth.get(),
        height: cardMeasuredHeight.get(),
      };
      activePreviewRef.current = preview;
      setActivePreview(preview);

      const angle = computeArcAngle(tx, ty, screenWidth, layout.topZone);
      const clamped = clampCenter(tx, ty, screenWidth, screenHeight, layout.edgeMargin);

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
    [screenWidth, screenHeight, layout.actionLimit, layout.edgeMargin, layout.topZone, onWarn],
  );

  // Gesture-path primitive: the trigger's onFinalize owns the close animation
  // and preview clearing, so this only flips visibility.
  const hideMenu = useCallback(() => {
    menuVisible.set(false);
    selectedIndex.set(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs
  }, []);

  // Called from the close-animation completion callback so no stale preview
  // flashes on scroll.
  const clearPreview = useCallback(() => {
    activePreviewRef.current = null;
    setActivePreview(null);
  }, []);

  // Full-cleanup close for the imperative path (useHaloMenu().hide,
  // hideOnUnmount): no gesture will finalize, so the provider must reset the
  // lift/tilt values and clear the preview itself. If a release races this,
  // the trigger's own finalize animation supersedes ours (finished === false)
  // and its completion path takes over the cleanup.
  const closeMenu = useCallback(() => {
    if (!menuVisible.get() && activePreviewRef.current === null) return;
    menuVisible.set(false);
    selectedIndex.set(-1);
    cardTiltDeg.set(withTiming(0, timingConfig));
    cardLiftScale.set(
      withTiming(1, timingConfig, (finished) => {
        "worklet";
        if (finished) scheduleOnRN(clearPreview);
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs; timing latched at mount
  }, [clearPreview, timingConfig]);

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
      closeMenu,
      clearPreview,
      actionSlots,
      renderActions,
      activePreview,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs
    [showMenu, hideMenu, closeMenu, clearPreview, actionSlots, renderActions, activePreview],
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
  },
});
