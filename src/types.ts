/**
 * @file types.ts
 * @description Public types for react-native-halo-menu.
 */

import type { ComponentType, ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
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

// ─── Layout ──────────────────────────────────────────────────────────────

export interface HaloMenuLayout {
  /** Visual button diameter. */
  buttonSize: number;
  /** Button corner radius. Defaults to a circle. */
  buttonBorderRadius: number;
  /** Icon render-prop size. */
  iconSize: number;
  /** Distance from touch point to each button center. */
  radius: number;
  /** Selection hit radius around each button center. */
  hitRadius: number;
  /** Degrees between adjacent action buttons. */
  arcGapDegrees: number;
  /** Minimum distance between the arc center and each screen edge. */
  edgeMargin: number;
  /** Touches above this Y coordinate flip the arc downward. */
  topZone: number;
  /** Outward displacement while hovering a button. */
  selectedPush: number;
  /** Maximum rendered actions. Values above 5 are clamped for gesture clarity. */
  actionLimit: number;
  /** Extra distance from the arc radius to the floating label. */
  labelOffset: number;
}

// ─── Appearance ──────────────────────────────────────────────────────────

export interface HaloMenuAppearance {
  /** Static style applied to each action button's animated surface. */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Static style applied to the clipped icon container. */
  buttonInnerStyle?: StyleProp<ViewStyle>;
  /** Static style merged when an action is selected. */
  selectedButtonStyle?: StyleProp<ViewStyle>;
  /** Static style applied to the positioned preview wrapper. */
  previewContainerStyle?: StyleProp<ViewStyle>;
  /** Static style applied to the clipped preview content wrapper. */
  previewContentStyle?: StyleProp<ViewStyle>;
  /** Multiplier for the default selected-button shadow. Set 0 to disable. */
  buttonShadowOpacity?: number;
  /** Multiplier for the default lifted-preview shadow. Set 0 to disable. */
  previewShadowOpacity?: number;
  /** Whether to show the touch-origin indicator under the finger. */
  showOriginDot?: boolean;
  /** Touch-origin indicator diameter. */
  originDotSize?: number;
  /** Touch-origin indicator peak opacity. */
  originDotOpacity?: number;
  /** Touch-origin indicator fill color. */
  originDotColor?: string;
  /** Static style applied to the touch-origin indicator. */
  originDotStyle?: StyleProp<ViewStyle>;
}

// ─── Haptics ─────────────────────────────────────────────────────────────

export interface HaloMenuHaptics {
  /** Fired when the long-press commits and the menu opens. */
  onOpen?: () => void | Promise<void>;
  /** Fired when the finger enters a button (debounced 80ms per index by the core). */
  onHover?: () => void | Promise<void>;
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
  /** Latched at mount — geometry and hit-target tuning for the radial arc. */
  layout?: Partial<HaloMenuLayout>;
  /** Latched at mount — visual escape hatches that do not affect gesture math. */
  appearance?: HaloMenuAppearance;
  haptics?: HaloMenuHaptics;
  /**
   * While truthy, long-press activation is suppressed (e.g. during navigation
   * transitions). The SharedValue identity is latched at mount — mutate its
   * value rather than swapping in a new SharedValue.
   */
  suppressActivationWhen?: SharedValue<number> | SharedValue<boolean>;
  /** Replaces the default solid-fade backdrop (e.g. with a blur view). */
  renderBackdrop?: HaloMenuBackdropRenderer;
  /** Merged over the default hover-label style (32px, lowercase). */
  labelTextStyle?: StyleProp<TextStyle>;
  /** Dev diagnostics channel — defaults to console.warn in __DEV__. */
  onWarn?: (message: string) => void;
  /**
   * Wraps the overlay layer. Pass react-native-screens' FullWindowOverlay (iOS)
   * to render the menu above native modals; defaults to no wrapper.
   */
  overlayContainerComponent?: ComponentType<{ children: ReactNode }>;
}

// ─── Public menu handle ──────────────────────────────────────────────────

export interface HaloMenuHandle {
  /** True while the menu is open — readable from worklets. */
  visible: SharedValue<boolean>;
  /** Imperatively close the menu (e.g. when the trigger's screen unmounts). */
  hide: () => void;
}
