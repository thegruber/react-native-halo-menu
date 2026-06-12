import { callOptionalCallback } from "../internal/callbacks";

describe("callOptionalCallback", () => {
  it("ignores missing callbacks", () => {
    const warn = jest.fn();
    callOptionalCallback("haptics.onOpen", undefined, warn, new Set());

    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once for a synchronous failure", () => {
    const warn = jest.fn();
    const warned = new Set<string>();
    const callback = () => {
      throw new Error("native module unavailable");
    };

    callOptionalCallback("haptics.onOpen", callback, warn, warned);
    callOptionalCallback("haptics.onOpen", callback, warn, warned);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("haptics.onOpen callback failed: native module unavailable");
  });

  it("catches rejected promises", async () => {
    const warn = jest.fn();
    callOptionalCallback(
      "haptics.onHover",
      () => Promise.reject(new Error("not linked")),
      warn,
      new Set(),
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(warn).toHaveBeenCalledWith("haptics.onHover callback failed: not linked");
  });

  it("formats string and non-Error rejections", async () => {
    const warn = jest.fn();
    const warned = new Set<string>();

    callOptionalCallback(
      "haptics.onOpen",
      () => {
        throw "plain string";
      },
      warn,
      warned,
    );
    expect(warn).toHaveBeenCalledWith("haptics.onOpen callback failed: plain string");

    callOptionalCallback("haptics.onHover", () => Promise.reject({ code: 1 }), warn, warned);
    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith("haptics.onHover callback failed: unknown error");
  });

  it("warns once per callback name, not once globally", () => {
    const warn = jest.fn();
    const warned = new Set<string>();
    const boom = () => {
      throw new Error("boom");
    };

    callOptionalCallback("haptics.onOpen", boom, warn, warned);
    callOptionalCallback("haptics.onHover", boom, warn, warned);
    callOptionalCallback("haptics.onOpen", boom, warn, warned);

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("does not warn for callbacks that succeed", async () => {
    const warn = jest.fn();
    callOptionalCallback("haptics.onOpen", () => {}, warn, new Set());
    callOptionalCallback("haptics.onHover", () => Promise.resolve(), warn, new Set());
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();
  });
});
