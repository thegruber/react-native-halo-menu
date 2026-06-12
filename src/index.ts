/**
 * @file index.ts
 * @description Public entry for react-native-halo-menu.
 */

export { HaloMenuProvider } from "./HaloMenuProvider";
export { HaloMenuTrigger, type HaloMenuTriggerProps } from "./HaloMenuTrigger";
export {
  useHaloMenuTrigger,
  type UseHaloMenuTriggerOptions,
  type UseHaloMenuTriggerReturn,
} from "./useHaloMenuTrigger";
export { useHaloMenu } from "./useHaloMenu";
export { HaloMenuPreviewFrame, type HaloMenuPreviewFrameProps } from "./HaloMenuPreviewFrame";
export {
  getHaloMenuAccessibilityProps,
  type HaloMenuAccessibilityOptions,
  type HaloMenuAccessibilityProps,
} from "./accessibility";
export {
  DEFAULT_APPEARANCE,
  DEFAULT_LAYOUT,
  DEFAULT_MOTION,
  type ResolvedHaloMenuAppearance,
} from "./internal/config";
export type {
  HaloAction,
  HaloMenuAppearance,
  HaloIconProps,
  HaloMenuBackdropProps,
  HaloMenuBackdropRenderer,
  HaloMenuColors,
  HaloMenuHandle,
  HaloMenuHaptics,
  HaloMenuLayout,
  HaloMenuMotion,
  HaloMenuPreviewRenderer,
  HaloMenuPreviewSize,
  HaloMenuProviderProps,
} from "./types";
