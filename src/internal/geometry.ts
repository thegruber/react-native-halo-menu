/**
 * @file geometry.ts
 * @description Layout constants and arc math for the halo arc. Pure module — no React,
 * no native imports — so the contract stays unit-testable.
 */

// ─── Layout constants ────────────────────────────────────────────────────

export const BUTTON_SIZE = 50;
export const BUTTON_BORDER_RADIUS = 25;
export const ICON_SIZE = 22;
/** Distance from touch point to button centers. */
export const MENU_RADIUS = 85;
/** Hit target radius for selection. */
export const HIT_RADIUS = 38;
/** Per-gap arc spacing in radians (~50° per gap between buttons). */
const ARC_PER_GAP = (50 * Math.PI) / 180;
const EDGE_MARGIN = 20;
/** Top zone threshold — below this Y, the arc flips downward. */
const TOP_ZONE = 180;
/** Selected button: outward displacement away from finger. */
export const PUSH_AMOUNT = 14;
/** Hard cap on rendered actions — the arc gets ambiguous beyond five. */
export const MAX_ACTIONS = 5;
/** Pre-allocated slot indices — avoids array allocation per render. */
export const BUTTON_SLOTS = [0, 1, 2, 3, 4] as const;

// ─── Arc math ────────────────────────────────────────────────────────────

/** Compute arc center angle — pure 180° rotation mapped to screen width. */
export function computeArcAngle(cx: number, cy: number, screenWidth: number): number {
  // -1 (left edge) → 0 (center) → +1 (right edge)
  const safeWidth = Math.max(screenWidth, 1);
  const normalizedX = (cx - safeWidth / 2) / (safeWidth / 2);
  // Upward: left=0° (right), center=-90° (up), right=-180° (left)
  // Downward: left=0° (right), center=90° (down), right=180° (left)
  const direction = cy < TOP_ZONE ? 1 : -1;
  return direction * (1 + normalizedX) * (Math.PI / 2);
}

/** Get individual button angle from the precomputed arc center. */
export function getButtonAngle(index: number, total: number, arcCenterAngle: number): number {
  "worklet";
  if (total <= 1) return arcCenterAngle;
  const arcSpan = ARC_PER_GAP * (total - 1);
  const step = arcSpan / (total - 1);
  return arcCenterAngle - arcSpan / 2 + index * step;
}

/** Gentle clamp — only prevent center from going off-screen itself. */
export function clampCenter(
  cx: number,
  cy: number,
  screenWidth: number,
  screenHeight: number,
): { cx: number; cy: number } {
  return {
    cx: Math.max(EDGE_MARGIN, Math.min(screenWidth - EDGE_MARGIN, cx)),
    cy: Math.max(EDGE_MARGIN, Math.min(screenHeight - EDGE_MARGIN, cy)),
  };
}
