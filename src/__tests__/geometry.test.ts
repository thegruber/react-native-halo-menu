import {
  HIT_RADIUS,
  MENU_RADIUS,
  clampCenter,
  computeArcAngle,
  getButtonAngle,
} from "../internal/geometry";

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

  it("keeps a finger on a button center out of the neighbor's hit circle", () => {
    // Adjacent hit circles may overlap slightly (the hit-test loop breaks on
    // first match), but a centered finger must be unambiguous.
    const gap = getButtonAngle(1, 5, ARC_CENTER) - getButtonAngle(0, 5, ARC_CENTER);
    const buttonDistance = 2 * MENU_RADIUS * Math.sin(gap / 2);
    expect(buttonDistance).toBeGreaterThan(HIT_RADIUS);
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
});
