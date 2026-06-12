# Contributing

Thanks for your interest in react-native-halo-menu!

## Development setup

This repo is a pnpm workspace: the library lives at the root, the demo app in `example/`.

```sh
pnpm install          # installs library + example (hoisted)
pnpm --dir example start   # run the demo in Expo Go / a dev build
```

The example resolves the library's TypeScript **source** live (via the `source` exports
condition) — no build step while developing. Edit `src/`, fast-refresh updates the demo.

## Quality gate

Run before opening a PR:

```sh
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run format:check
pnpm run package:check   # bob build + publint + arethetypeswrong + pack dry-run
```

CI runs the same checks plus a Metro bundle of the example (`expo export`).

## Guidelines

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`…) — the changelog is generated
  from them.
- **Worklets**: every function that runs on the UI runtime carries an explicit `'worklet'`
  directive — including `useAnimatedStyle` / `useAnimatedReaction` bodies and gesture
  callbacks. Directives must survive the build; CI greps `lib/module` for them.
- **No new runtime dependencies.** App-specific concerns (icons, haptics, blur, theming)
  enter through the existing injection points, never as dependencies.
- **Public API changes** need a strong reason — the surface is deliberately small; prefer
  additive changes.

## Releases (maintainers)

```sh
pnpm run release   # release-it: version, changelog, tag, GitHub release
npm publish --access public   # separate, deliberate step
```
