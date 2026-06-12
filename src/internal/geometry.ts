/**
 * @file geometry.ts
 * @description Arc math for the halo arc. Pure module — no React, no native imports —
 * so the contract stays unit-testable. Tunable values live in DEFAULT_LAYOUT (config.ts);
 * the constants here are only the parameter defaults for standalone calls.
 */

/** Per-gap arc spacing in radians (~50° per gap between buttons). */
const ARC_PER_GAP = (50 * Math.PI) / 180;
const EDGE_MARGIN = 20;
/** Top zone threshold — below this Y, the arc flips downward. */
const TOP_ZONE = 180;

// ─── Arc math ────────────────────────────────────────────────────────────

/** Compute arc center angle — pure 180° rotation mapped to screen width. */
export function computeArcAngle(
  cx: number,
  cy: number,
  screenWidth: number,
  topZone = TOP_ZONE,
): number {
  // -1 (left edge) → 0 (center) → +1 (right edge)
  const safeWidth = Math.max(screenWidth, 1);
  const normalizedX = (cx - safeWidth / 2) / (safeWidth / 2);
  // Upward: left=0° (right), center=-90° (up), right=-180° (left)
  // Downward: left=0° (right), center=90° (down), right=180° (left)
  const direction = cy < topZone ? 1 : -1;
  return direction * (1 + normalizedX) * (Math.PI / 2);
}

/** Get individual button angle from the precomputed arc center. */
export function getButtonAngle(
  index: number,
  total: number,
  arcCenterAngle: number,
  arcPerGap = ARC_PER_GAP,
): number {
  "worklet";
  if (total <= 1) return arcCenterAngle;
  const arcSpan = arcPerGap * (total - 1);
  const step = arcSpan / (total - 1);
  return arcCenterAngle - arcSpan / 2 + index * step;
}

/**
 * Find which arc button (if any) contains the finger. Returns the button index
 * or -1. Positional params keep the per-frame worklet allocation-free.
 */
export function hitTestArc(
  fingerX: number,
  fingerY: number,
  cx: number,
  cy: number,
  count: number,
  arcCenterAngle: number,
  radius: number,
  hitRadius: number,
  arcPerGap = ARC_PER_GAP,
): number {
  "worklet";
  for (let i = 0; i < count; i++) {
    const angle = getButtonAngle(i, count, arcCenterAngle, arcPerGap);
    const dx = fingerX - (cx + radius * Math.cos(angle));
    const dy = fingerY - (cy + radius * Math.sin(angle));
    if (Math.sqrt(dx * dx + dy * dy) < hitRadius) return i;
  }
  return -1;
}

/** Gentle clamp — only prevent center from going off-screen itself. */
export function clampCenter(
  cx: number,
  cy: number,
  screenWidth: number,
  screenHeight: number,
  edgeMargin = EDGE_MARGIN,
): { cx: number; cy: number } {
  return {
    cx: Math.max(edgeMargin, Math.min(screenWidth - edgeMargin, cx)),
    cy: Math.max(edgeMargin, Math.min(screenHeight - edgeMargin, cy)),
  };
}
