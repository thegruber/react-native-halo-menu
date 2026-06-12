import { clampCenter, computeArcAngle, getButtonAngle, hitTestArc } from "../internal/geometry";
import { DEFAULT_LAYOUT, resolveLayout } from "../internal/config";

const SCREEN_W = 400;

describe("computeArcAngle", () => {
  it("points the arc straight up from a centered touch", () => {
    expect(computeArcAngle(SCREEN_W / 2, 500, SCREEN_W)).toBeCloseTo(-Math.PI / 2);
  });

  it("sweeps right from a left-edge touch and left from a right-edge touch", () => {
    expect(computeArcAngle(0, 500, SCREEN_W)).toBeCloseTo(0);
    expect(computeArcAngle(SCREEN_W, 500, SCREEN_W)).toBeCloseTo(-Math.PI);
  });

  it("flips the arc downward inside the top zone", () => {
    expect(computeArcAngle(SCREEN_W / 2, 100, SCREEN_W)).toBeCloseTo(Math.PI / 2);
  });

  it("uses a custom top zone when provided", () => {
    expect(computeArcAngle(SCREEN_W / 2, 160, SCREEN_W, 120)).toBeCloseTo(-Math.PI / 2);
  });

  it("survives a zero screen width without dividing by zero", () => {
    expect(Number.isFinite(computeArcAngle(0, 500, 0))).toBe(true);
  });
});

describe("getButtonAngle", () => {
  const ARC_CENTER = -Math.PI / 2;

  it("places a single button at the arc center", () => {
    expect(getButtonAngle(0, 1, ARC_CENTER)).toBeCloseTo(ARC_CENTER);
  });

  it("spreads buttons symmetrically around the arc center", () => {
    const total = 5;
    const first = getButtonAngle(0, total, ARC_CENTER);
    const mid = getButtonAngle(2, total, ARC_CENTER);
    const last = getButtonAngle(total - 1, total, ARC_CENTER);

    expect(mid).toBeCloseTo(ARC_CENTER);
    expect(ARC_CENTER - first).toBeCloseTo(last - ARC_CENTER);
  });

  it("keeps ~50° between adjacent buttons", () => {
    const gap = getButtonAngle(1, 5, ARC_CENTER) - getButtonAngle(0, 5, ARC_CENTER);
    expect(gap).toBeCloseTo((50 * Math.PI) / 180);
  });

  it("accepts custom arc spacing", () => {
    const customGap = (36 * Math.PI) / 180;
    const gap =
      getButtonAngle(1, 5, ARC_CENTER, customGap) - getButtonAngle(0, 5, ARC_CENTER, customGap);
    expect(gap).toBeCloseTo(customGap);
  });

  it("keeps a finger on a button center out of the neighbor's hit circle", () => {
    // Adjacent hit circles may overlap slightly (the hit-test loop breaks on
    // first match), but a centered finger must be unambiguous. Assert against
    // the shipping defaults so a layout change re-validates the invariant.
    const gap = getButtonAngle(1, 5, ARC_CENTER) - getButtonAngle(0, 5, ARC_CENTER);
    const buttonDistance = 2 * DEFAULT_LAYOUT.radius * Math.sin(gap / 2);
    expect(buttonDistance).toBeGreaterThan(DEFAULT_LAYOUT.hitRadius);
  });
});

describe("hitTestArc", () => {
  const { radius, hitRadius } = DEFAULT_LAYOUT;
  const ARC_CENTER = -Math.PI / 2;
  const CX = 200;
  const CY = 500;

  function buttonCenter(index: number, total: number) {
    const angle = getButtonAngle(index, total, ARC_CENTER);
    return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  }

  it("returns -1 at the touch origin (buttons sit a full radius away)", () => {
    expect(hitTestArc(CX, CY, CX, CY, 5, ARC_CENTER, radius, hitRadius)).toBe(-1);
  });

  it("hits each button at its exact center", () => {
    for (let i = 0; i < 5; i++) {
      const { x, y } = buttonCenter(i, 5);
      expect(hitTestArc(x, y, CX, CY, 5, ARC_CENTER, radius, hitRadius)).toBe(i);
    }
  });

  it("hits just inside the hit radius and misses just outside", () => {
    const { x, y } = buttonCenter(2, 5);
    expect(hitTestArc(x, y + hitRadius - 1, CX, CY, 5, ARC_CENTER, radius, hitRadius)).toBe(2);
    expect(hitTestArc(x, y + hitRadius + 1, CX, CY, 5, ARC_CENTER, radius, hitRadius)).toBe(-1);
  });

  it("never selects an index past the active count", () => {
    const { x, y } = buttonCenter(4, 5);
    // Only 3 buttons active: slot 4's position is empty space.
    expect(hitTestArc(x, y, CX, CY, 3, ARC_CENTER, radius, hitRadius)).toBe(-1);
  });

  it("returns -1 when no buttons are shown", () => {
    expect(hitTestArc(CX, CY, CX, CY, 0, ARC_CENTER, radius, hitRadius)).toBe(-1);
  });

  it("resolves an overlap zone to the lower index (first match wins)", () => {
    const a = buttonCenter(1, 5);
    const b = buttonCenter(2, 5);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const result = hitTestArc(mid.x, mid.y, CX, CY, 5, ARC_CENTER, radius, hitRadius);
    // Midpoint may fall in both circles or neither, but never the higher index alone.
    expect([-1, 1]).toContain(result);
  });
});

describe("clampCenter", () => {
  it("passes through an in-bounds touch unchanged", () => {
    expect(clampCenter(200, 400, SCREEN_W, 800)).toEqual({ cx: 200, cy: 400 });
  });

  it("clamps to a 20px margin on every edge", () => {
    expect(clampCenter(-50, -50, SCREEN_W, 800)).toEqual({ cx: 20, cy: 20 });
    expect(clampCenter(9999, 9999, SCREEN_W, 800)).toEqual({
      cx: SCREEN_W - 20,
      cy: 780,
    });
  });

  it("accepts a custom edge margin", () => {
    expect(clampCenter(-50, -50, SCREEN_W, 800, 32)).toEqual({ cx: 32, cy: 32 });
  });
});

describe("resolveLayout", () => {
  it("clamps actionLimit to the supported gesture range", () => {
    expect(resolveLayout({ actionLimit: 99 }).actionLimit).toBe(5);
    expect(resolveLayout({ actionLimit: 0 }).actionLimit).toBe(5);
    expect(resolveLayout({ actionLimit: 3 }).actionLimit).toBe(3);
  });

  it("defaults button radius to half the configured button size", () => {
    expect(resolveLayout({ buttonSize: 64 }).buttonBorderRadius).toBe(32);
  });
});
