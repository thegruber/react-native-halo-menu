/**
 * @file types.ts
 * @description Public types for react-native-halo-menu.
 */

import type { ReactNode } from "react";
import type { StyleProp, TextStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

// ─── Actions ─────────────────────────────────────────────────────────────

export interface HaloIconProps {
  size: number;
  /** Resolved icon color — already accounts for selection and destructive state. */
  color: string;
  selected: boolean;
}

/**
 * Menu-agnostic action shape. Icons come in as a render prop so the package
 * stays decoupled from any icon system.
 */
export interface HaloAction {
  key: string;
  title: string;
  destructive?: boolean;
  onPress: () => void | Promise<void>;
  renderIcon?: (props: HaloIconProps) => ReactNode;
}

// ─── Preview ─────────────────────────────────────────────────────────────

export interface HaloMenuPreviewSize {
  /** Measured trigger dimensions — set once at gesture start, not animated. */
  width: number;
  height: number;
}

/**
 * Renders the lifted preview shown above the backdrop while the menu is open.
 * Wrap the content in `HaloMenuPreviewFrame` to get the lift/tilt/shadow
 * transform for free.
 */
export type HaloMenuPreviewRenderer = (size: HaloMenuPreviewSize) => ReactNode;

// ─── Colors ──────────────────────────────────────────────────────────────

export interface HaloMenuColors {
  /** Hover label, resting icon tint, and selected-button fill. */
  foreground: string;
  /** Button resting background. */
  surface: string;
  /** Destructive action tint and selected fill. */
  destructive: string;
  /** Icon tint while its button is selected (sits on the inverted fill). */
  selectionForeground: string;
}

// ─── Motion ──────────────────────────────────────────────────────────────

export interface HaloMenuMotion {
  /** Long-press activation threshold (ms). */
  longPressDuration: number;
  /** Unified duration for open/close transitions (ms) — lift, tilt, backdrop, origin dot. */
  duration: number;
  /** Preview scale-up while the menu is open. */
  liftScale: number;
  /** Press-down scale applied just before the lift animates. */
  pressScale: number;
  /** Max preview tilt (degrees), signed by which screen half was touched. */
  tiltDeg: number;
  /** Delay between button entrances (ms). */
  staggerDelay: number;
  /** Button scale while the finger hovers it. */
  selectedScale: number;
  /** Hover label fade duration (ms). */
  labelFadeDuration: number;
}

// ─── Haptics ─────────────────────────────────────────────────────────────

export interface HaloMenuHaptics {
  /** Fired when the long-press commits and the menu opens. */
  onOpen?: () => void;
  /** Fired when the finger enters a button (debounced 80ms per index by the core). */
  onHover?: () => void;
}

// ─── Backdrop ────────────────────────────────────────────────────────────

export interface HaloMenuBackdropProps {
  visible: SharedValue<boolean>;
  isDarkMode: boolean;
}

export type HaloMenuBackdropRenderer = (props: HaloMenuBackdropProps) => ReactNode;

// ─── Provider props ──────────────────────────────────────────────────────

export interface HaloMenuProviderProps {
  children: ReactNode;
  /** Overrides merged over scheme-derived defaults. */
  colors?: Partial<HaloMenuColors>;
  /** Defaults to the OS color scheme. */
  colorScheme?: "light" | "dark";
  /** Latched at mount — the pan gesture closure captures these values once. */
  motion?: Partial<HaloMenuMotion>;
  haptics?: HaloMenuHaptics;
  /** While truthy, long-press activation is suppressed (e.g. during navigation transitions). */
  suppressActivationWhen?: SharedValue<number> | SharedValue<boolean>;
  /** Replaces the default solid-fade backdrop (e.g. with a blur view). */
  renderBackdrop?: HaloMenuBackdropRenderer;
  /** Merged over the default hover-label style (32px, lowercase). */
  labelTextStyle?: StyleProp<TextStyle>;
  /** Dev diagnostics channel — defaults to console.warn in __DEV__. */
  onWarn?: (message: string) => void;
}

// ─── Public menu handle ──────────────────────────────────────────────────

export interface HaloMenuHandle {
  /** True while the menu is open — readable from worklets. */
  visible: SharedValue<boolean>;
  /** Imperatively close the menu (e.g. when the trigger's screen unmounts). */
  hide: () => void;
}
