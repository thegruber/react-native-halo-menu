# Distribution Plan

This document is repo-only. It is not published in the npm package.

## Positioning

`react-native-halo-menu` is a gesture-layer quick-actions menu for cards, grids, media,
saved items, and dense content surfaces.

One-line promise:

> Pinterest-style hold menu for React Native: long-press, drag, release.

Keep the positioning narrow. Do not present it as a replacement for every context menu,
action sheet, or native UIMenu. The package is strongest when the user should keep one finger
down while previewing and selecting a nearby action.

## Comparison Notes

Successful React Native packages tend to share the same distribution shape:

| Package                | What works                                                                       | Apply here                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pressto`              | Simple promise, small API, good examples, relevant keywords                      | Keep the API compact; make the interaction feel obvious in media             |
| `@gorhom/bottom-sheet` | Category-owning docs, provider pattern, feature list, strong compatibility notes | Explain why the root provider exists and document modal limitations honestly |
| `@shopify/flash-list`  | Clear migration story, Expo/dev-build guidance, production-performance framing   | Show where halo menu is better than ad hoc long-press menus                  |
| Reanimated / RNGH      | Precise setup instructions and troubleshooting                                   | Keep Worklets/RNGH setup and failure modes visible                           |
| Expo docs              | Platform compatibility, install commands, API list, examples                     | Keep Expo Go vs development-build wording exact                              |

## Search Surface

Primary search phrases:

- react native hold menu
- react native long press menu
- react native radial menu
- react native context menu
- react native quick actions
- react native floating menu
- react native gesture menu
- expo radial menu
- reanimated context menu
- pinterest style menu react native

Npm keywords should stay relevant rather than exhaustive:

- Category: `radial-menu`, `hold-menu`, `context-menu`, `floating-menu`, `quick-actions`,
  `action-menu`, `menu`
- Interaction: `long-press`, `hold-to-open`, `drag-to-select`, `gesture-menu`
- Ecosystem: `react-native`, `expo`, `expo-compatible`, `reanimated`, `worklets`,
  `gesture-handler`, `ios`, `android`

## Required Launch Materials

Ship these before asking for broad attention:

1. `README` hero media: `docs/assets/halo-menu-showcase.mp4`.
2. Short vertical video: 12-20 seconds for X, Bluesky, LinkedIn, Reddit, and Discord.
3. Static screenshot: used for GitHub social preview and posts.
4. Real-device proof note: iPhone model, iOS version, Expo SDK, RN version, Reanimated version.
5. Minimal install snippet: provider + one trigger, no app-specific code.
6. Comparison snippet: when to use halo menu vs native context menu / action sheet.
7. Troubleshooting snippets: GestureHandlerRootView, worklet transform, wrong Metro root.
8. Example app recording: use the packaged code path, not only source linking.

## Distribution Channels

First wave:

- GitHub release with demo GIF and concise release notes.
- npm publish with provenance via trusted publishing.
- React Native Directory submission once the GitHub repo and npm package are public.
- X / Bluesky launch post with GIF, one code snippet, and npm/GitHub links.
- Reddit: `r/reactnative`, only after GIF and docs are ready; focus on implementation details.
- Expo Discord / Reactiflux: share as a focused library, not a generic promo.

Second wave:

- Short blog post: "Building a one-gesture radial hold menu with Reanimated 4".
- Expo Snack only if the public Expo Go runtime matches the example SDK; otherwise link to dev-build instructions.
- Real app integration post from Pinio after the package is stable.
- Optional docs site if README starts carrying too much API/reference material.

## Acceptance Signals

Before public launch:

- `pnpm run ci` passes.
- Package contents check confirms no `example/`, `.github/`, `ios/`, `android/`, tests, or scripts ship.
- Real iPhone demo passes: blur visible, drag selection is reliable, no optional-native warnings.
- README opens with a visible GIF or screenshot.
- npm package page has accurate badges, install instructions, peer deps, and troubleshooting.
- GitHub repo has topics matching npm keywords.
- Initial issues/discussions templates exist if the repo will accept public feedback.

## Suggested GitHub Topics

`react-native`, `expo`, `reanimated`, `gesture-handler`, `worklets`, `radial-menu`,
`context-menu`, `long-press`, `quick-actions`, `typescript`, `ios`, `android`

## Launch Post Draft

> I extracted `react-native-halo-menu` from Pinio: a Pinterest-style hold menu for React Native.
> Long-press a card, drag onto an action, release. Reanimated 4 + Gesture Handler, zero native
> code, optional Expo blur/haptics, typed API, and a Jest mock.
>
> Best for card grids, saved items, media, and dense action surfaces where an action sheet is too
> slow.
>
> GitHub: ...
> npm: ...
