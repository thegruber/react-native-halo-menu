/**
 * @file useHaloMenu.ts
 * @description Narrow public handle to the menu — visibility and imperative close.
 * The full SharedValue graph stays private so internals can evolve without
 * breaking consumers.
 */

import { useMemo } from "react";
import { useHaloMenuState } from "./internal/state";
import type { HaloMenuHandle } from "./types";

export function useHaloMenu(): HaloMenuHandle {
  const { menuVisible, hideMenu } = useHaloMenuState();
  return useMemo(() => ({ visible: menuVisible, hide: hideMenu }), [menuVisible, hideMenu]);
}
