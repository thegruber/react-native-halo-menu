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
export { DEFAULT_MOTION } from "./internal/config";
export type {
  HaloAction,
  HaloIconProps,
  HaloMenuBackdropProps,
  HaloMenuBackdropRenderer,
  HaloMenuColors,
  HaloMenuHandle,
  HaloMenuHaptics,
  HaloMenuMotion,
  HaloMenuPreviewRenderer,
  HaloMenuPreviewSize,
  HaloMenuProviderProps,
} from "./types";
