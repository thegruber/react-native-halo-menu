# Security Policy

## Supported Versions

Security updates are applied to the latest published version of `react-native-halo-menu`.

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Use GitHub's private vulnerability reporting or open a private GitHub security advisory for this repository. Include:

- affected version
- reproduction steps or proof of concept
- expected and actual impact
- environment (React Native version, Expo SDK if any, Reanimated/Gesture Handler versions, platform)

If private advisory tooling is unavailable, open a public issue with minimal detail and ask for secure maintainer contact.

## Security Model

`react-native-halo-menu` is a pure-TypeScript UI library. It ships no native code, performs no
network requests, reads no device storage, and requires no permissions. Its attack surface is
limited to the JavaScript it executes inside the host app:

- All rendering and gesture work runs on the consumer's existing React Native, Reanimated, and
  Gesture Handler installation; those libraries remain peer dependencies controlled by the host app.
- User-supplied callbacks (`onPress`, `haptics`, `renderIcon`, `renderBackdrop`, `onWarn`) execute
  in the host app's JS context with no additional privileges.
- The package has a single runtime dependency policy of **zero runtime dependencies**; the
  published tarball is verified in CI to contain only library code.
- Releases from `0.1.1` onward are published via GitHub Actions trusted publishing (OIDC) with
  npm provenance attestations, so the npm artifact is cryptographically traceable to a public
  commit and workflow run.

## Response Targets

- Initial response: within 7 days
- Triage and severity assessment: within 14 days
- Patch and release timeline: depends on severity and exploitability
