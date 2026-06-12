/**
 * @file accessibility.ts
 * @description Maps a HaloAction list onto native accessibility actions so screen-reader
 * users can trigger them without the hold gesture. `HaloMenuTrigger` applies this
 * automatically; `useHaloMenuTrigger` consumers spread the result onto their measured view.
 */

import type { AccessibilityActionEvent, AccessibilityActionInfo } from "react-native";
import type { HaloAction } from "./types";

const ACCESSIBILITY_ACTION_PREFIX = "halo-menu:";

export interface HaloMenuAccessibilityOptions {
  /** Mirrors the trigger's `interceptAction` — return true to suppress `onPress`. */
  interceptAction?: (action: HaloAction, index: number) => boolean;
  /** Additional native actions exposed before the halo actions. */
  accessibilityActions?: readonly AccessibilityActionInfo[];
  /** Called for every event, including non-halo actions. */
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

export interface HaloMenuAccessibilityProps {
  accessibilityActions: AccessibilityActionInfo[];
  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
}

/**
 * Build `accessibilityActions` / `onAccessibilityAction` props that expose each
 * halo action to VoiceOver/TalkBack. The view also needs `accessible` and an
 * `accessibilityLabel` for assistive technologies to discover it.
 */
export function getHaloMenuAccessibilityProps(
  actions: HaloAction[],
  options: HaloMenuAccessibilityOptions = {},
): HaloMenuAccessibilityProps {
  const { interceptAction, accessibilityActions, onAccessibilityAction } = options;
  return {
    accessibilityActions: [
      ...(accessibilityActions ?? []),
      ...actions.map((action) => ({
        name: `${ACCESSIBILITY_ACTION_PREFIX}${action.key}`,
        label: action.title,
      })),
    ],
    onAccessibilityAction: (event) => {
      onAccessibilityAction?.(event);

      const actionName = event.nativeEvent.actionName;
      if (!actionName.startsWith(ACCESSIBILITY_ACTION_PREFIX)) return;

      const key = actionName.slice(ACCESSIBILITY_ACTION_PREFIX.length);
      const index = actions.findIndex((candidate) => candidate.key === key);
      const action = index >= 0 ? actions[index] : undefined;
      if (!action) return;

      // Match the gesture path: interceptAction can claim the press.
      const intercepted = interceptAction?.(action, index) ?? false;
      if (!intercepted) void action.onPress();
    },
  };
}
