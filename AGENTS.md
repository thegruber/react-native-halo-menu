# AGENTS.md

## Project Scope

- This repository is the `react-native-halo-menu` package: a zero-native-code React Native hold menu built with TypeScript, Reanimated 4, React Native Worklets, and React Native Gesture Handler.
- The package root is the library. The Expo demo app lives in `example/` and resolves the library source through the `source` export condition.
- Treat `README.md` and `CONTRIBUTING.md` as the public human docs. Use this file for agent-facing workflow, architecture, and implementation constraints.

## Commands

- Install dependencies: `pnpm install`
- Run the demo: `pnpm --dir example start`
- Lint source: `pnpm run lint`
- Typecheck library: `pnpm run typecheck`
- Run tests: `pnpm run test`
- Check formatting: `pnpm run format:check`
- Build and validate package output: `pnpm run package:check`
- Check the example app: `pnpm run example:check`
- Verify worklet directives survived the build: `pnpm run worklet:check`
- Full CI gate: `pnpm run ci`

Run targeted checks while iterating, then run the smallest reliable gate that covers the change. For public API, packaging, export, or peer dependency changes, run `pnpm run package:check`; before release-facing changes, run `pnpm run ci`.

## Repository Map

- `src/index.ts` is the public library entry point.
- `src/HaloMenuProvider.tsx` owns the root overlay, shared value graph, backdrop, lifted preview, action buttons, and hover label.
- `src/HaloMenuTrigger.tsx` is the default trigger wrapper.
- `src/useHaloMenuTrigger.ts` is the lower-level gesture hook and UI-to-JS bridge.
- `src/internal/geometry.ts` contains pure arc and hit-test math; keep this unit-testable.
- `src/internal/config.ts` resolves defaults for motion, layout, appearance, and colors.
- `src/internal/state.ts` defines internal context/state contracts.
- `src/expo/index.tsx` is the optional Expo helper subpath. Do not import Expo-only modules from the core entry point.
- `mock.js` and `mock.d.ts` are the published Jest mock surface.
- `lib/`, `dist/`, `coverage/`, `node_modules/`, native build folders, and `*.tgz` files are generated or local artifacts. Do not edit them directly.

## React Native Package Constraints

- Keep the package zero native code. Do not add `ios/`, `android/`, config plugins, or required native setup to the library.
- Do not add new required runtime dependencies without an explicit product reason. App-specific icons, haptics, blur, and theming should remain injection points.
- Optional platform helpers must stay behind documented subpath exports with optional peers so bare React Native consumers do not pay for Expo-only code.
- Preserve the small public API. Prefer additive changes and document any public behavior change in `README.md`, `mock.d.ts`, and `llms.txt` when relevant.
- Keep `sideEffects: false` valid: avoid module-level side effects except intentional constants and registries already used by the package.

## Reanimated And Gesture Rules

- This package targets Reanimated 4, React Native Worklets, and React Native Gesture Handler 2.x builder APIs.
- Keep per-frame gesture tracking, hit-testing, placement, and animation work on the UI runtime using shared values and worklets.
- Do not use `PanResponder` or React Native touch responder APIs for the core interaction.
- Do not use `runOnJS`; use `scheduleOnRN` from `react-native-worklets` for JS-thread callbacks from worklets.
- Memoize Gesture Handler 2.x gestures with `useMemo` so recognizers do not reattach on every render.
- Do not call React state setters, navigation, haptics, logging, or user callbacks directly from gesture/worklet code. Bridge them with `scheduleOnRN`.
- Keep existing `'worklet'` directives and add them to UI-runtime bodies following the repo pattern. After build-affecting changes, run `pnpm run worklet:check`.
- Respect OS Reduce Motion. Keep animations driven by Reanimated configs that use system reduce-motion behavior.
- Consumers need `GestureHandlerRootView` near the app root and `HaloMenuProvider` mounted once inside it.

## Code Style

- Use TypeScript strict mode. Maintain `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters` compatibility.
- Follow the current Prettier style: double quotes, semicolons, trailing commas, and 2-space indentation.
- Use inline type imports where possible, matching the ESLint rule.
- Keep public types and public props documented with concise JSDoc.
- Prefer pure functions for geometry/config logic and add or update focused Jest tests for behavioral changes.
- Avoid `console.*` in source. Use the provider `onWarn` channel for development diagnostics.
- Keep comments useful and sparse. Existing section comments are fine for complex gesture/animation code.

## Testing Expectations

- For pure math, config, or public contract changes, add focused Jest coverage under `src/__tests__/`.
- For gesture, Reanimated, or visual behavior changes, update the example app if needed and run the relevant typecheck/build gates.
- For package export, file list, mock, peer dependency, or README install changes, run `pnpm run package:check`.
- For source changes that affect worklets, run `pnpm run build` before `pnpm run worklet:check` if `lib/` is stale.

## Documentation And Release Notes

- Keep install instructions exact for Expo and bare React Native. Do not claim Expo Go support unless the public Expo SDK includes compatible peers.
- Changelog entries come from Conventional Commits through release tooling. Use commit types such as `feat:`, `fix:`, `docs:`, and `chore:`.
- Do not store long-lived npm tokens. Publishing uses GitHub trusted publishing with provenance.

## Git And Safety

- The worktree may contain user changes. Do not revert or overwrite unrelated edits.
- Prefer narrow, package-local changes that match the existing architecture.
- Ask before adding production dependencies, changing peer dependency ranges, or changing release/publish workflows.
