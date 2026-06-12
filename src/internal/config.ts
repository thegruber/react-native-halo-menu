/**
 * @file config.ts
 * @description Resolved injection config (colors, motion, haptics, backdrop, label style,
 * gating, warn channel) behind an internal context. Motion is latched at provider mount.
 */

import { createContext, useContext } from "react";
import type { StyleProp, TextStyle } from "react-native";
import type { SharedValue, WithTimingConfig } from "react-native-reanimated";
import type {
  HaloMenuBackdropRenderer,
  HaloMenuColors,
  HaloMenuHaptics,
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
  /** Shared open/close timing — duration from motion, ease-out-quad, OS reduce-motion aware. */
  timingConfig: WithTimingConfig;
  haptics: HaloMenuHaptics;
  suppressActivationWhen?: SharedValue<number> | SharedValue<boolean>;
  renderBackdrop?: HaloMenuBackdropRenderer;
  labelTextStyle?: StyleProp<TextStyle>;
  onWarn: (message: string) => void;
}

export const HaloMenuConfigCtx = createContext<HaloMenuConfig | null>(null);

export function useHaloMenuConfig(): HaloMenuConfig {
  const config = useContext(HaloMenuConfigCtx);
  if (!config) throw new Error("HaloMenu components must be used inside <HaloMenuProvider>");
  return config;
}
