# Contributing

Thanks for your interest in react-native-halo-menu!

## Development setup

This repo is a pnpm workspace: the library lives at the root, the demo app in `example/`.

```sh
pnpm install          # installs library + example (hoisted)
pnpm --dir example start:dev-client   # run the demo in a development build
```

The example resolves the library's TypeScript **source** live (via the `source` exports
condition) — no build step while developing. Edit `src/`, fast-refresh updates the demo.
Use Expo Go only when its installed native runtime matches the example SDK and dependencies;
for physical-device validation, prefer a development build.

## Quality gate

Run before opening a PR:

```sh
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run format:check
pnpm run package:check   # bob build + publint + arethetypeswrong + pack dry-run
pnpm run example:check   # example typecheck + Expo bundle export
```

CI runs the canonical `pnpm run ci` gate: package quality, example typecheck/export, and a
worklet-directive check against `lib/module`.

## Guidelines

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`…) — release notes are generated
  from them; `CHANGELOG.md` itself is hand-curated per release.
- **Worklets**: every function that runs on the UI runtime carries an explicit `'worklet'`
  directive — including `useAnimatedStyle` / `useAnimatedReaction` bodies and gesture
  callbacks. Directives must survive the build; CI greps `lib/module` for them.
- **No new required runtime dependencies.** App-specific concerns (icons, haptics, blur,
  theming) enter through injection points. Optional helpers may live behind documented subpath
  exports with optional peers, so bare React Native consumers pay nothing.
- **Public API changes** need a strong reason — the surface is deliberately small; prefer
  additive changes.
- **Distribution materials** live in `docs/DISTRIBUTION.md`. Keep launch/demo assets honest:
  show a real-device interaction and do not claim Expo Go support for SDKs the public app does
  not currently include.

## Releases (maintainers)

```sh
pnpm run release   # release-it: runs the full CI gate, then version, tag, GitHub release
```

Update `CHANGELOG.md` by hand before releasing. Publishing is handled by
`.github/workflows/publish.yml` when the GitHub release is published.
Configure npm trusted publishing for:

- Provider: GitHub Actions
- Repository: `thegruber/react-native-halo-menu`
- Workflow filename: `publish.yml`
- Environment: `npm`
- Allowed action: `npm publish`

The publish job uses OIDC (`id-token: write`) and `npm publish --provenance`, so no long-lived
`NPM_TOKEN` should be stored in GitHub.

**First release bootstrap:** trusted publishing can only be configured for a package that
already exists on npm. Publish `0.1.0` once from a logged-in maintainer machine
(`pnpm run ci && npm publish --access public`), then configure the trusted publisher on
npmjs.com and use the workflow for every release after that.
