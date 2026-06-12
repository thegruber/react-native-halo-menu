/**
 * @file state.ts
 * @description Internal interaction state — the SharedValue graph plus show/hide
 * orchestration. Deliberately NOT exported from the package: the public surface is
 * `useHaloMenu` (visible + hide) and the components.
 */

import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HaloAction, HaloMenuPreviewRenderer } from "../types";

export interface HaloMenuActivePreview {
  render: HaloMenuPreviewRenderer;
  width: number;
  height: number;
}

export interface HaloMenuState {
  menuVisible: SharedValue<boolean>;
  /** Menu center (touch point, clamped to screen bounds). */
  centerX: SharedValue<number>;
  centerY: SharedValue<number>;
  /** Raw touch origin — never shifted, never overwritten by drag. */
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  buttonCount: SharedValue<number>;
  selectedIndex: SharedValue<number>;
  /** Pre-computed arc center angle (avoids recomputing in worklet). */
  arcAngle: SharedValue<number>;
  /** Lifted preview position & size — set by measure() on gesture start. */
  cardPageX: SharedValue<number>;
  cardPageY: SharedValue<number>;
  cardMeasuredWidth: SharedValue<number>;
  cardMeasuredHeight: SharedValue<number>;
  /** Preview lift scale — shared between preview and original. */
  cardLiftScale: SharedValue<number>;
  /** Preview tilt angle (degrees) — computed from touch offset. */
  cardTiltDeg: SharedValue<number>;
  showMenu: (
    touchX: number,
    touchY: number,
    actions: HaloAction[],
    renderPreview: HaloMenuPreviewRenderer,
  ) => void;
  /** Gesture-path close — visibility only; the trigger's finalize owns cleanup. */
  hideMenu: () => void;
  /** Imperative full-cleanup close — animates lift/tilt home and clears the preview. */
  closeMenu: () => void;
  /** Clear preview data — call from withTiming callback when close finishes. */
  clearPreview: () => void;
  actionSlots: number[];
  renderActions: HaloAction[];
  activePreview: HaloMenuActivePreview | null;
}

export const HaloMenuStateCtx = createContext<HaloMenuState | null>(null);

export function useHaloMenuState(): HaloMenuState {
  const state = useContext(HaloMenuStateCtx);
  if (!state) throw new Error("HaloMenu components must be used inside <HaloMenuProvider>");
  return state;
}
