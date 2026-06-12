# Changelog

## 0.1.1 (2026-06-12)

- Security policy (`SECURITY.md`) with private vulnerability reporting
- CI: pack-contents check tolerates npm 10 prepare log noise
- First version published via GitHub Actions trusted publishing with npm provenance

## 0.1.0 (2026-06-12)

Initial release, extracted from the Pinio app where the interaction shipped in production.

- `HaloMenuProvider`, `HaloMenuTrigger`, `useHaloMenuTrigger`, `HaloMenuPreviewFrame`, `useHaloMenu`
- Radial drag-to-select with lifted preview, hover label, origin dot, and dimmed backdrop
- Injection points: colors, color scheme, motion, haptics, backdrop, label style, activation gating, warn channel
- Layout configuration for button size, icon size, radius, hit radius, arc spacing, edge margin, top flip zone, selected push, action limit, and label offset
- Appearance configuration for button/preview styling, default shadow strength, and touch-origin indicator styling
- Optional `react-native-halo-menu/expo` subpath with `HaloBlurBackdrop` for Expo Blur apps
- Native accessibility actions on `HaloMenuTrigger` for screen-reader action fallback,
  honoring `interceptAction`; `getHaloMenuAccessibilityProps` export for `useHaloMenuTrigger` users
- `renderPreview` optional on `HaloMenuTrigger` (defaults to children in a `HaloMenuPreviewFrame`);
  all standard ViewProps forward to the measured wrapper
- `useHaloMenu().hide()` performs a full close — animates the preview home and clears it,
  safe without an active gesture (also used by `hideOnUnmount`)
- Failed gestures (taps, scroll-pasts) no longer arm the re-open cooldown or disturb an
  already-open menu; a second trigger cannot hijack an open session
- Works without `SafeAreaProvider` (hover label falls back to zero insets)
- Overlay is hidden from the accessibility tree; selection happens under the finger
- OS Reduce Motion support on every animation
- Guard for RNGH #2620 (iOS double `onStart` after `activateAfterLongPress`)
- Jest mock at `react-native-halo-menu/mock` with working accessibility actions, parity-tested
  against the real exports
