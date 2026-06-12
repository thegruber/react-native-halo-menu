throw new Error(
  [
    "This directory is the react-native-halo-menu library package, not the runnable example app.",
    "Run Expo commands from example/ instead:",
    "  cd example",
    "  npx expo run:ios --device",
    "or:",
    "  pnpm --dir example ios -- --device",
  ].join("\n"),
);
