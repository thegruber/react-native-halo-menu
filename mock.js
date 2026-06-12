/**
 * Jest mock for react-native-halo-menu.
 *
 * Usage in the consumer's jest setup:
 *   jest.mock("react-native-halo-menu", () => require("react-native-halo-menu/mock"));
 */

const React = require("react");

const noop = () => {};
const visible = { value: false, get: () => false, set: noop };

const passthrough = ({ children }) => React.createElement(React.Fragment, null, children);

module.exports = {
  HaloMenuProvider: passthrough,
  HaloMenuTrigger: passthrough,
  HaloMenuPreviewFrame: passthrough,
  useHaloMenu: () => ({ visible, hide: noop }),
  useHaloMenuTrigger: () => ({
    panGesture: {},
    animatedRef: { current: null },
    menuActiveRef: { current: false },
  }),
  DEFAULT_MOTION: {
    longPressDuration: 300,
    duration: 500,
    liftScale: 1.15,
    pressScale: 0.97,
    tiltDeg: 5,
    staggerDelay: 45,
    selectedScale: 1.25,
    labelFadeDuration: 250,
  },
};
