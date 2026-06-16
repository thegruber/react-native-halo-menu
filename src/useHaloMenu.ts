/**
 * @file useHaloMenu.ts
 * @description Public handle to the menu — visibility, imperative close, and the
 * normalized lift progress driver. The full SharedValue graph stays private so
 * internals can evolve without breaking consumers.
 */

import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useHaloMenuState } from "./internal/state";
import type { HaloMenuHandle } from "./types";

export function useHaloMenu(): HaloMenuHandle {
  const { menuVisible, closeMenu, cardLiftProgress } = useHaloMenuState();
  return useMemo(
    () => ({ visible: menuVisible, hide: closeMenu, liftProgress: cardLiftProgress }),
    [menuVisible, closeMenu, cardLiftProgress],
  );
}

/**
 * Lift progress (0 rest → 1 fully lifted), for animating preview decorations
 * from inside `renderPreview`. Read it in your own `useAnimatedStyle`.
 */
export function useHaloMenuPreviewProgress(): SharedValue<number> {
  return useHaloMenuState().cardLiftProgress;
}
