/**
 * Jest mock for react-native-halo-menu.
 *
 * Usage in the consumer's jest setup:
 *   jest.mock("react-native-halo-menu", () => require("react-native-halo-menu/mock"));
 *
 * `HaloMenuTrigger` renders a plain View that keeps style/testID/accessibility
 * props and exposes the real accessibility actions, so tests can fire menu
 * actions via `fireEvent(trigger, "accessibilityAction", ...)`.
 */

const React = require("react");

const noop = () => {};
const visible = { value: false, get: () => false, set: noop };

const passthrough = ({ children }) => React.createElement(React.Fragment, null, children);

const ACCESSIBILITY_ACTION_PREFIX = "halo-menu:";

// Mirrors src/accessibility.ts — pure JS, no react-native import needed.
exports.getHaloMenuAccessibilityProps = (actions, options = {}) => {
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
      if (onAccessibilityAction) onAccessibilityAction(event);
      const actionName = event.nativeEvent.actionName;
      if (!actionName.startsWith(ACCESSIBILITY_ACTION_PREFIX)) return;
      const key = actionName.slice(ACCESSIBILITY_ACTION_PREFIX.length);
      const index = actions.findIndex((candidate) => candidate.key === key);
      const action = index >= 0 ? actions[index] : undefined;
      if (!action) return;
      const intercepted = interceptAction ? interceptAction(action, index) : false;
      if (!intercepted) void action.onPress();
    },
  };
};

exports.HaloMenuProvider = passthrough;

exports.HaloMenuTrigger = ({
  id: _id,
  actions,
  renderPreview: _renderPreview,
  onOpen: _onOpen,
  onTouchDown: _onTouchDown,
  onFinalize: _onFinalize,
  interceptAction,
  onCloseComplete: _onCloseComplete,
  fallbackWidth: _fallbackWidth,
  fallbackHeight: _fallbackHeight,
  disabledWhen: _disabledWhen,
  warnOnDuplicateId: _warnOnDuplicateId,
  hideOnUnmount: _hideOnUnmount,
  accessibilityActions,
  onAccessibilityAction,
  children,
  ...viewProps
}) => {
  // Lazy so requiring the mock never pulls react-native into pure-node envs.
  const { View } = require("react-native");
  return React.createElement(
    View,
    {
      ...viewProps,
      ...exports.getHaloMenuAccessibilityProps(actions ?? [], {
        interceptAction,
        accessibilityActions,
        onAccessibilityAction,
      }),
    },
    children,
  );
};

exports.HaloMenuPreviewFrame = passthrough;
exports.useHaloMenu = () => ({ visible, hide: noop });
exports.useHaloMenuTrigger = () => ({
  panGesture: {},
  animatedRef: { current: null },
  menuActiveRef: { current: false },
});
exports.DEFAULT_MOTION = {
  longPressDuration: 300,
  duration: 500,
  liftScale: 1.15,
  pressScale: 0.97,
  tiltDeg: 5,
  staggerDelay: 45,
  selectedScale: 1.25,
  labelFadeDuration: 250,
};
exports.DEFAULT_LAYOUT = {
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
exports.DEFAULT_APPEARANCE = {
  buttonShadowOpacity: 0.18,
  previewShadowOpacity: 0.32,
  showOriginDot: true,
  originDotSize: 44,
  originDotOpacity: 0.28,
  originDotColor: "#FFFFFF",
};
