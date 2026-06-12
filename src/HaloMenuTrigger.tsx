/**
 * @file HaloMenuTrigger.tsx
 * @description The 90% component — wraps children in the long-press pan gesture and the
 * measured view. Drop to `useHaloMenuTrigger` when the measured view must differ from
 * the gesture host.
 */

import { useId, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import { useHaloMenuTrigger, type UseHaloMenuTriggerOptions } from "./useHaloMenuTrigger";

export interface HaloMenuTriggerProps extends Omit<UseHaloMenuTriggerOptions, "id"> {
  /** Stable id for list cells; defaults to a React-generated instance id. */
  id?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function HaloMenuTrigger({ id, style, children, ...options }: HaloMenuTriggerProps) {
  const autoId = useId();
  const { panGesture, animatedRef } = useHaloMenuTrigger({
    id: id ?? autoId,
    ...options,
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View ref={animatedRef} collapsable={false} style={style}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
