import {
  DEFAULT_APPEARANCE,
  DEFAULT_LAYOUT,
  getDefaultColors,
  resolveAppearance,
  resolveLayout,
} from "../internal/config";

describe("resolveLayout", () => {
  it("returns the defaults when called with nothing", () => {
    expect(resolveLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it("rejects non-finite and non-positive values per field", () => {
    expect(resolveLayout({ radius: NaN }).radius).toBe(DEFAULT_LAYOUT.radius);
    expect(resolveLayout({ radius: Infinity }).radius).toBe(DEFAULT_LAYOUT.radius);
    expect(resolveLayout({ hitRadius: -10 }).hitRadius).toBe(DEFAULT_LAYOUT.hitRadius);
    expect(resolveLayout({ buttonSize: 0 }).buttonSize).toBe(DEFAULT_LAYOUT.buttonSize);
  });

  it("keeps valid overrides", () => {
    const layout = resolveLayout({ radius: 100, hitRadius: 44 });
    expect(layout.radius).toBe(100);
    expect(layout.hitRadius).toBe(44);
  });

  it("floors fractional actionLimit values", () => {
    expect(resolveLayout({ actionLimit: 3.9 }).actionLimit).toBe(3);
  });

  it("derives the border radius from a custom button size unless overridden", () => {
    expect(resolveLayout({ buttonSize: 64 }).buttonBorderRadius).toBe(32);
    expect(resolveLayout({ buttonSize: 64, buttonBorderRadius: 12 }).buttonBorderRadius).toBe(12);
  });
});

describe("resolveAppearance", () => {
  it("returns the defaults when called with nothing", () => {
    expect(resolveAppearance()).toEqual(DEFAULT_APPEARANCE);
  });

  it("allows zero to disable shadows and dot opacity", () => {
    const appearance = resolveAppearance({
      buttonShadowOpacity: 0,
      previewShadowOpacity: 0,
      originDotOpacity: 0,
    });
    expect(appearance.buttonShadowOpacity).toBe(0);
    expect(appearance.previewShadowOpacity).toBe(0);
    expect(appearance.originDotOpacity).toBe(0);
  });

  it("rejects negative and non-finite numeric overrides", () => {
    expect(resolveAppearance({ buttonShadowOpacity: -1 }).buttonShadowOpacity).toBe(
      DEFAULT_APPEARANCE.buttonShadowOpacity,
    );
    expect(resolveAppearance({ originDotSize: NaN }).originDotSize).toBe(
      DEFAULT_APPEARANCE.originDotSize,
    );
    expect(resolveAppearance({ originDotSize: 0 }).originDotSize).toBe(
      DEFAULT_APPEARANCE.originDotSize,
    );
  });

  it("passes style escape hatches through untouched", () => {
    const buttonStyle = { borderWidth: 1 };
    expect(resolveAppearance({ buttonStyle }).buttonStyle).toBe(buttonStyle);
  });
});

describe("getDefaultColors", () => {
  it("returns distinct palettes per scheme", () => {
    const light = getDefaultColors(false);
    const dark = getDefaultColors(true);
    expect(light).not.toEqual(dark);
    for (const palette of [light, dark]) {
      expect(palette.foreground).toMatch(/^#/);
      expect(palette.surface).toMatch(/^#/);
      expect(palette.destructive).toMatch(/^#/);
      expect(palette.selectionForeground).toMatch(/^#/);
    }
  });
});
