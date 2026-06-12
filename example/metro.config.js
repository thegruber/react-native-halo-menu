const { getDefaultConfig } = require("@expo/metro-config");
const { withMetroConfig } = require("react-native-monorepo-config");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Resolves react-native-halo-menu to the repo root via the `source` exports
// condition (live TS, no build step).
const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

// withMetroConfig's blockList assumes a yarn layout where the example owns its
// own dep copies and root copies are duplicates. Under pnpm `nodeLinker:
// hoisted` the root copy is the ONLY copy — nothing to dedupe, so unblock.
config.resolver.blockList = [];

module.exports = config;
