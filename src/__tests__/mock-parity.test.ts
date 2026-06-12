/**
 * Guards the hand-written Jest mock against drift: the constants it ships and
 * the surface it mocks must match the real library.
 */

import { getHaloMenuAccessibilityProps } from "../accessibility";
import { DEFAULT_APPEARANCE, DEFAULT_LAYOUT, DEFAULT_MOTION } from "../internal/config";
import type { HaloAction } from "../types";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock is plain CJS by design
const mock = require("../../mock.js");

describe("mock parity", () => {
  it("ships the same default constants as the library", () => {
    expect(mock.DEFAULT_MOTION).toEqual(DEFAULT_MOTION);
    expect(mock.DEFAULT_LAYOUT).toEqual(DEFAULT_LAYOUT);
    expect(mock.DEFAULT_APPEARANCE).toEqual(DEFAULT_APPEARANCE);
  });

  it("mocks every public runtime export", () => {
    // Keep in sync with the value exports of src/index.ts.
    const expected = [
      "HaloMenuProvider",
      "HaloMenuTrigger",
      "HaloMenuPreviewFrame",
      "useHaloMenu",
      "useHaloMenuTrigger",
      "getHaloMenuAccessibilityProps",
      "DEFAULT_MOTION",
      "DEFAULT_LAYOUT",
      "DEFAULT_APPEARANCE",
    ];
    for (const name of expected) {
      expect(mock[name]).toBeDefined();
    }
  });

  it("exposes working accessibility actions from the mocked helper", () => {
    const onPress = jest.fn();
    const actions: HaloAction[] = [{ key: "share", title: "Share", onPress }];
    const props = mock.getHaloMenuAccessibilityProps(actions);

    expect(props.accessibilityActions).toEqual([{ name: "halo-menu:share", label: "Share" }]);

    props.onAccessibilityAction({ nativeEvent: { actionName: "halo-menu:share" } });
    expect(onPress).toHaveBeenCalledTimes(1);

    props.onAccessibilityAction({ nativeEvent: { actionName: "halo-menu:unknown" } });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("honors interceptAction in the mocked helper", () => {
    const onPress = jest.fn();
    const actions: HaloAction[] = [{ key: "select", title: "Select", onPress }];
    const props = mock.getHaloMenuAccessibilityProps(actions, {
      interceptAction: () => true,
    });

    props.onAccessibilityAction({ nativeEvent: { actionName: "halo-menu:select" } });
    expect(onPress).not.toHaveBeenCalled();
  });

  it("matches the real helper's output shape", () => {
    const actions: HaloAction[] = [
      { key: "a", title: "A", onPress: () => {} },
      { key: "b", title: "B", onPress: () => {} },
    ];
    expect(mock.getHaloMenuAccessibilityProps(actions).accessibilityActions).toEqual(
      getHaloMenuAccessibilityProps(actions).accessibilityActions,
    );
  });
});
