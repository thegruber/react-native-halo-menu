# Changelog

## 0.1.0 (unreleased)

Initial release, extracted from the Pinio app where the interaction shipped in production.

- `HaloMenuProvider`, `HaloMenuTrigger`, `useHaloMenuTrigger`, `HaloMenuPreviewFrame`, `useHaloMenu`
- Radial drag-to-select with lifted preview, hover label, origin dot, and dimmed backdrop
- Injection points: colors, color scheme, motion, haptics, backdrop, label style, activation gating, warn channel
- OS Reduce Motion support on every animation
- Guard for RNGH #2620 (iOS double `onStart` after `activateAfterLongPress`)
- Jest mock at `react-native-halo-menu/mock`
