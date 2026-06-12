/**
 * @file config.ts
 * @description Resolved injection config (colors, motion, haptics, backdrop, label style,
 * gating, warn channel) behind an internal context. Motion is latched at provider mount.
 */

import { createContext, useContext } from "react";
import type { StyleProp, TextStyle } from "react-native";
import type { SharedValue, WithTimingConfig } from "react-native-reanimated";
import type {
  HaloMenuAppearance,
  HaloMenuBackdropRenderer,
  HaloMenuColors,
  HaloMenuHaptics,
  HaloMenuLayout,
  HaloMenuMotion,
} from "../types";

export const DEFAULT_MOTION: HaloMenuMotion = {
  longPressDuration: 300,
  duration: 500,
  liftScale: 1.15,
  pressScale: 0.97,
  tiltDeg: 5,
  staggerDelay: 45,
  selectedScale: 1.25,
  labelFadeDuration: 250,
};

export const DEFAULT_LAYOUT: HaloMenuLayout = {
  buttonSize: 50,
  buttonBorderRadius: 25,
  iconSize: 22,
  radius: 85,
  hitRadius: 38,
  arcGapDegrees: 50,
  edgeMargin: 20,
  topZone: 180,
  selectedPush: 14,
  actionLimit: 5,
  labelOffset: 180,
};

export type ResolvedHaloMenuAppearance = Required<
  Pick<
    HaloMenuAppearance,
    | "buttonShadowOpacity"
    | "previewShadowOpacity"
    | "showOriginDot"
    | "originDotSize"
    | "originDotOpacity"
    | "originDotColor"
  >
> &
  Omit<
    HaloMenuAppearance,
    | "buttonShadowOpacity"
    | "previewShadowOpacity"
    | "showOriginDot"
    | "originDotSize"
    | "originDotOpacity"
    | "originDotColor"
  >;

export const DEFAULT_APPEARANCE: ResolvedHaloMenuAppearance = {
  buttonShadowOpacity: 0.18,
  previewShadowOpacity: 0.32,
  showOriginDot: true,
  originDotSize: 44,
  originDotOpacity: 0.28,
  originDotColor: "#FFFFFF",
};

function positive(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegative(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function resolveLayout(layout?: Partial<HaloMenuLayout>): HaloMenuLayout {
  const buttonSize = positive(layout?.buttonSize, DEFAULT_LAYOUT.buttonSize);
  return {
    buttonSize,
    buttonBorderRadius: positive(layout?.buttonBorderRadius, buttonSize / 2),
    iconSize: positive(layout?.iconSize, DEFAULT_LAYOUT.iconSize),
    radius: positive(layout?.radius, DEFAULT_LAYOUT.radius),
    hitRadius: positive(layout?.hitRadius, DEFAULT_LAYOUT.hitRadius),
    arcGapDegrees: positive(layout?.arcGapDegrees, DEFAULT_LAYOUT.arcGapDegrees),
    edgeMargin: positive(layout?.edgeMargin, DEFAULT_LAYOUT.edgeMargin),
    topZone: positive(layout?.topZone, DEFAULT_LAYOUT.topZone),
    selectedPush: positive(layout?.selectedPush, DEFAULT_LAYOUT.selectedPush),
    actionLimit: Math.max(1, Math.min(5, Math.floor(positive(layout?.actionLimit, 5)))),
    labelOffset: positive(layout?.labelOffset, DEFAULT_LAYOUT.labelOffset),
  };
}

export function resolveAppearance(appearance?: HaloMenuAppearance): ResolvedHaloMenuAppearance {
  const merged = {
    ...DEFAULT_APPEARANCE,
    ...appearance,
  };

  return {
    ...merged,
    buttonShadowOpacity: nonNegative(
      merged.buttonShadowOpacity,
      DEFAULT_APPEARANCE.buttonShadowOpacity,
    ),
    previewShadowOpacity: nonNegative(
      merged.previewShadowOpacity,
      DEFAULT_APPEARANCE.previewShadowOpacity,
    ),
    originDotSize: positive(merged.originDotSize, DEFAULT_APPEARANCE.originDotSize),
    originDotOpacity: nonNegative(merged.originDotOpacity, DEFAULT_APPEARANCE.originDotOpacity),
  };
}

export function getDefaultColors(isDarkMode: boolean): HaloMenuColors {
  return isDarkMode
    ? {
        foreground: "#FFFFFF",
        surface: "#1C1C1E",
        destructive: "#FF453A",
        selectionForeground: "#111111",
      }
    : {
        foreground: "#111111",
        surface: "#FFFFFF",
        destructive: "#FF3B30",
        selectionForeground: "#FFFFFF",
      };
}

export const DEFAULT_ON_WARN = (message: string) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console -- package-default diagnostics channel; hosts inject their own logger via onWarn
    console.warn(`[HaloMenu] ${message}`);
  }
};

export interface HaloMenuConfig {
  colors: HaloMenuColors;
  isDarkMode: boolean;
  motion: HaloMenuMotion;
  layout: HaloMenuLayout;
  appearance: ResolvedHaloMenuAppearance;
  /** Shared open/close timing — duration from motion, ease-out-quad, OS reduce-motion aware. */
  timingConfig: WithTimingConfig;
  haptics: HaloMenuHaptics;
  suppressActivationWhen?: SharedValue<number> | SharedValue<boolean>;
  renderBackdrop?: HaloMenuBackdropRenderer;
  labelTextStyle?: StyleProp<TextStyle>;
  onWarn: (message: string) => void;
  callbackWarningNames: Set<string>;
}

export const HaloMenuConfigCtx = createContext<HaloMenuConfig | null>(null);

export function useHaloMenuConfig(): HaloMenuConfig {
  const config = useContext(HaloMenuConfigCtx);
  if (!config) throw new Error("HaloMenu components must be used inside <HaloMenuProvider>");
  return config;
}
