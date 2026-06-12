/**
 * @file HaloMenuTrigger.tsx
 * @description The 90% component — wraps children in the long-press pan gesture and the
 * measured view. Drop to `useHaloMenuTrigger` when the measured view must differ from
 * the gesture host.
 */

import { useCallback, useId, useMemo, type ReactNode } from "react";
import type { ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import { getHaloMenuAccessibilityProps } from "./accessibility";
import { HaloMenuPreviewFrame } from "./HaloMenuPreviewFrame";
import { useHaloMenuTrigger, type UseHaloMenuTriggerOptions } from "./useHaloMenuTrigger";
import type { HaloMenuPreviewRenderer } from "./types";

export interface HaloMenuTriggerProps
  extends
    Omit<UseHaloMenuTriggerOptions, "id" | "renderPreview">,
    Omit<ViewProps, "children" | "id"> {
  /** Stable id for list cells; defaults to a React-generated instance id. */
  id?: string;
  /**
   * Renders the lifted preview. Defaults to re-rendering `children` inside a
   * `HaloMenuPreviewFrame`; pass a renderer to control radius, inset, or content.
   */
  renderPreview?: HaloMenuPreviewRenderer;
  children: ReactNode;
}

export function HaloMenuTrigger({
  id,
  children,
  actions,
  renderPreview,
  onOpen,
  onTouchDown,
  onFinalize,
  interceptAction,
  onCloseComplete,
  fallbackWidth,
  fallbackHeight,
  disabledWhen,
  warnOnDuplicateId,
  hideOnUnmount,
  accessibilityActions,
  onAccessibilityAction,
  ...viewProps
}: HaloMenuTriggerProps) {
  const autoId = useId();
  const defaultRenderPreview = useCallback<HaloMenuPreviewRenderer>(
    ({ width, height }) => (
      <HaloMenuPreviewFrame width={width} height={height}>
        {children}
      </HaloMenuPreviewFrame>
    ),
    [children],
  );
  const { panGesture, animatedRef } = useHaloMenuTrigger({
    id: id ?? autoId,
    actions,
    renderPreview: renderPreview ?? defaultRenderPreview,
    onOpen,
    onTouchDown,
    onFinalize,
    interceptAction,
    onCloseComplete,
    fallbackWidth,
    fallbackHeight,
    disabledWhen,
    warnOnDuplicateId,
    hideOnUnmount,
  });
  const accessibilityProps = useMemo(
    () =>
      getHaloMenuAccessibilityProps(actions, {
        interceptAction,
        accessibilityActions,
        onAccessibilityAction,
      }),
    [actions, interceptAction, accessibilityActions, onAccessibilityAction],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        {...viewProps}
        {...accessibilityProps}
        ref={animatedRef}
        // measure() needs a real native view behind the trigger.
        collapsable={false}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
