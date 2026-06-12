/**
 * @file useHaloMenuTrigger.ts
 * @description Escape-hatch hook behind `HaloMenuTrigger` — pan gesture, UI↔JS event
 * bridge, cooldown, tap suppression, hover debounce, hit-test math. Use it directly when
 * the measured view differs from the gesture host (hero layouts, FlashList cells).
 */

import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useWindowDimensions } from "react-native";
import type Animated from "react-native-reanimated";
import {
  type AnimatedRef,
  type SharedValue,
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import { callOptionalCallback } from "./internal/callbacks";
import { useHaloMenuConfig } from "./internal/config";
import { hitTestArc } from "./internal/geometry";
import { useHaloMenuState } from "./internal/state";
import type { HaloAction, HaloMenuPreviewRenderer } from "./types";

// ── Event codes ─────────────────────────────────────────────────────────

const EVT_START = 1;
const EVT_BUTTON_ENTER = 2;
const EVT_TOUCH_DOWN = 3;
const EVT_FINALIZE = 4;

// ── Module-level dispatch registry ──────────────────────────────────────

const _triggerHandlers = new Map<string, (code: number, x: number, y: number) => void>();

function _dispatchTrigger(key: string, code: number, x: number, y: number) {
  _triggerHandlers.get(key)?.(code, x, y);
}

// ── Types ───────────────────────────────────────────────────────────────

export interface UseHaloMenuTriggerOptions {
  /** Unique id for the dispatch registry — item id for list cells, a fixed string for singletons. */
  id: string;
  /** Menu actions to show. Latched into a ref on gesture start. */
  actions: HaloAction[];
  /** Renders the lifted preview — latched when the menu opens. */
  renderPreview: HaloMenuPreviewRenderer;
  /** Called when the long-press commits and the menu opens. */
  onOpen?: () => void;
  /** Called when the long-press pan receives its first touch. */
  onTouchDown?: () => void;
  /** Called whenever the long-press pan finalizes, including fail/cancel. */
  onFinalize?: () => void;
  /** Return true to suppress action.onPress() — the caller handles it (e.g. deferred select). */
  interceptAction?: (action: HaloAction, index: number) => boolean;
  /** Called after the preview settles closed (e.g. fire a deferred action). */
  onCloseComplete?: () => void;
  /**
   * Fallback width when measure() returns null (FlashList recycling).
   * SharedValue identity is latched on first render — mutate it, don't swap it.
   */
  fallbackWidth?: SharedValue<number>;
  /** Fallback height when measure() returns null (FlashList recycling). */
  fallbackHeight?: SharedValue<number>;
  /**
   * Checked on touch down — while true, the gesture fails immediately.
   * SharedValue identity is latched on first render — mutate it, don't swap it.
   */
  disabledWhen?: SharedValue<boolean>;
  /** Warn via the provider's onWarn if another instance registered the same id. */
  warnOnDuplicateId?: boolean;
  /** Close the menu when this trigger unmounts (use for singleton/hero triggers). */
  hideOnUnmount?: boolean;
}

export interface UseHaloMenuTriggerReturn {
  /** Configured pan gesture — wrap the trigger in <GestureDetector gesture={panGesture}>. */
  panGesture: GestureType;
  /** Animated ref to attach to the measured Animated.View. */
  animatedRef: AnimatedRef<Animated.View>;
  /** True while the menu is active or closing — for stray-tap suppression. */
  menuActiveRef: RefObject<boolean>;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useHaloMenuTrigger({
  id,
  actions,
  renderPreview,
  onOpen,
  onTouchDown,
  onFinalize,
  interceptAction,
  onCloseComplete: onCloseCompleteCb,
  fallbackWidth,
  fallbackHeight,
  disabledWhen,
  warnOnDuplicateId,
  hideOnUnmount,
}: UseHaloMenuTriggerOptions): UseHaloMenuTriggerReturn {
  const { width: screenWidth } = useWindowDimensions();
  const {
    menuVisible,
    centerX,
    centerY,
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
  } = useHaloMenuState();
  // Motion + timing are latched at provider mount, so the never-recreated
  // gesture closure below can safely capture them.
  const {
    motion,
    timingConfig,
    haptics,
    suppressActivationWhen,
    onWarn,
    layout,
    callbackWarningNames,
  } = useHaloMenuConfig();
  const hitRadius = layout.hitRadius;
  const radius = layout.radius;
  const arcGapRad = (layout.arcGapDegrees * Math.PI) / 180;
  // Depend on the callbacks, not the haptics object — an inline object prop
  // must not churn the dispatch registration below.
  const onOpenHaptic = haptics.onOpen;
  const onHoverHaptic = haptics.onHover;

  const animatedRef = useAnimatedRef<Animated.View>();
  const lastSelected = useSharedValue(-1);
  const endSelectedIndex = useSharedValue(-1);
  const cooldown = useSharedValue(false);
  // RNGH #2620 — iOS can fire onStart twice after activateAfterLongPress.
  const started = useSharedValue(false);
  const hoverHapticGuardRef = useRef({ index: -1, at: 0 });
  const localActionsRef = useRef<HaloAction[]>([]);
  const menuActiveRef = useRef(false);
  const clearPreviewRef = useRef(clearPreview);
  clearPreviewRef.current = clearPreview;
  const onCloseCompleteCbRef = useRef(onCloseCompleteCb);
  onCloseCompleteCbRef.current = onCloseCompleteCb;
  const screenW = useSharedValue(screenWidth);
  const actionsCount = useSharedValue(actions.length);

  useEffect(() => {
    screenW.set(screenWidth);
  }, [screenWidth, screenW]);

  useEffect(() => {
    actionsCount.set(actions.length);
  }, [actions.length, actionsCount]);

  // ── Gesture event bus ───────────────────────────────────────────────

  const gestureEventCode = useSharedValue(0);
  const gestureEventX = useSharedValue(0);
  const gestureEventY = useSharedValue(0);
  const gestureEventSeq = useSharedValue(0);

  const fireHaptic = useCallback(
    (name: string, callback: (() => void | Promise<void>) | undefined) => {
      callOptionalCallback(name, callback, onWarn, callbackWarningNames);
    },
    [callbackWarningNames, onWarn],
  );

  const handleGestureEvent = useCallback(
    (code: number, x: number, y: number) => {
      if (code === EVT_START) {
        menuActiveRef.current = true;
        fireHaptic("haptics.onOpen", onOpenHaptic);
        hoverHapticGuardRef.current = { index: -1, at: 0 };
        onOpen?.();
        localActionsRef.current = actions;

        showMenu(x, y, actions, renderPreview);
      } else if (code === EVT_BUTTON_ENTER) {
        const now = Date.now();
        const nextIndex = x;
        const { index: lastIndex, at: lastAt } = hoverHapticGuardRef.current;

        if (nextIndex !== lastIndex || now - lastAt > 80) {
          hoverHapticGuardRef.current = { index: nextIndex, at: now };
          fireHaptic("haptics.onHover", onHoverHaptic);
        }
      } else if (code === EVT_FINALIZE) {
        onFinalize?.();
        // y === 0 → the long-press never activated (tap, scroll-past, failOffset):
        // nothing opened, so there is nothing to select or close.
        if (y !== 1) return;
        const idx = x;
        if (idx >= 0) {
          const action = localActionsRef.current[idx];
          if (action) {
            const intercepted = interceptAction?.(action, idx) ?? false;
            if (!intercepted) {
              void action.onPress();
            }
          }
        }
        hideMenu();
        // Clear after close animation so the host Pressable's stray tap is suppressed.
        setTimeout(() => {
          menuActiveRef.current = false;
        }, 300);
      } else if (code === EVT_TOUCH_DOWN) {
        onTouchDown?.();
      }
    },
    [
      actions,
      fireHaptic,
      hideMenu,
      interceptAction,
      onFinalize,
      onHoverHaptic,
      onOpen,
      onOpenHaptic,
      onTouchDown,
      renderPreview,
      showMenu,
    ],
  );

  // ── Dispatch registration ───────────────────────────────────────────

  useLayoutEffect(() => {
    if (__DEV__ && warnOnDuplicateId && _triggerHandlers.has(id)) {
      onWarn(`useHaloMenuTrigger: handler "${id}" overwritten — multiple instances?`);
    }
    _triggerHandlers.set(id, handleGestureEvent);

    return () => {
      if (_triggerHandlers.get(id) === handleGestureEvent) {
        _triggerHandlers.delete(id);
      }
    };
  }, [id, handleGestureEvent, onWarn, warnOnDuplicateId]);

  // ── Unmount cleanup ─────────────────────────────────────────────────

  useEffect(() => {
    if (!hideOnUnmount) return;
    return () => {
      // Full-cleanup close: no gesture will finalize for an unmounted trigger,
      // so the provider must reset lift/tilt and clear the preview itself.
      closeMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on unmount
  }, []);

  // ── UI → JS bridge ─────────────────────────────────────────────────

  useAnimatedReaction(
    () => {
      "worklet";
      return gestureEventSeq.get();
    },
    (curr, prev) => {
      "worklet";
      if (curr !== prev && curr > 0) {
        scheduleOnRN(
          _dispatchTrigger,
          id,
          gestureEventCode.get(),
          gestureEventX.get(),
          gestureEventY.get(),
        );
      }
    },
  );

  // Refs ensure the frozen scheduleOnRN closure always calls the latest version.
  const onCloseComplete = () => {
    clearPreviewRef.current();
    onCloseCompleteCbRef.current?.();
    setTimeout(() => cooldown.set(false), 50);
  };

  // ── Pan gesture ─────────────────────────────────────────────────────

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(motion.longPressDuration)
        .maxPointers(1)
        // Fail the gesture if the finger drifts before the long-press commits,
        // so back-swipe / scroll / transition gestures can't accidentally open
        // the menu during the hold window.
        .failOffsetX([-8, 8])
        .failOffsetY([-8, 8])
        .onTouchesDown((_e, stateManager) => {
          "worklet";
          endSelectedIndex.set(-1);
          started.set(false);
          if (disabledWhen && disabledWhen.get()) {
            stateManager.fail();
            return;
          }
          if (actionsCount.get() === 0) {
            stateManager.fail();
            return;
          }
          if (suppressActivationWhen !== undefined && suppressActivationWhen.get()) {
            stateManager.fail();
            return;
          }
          // One menu at a time: a second finger touching another trigger while a
          // menu is open must not hijack the shared preview/lift state.
          if (menuVisible.get()) {
            stateManager.fail();
            return;
          }
          gestureEventCode.set(EVT_TOUCH_DOWN);
          gestureEventX.set(0);
          gestureEventY.set(0);
          gestureEventSeq.set(gestureEventSeq.get() + 1);
        })
        .onStart((e) => {
          "worklet";
          if (started.get()) return;
          if (cooldown.get()) return;
          if (suppressActivationWhen !== undefined && suppressActivationWhen.get()) return;
          started.set(true);

          const m = measure(animatedRef);
          const px = m ? m.pageX : e.absoluteX - e.x;
          const py = m ? m.pageY : e.absoluteY - e.y;
          const w = m
            ? m.width
            : (fallbackWidth ? fallbackWidth.get() : 0) || cardMeasuredWidth.get();
          const h = m
            ? m.height
            : (fallbackHeight ? fallbackHeight.get() : 0) || cardMeasuredHeight.get();

          cardPageX.set(px);
          cardPageY.set(py);
          cardMeasuredWidth.set(w);
          cardMeasuredHeight.set(h);

          const tiltSign = e.absoluteX >= screenW.get() / 2 ? 1 : -1;
          cardTiltDeg.set(withTiming(tiltSign * motion.tiltDeg, timingConfig));
          endSelectedIndex.set(-1);
          cardLiftScale.set(motion.pressScale);
          cardLiftScale.set(withTiming(motion.liftScale, timingConfig));

          gestureEventCode.set(EVT_START);
          gestureEventX.set(e.absoluteX);
          gestureEventY.set(e.absoluteY);
          gestureEventSeq.set(gestureEventSeq.get() + 1);
        })
        .onUpdate((e) => {
          "worklet";
          fingerX.set(e.absoluteX);
          fingerY.set(e.absoluteY);

          const count = buttonCount.get();
          if (count === 0 || !menuVisible.get()) return;

          const newSelected = hitTestArc(
            e.absoluteX,
            e.absoluteY,
            centerX.get(),
            centerY.get(),
            count,
            arcAngle.get(),
            radius,
            hitRadius,
            arcGapRad,
          );

          selectedIndex.set(newSelected);

          if (newSelected !== lastSelected.get()) {
            lastSelected.set(newSelected);
            if (newSelected >= 0) {
              gestureEventCode.set(EVT_BUTTON_ENTER);
              gestureEventX.set(newSelected);
              gestureEventY.set(0);
              gestureEventSeq.set(gestureEventSeq.get() + 1);
            }
          }
        })
        .onEnd(() => {
          "worklet";
          endSelectedIndex.set(selectedIndex.get());
          lastSelected.set(-1);
        })
        .onFinalize(() => {
          "worklet";
          const didActivate = started.get();
          lastSelected.set(-1);

          // Close orchestration only for sessions that actually opened: a failed
          // gesture (tap, scroll-past, failOffset) must not animate the shared
          // lift values — that would drop another trigger's open menu — and must
          // not arm the cooldown, or tap-then-hold goes dead for ~one duration.
          if (didActivate) {
            cardLiftScale.set(
              // Deliberately not gated on `finished`: if a provider-side close
              // cancels this timing, cooldown must still release or every
              // future open on this trigger stays blocked.
              withTiming(1, timingConfig, () => {
                "worklet";
                scheduleOnRN(onCloseComplete);
              }),
            );
            cardTiltDeg.set(withTiming(0, timingConfig));
            cooldown.set(true);
          }

          gestureEventCode.set(EVT_FINALIZE);
          gestureEventX.set(endSelectedIndex.get());
          gestureEventY.set(didActivate ? 1 : 0);
          gestureEventSeq.set(gestureEventSeq.get() + 1);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gesture must never recreate; motion/timing latched at provider mount
    [],
  );

  return { panGesture, animatedRef, menuActiveRef };
}
