const { execFileSync } = require("node:child_process");

const pkg = require("../package.json");
const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  encoding: "utf8",
});
// Some npm versions run the prepare lifecycle during pack --dry-run despite
// --ignore-scripts, and its log output lands in stdout ahead of the JSON
// payload. Parse from the line the JSON array starts on.
const jsonStart = output.search(/^\[$/m);
if (jsonStart === -1) {
  console.error(`Could not find JSON output from npm pack:\n${output}`);
  process.exit(1);
}
const [pack] = JSON.parse(output.slice(jsonStart));
const paths = pack.files.map((file) => file.path);

const forbiddenPrefixes = [
  ".github/",
  "android/",
  "coverage/",
  "dist/",
  "example/",
  "ios/",
  "node_modules/",
  "scripts/",
];
const forbiddenFragments = ["/__tests__/", "/__fixtures__/", "/__mocks__/"];
const requiredPaths = [
  "LICENSE",
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "lib/module/index.js",
  // The {"type":"module"} marker that makes the ESM build loadable under the
  // package's "type": "commonjs" root — the build is broken without it.
  "lib/module/package.json",
  "lib/module/expo/index.js",
  "lib/typescript/src/index.d.ts",
  "lib/typescript/src/expo/index.d.ts",
  "src/index.ts",
  "src/expo/index.tsx",
  "mock.js",
  "mock.d.ts",
  "llms.txt",
];

const unexpected = paths.filter(
  (path) =>
    forbiddenPrefixes.some((prefix) => path.startsWith(prefix)) ||
    forbiddenFragments.some((fragment) => path.includes(fragment)) ||
    path.endsWith(".tgz") ||
    path.startsWith("."),
);
const missing = requiredPaths.filter((path) => !paths.includes(path));
const dependencyNames = Object.keys(pkg.dependencies ?? {});

if (unexpected.length > 0 || missing.length > 0 || dependencyNames.length > 0) {
  if (unexpected.length > 0) {
    console.error("Unexpected files in npm package:");
    for (const path of unexpected) console.error(`- ${path}`);
  }

  if (missing.length > 0) {
    console.error("Required files missing from npm package:");
    for (const path of missing) console.error(`- ${path}`);
  }

  if (dependencyNames.length > 0) {
    console.error("Unexpected runtime dependencies in package.json:");
    for (const name of dependencyNames) console.error(`- ${name}`);
    console.error("Use peerDependencies + devDependencies for React Native host libraries.");
  }

  process.exit(1);
}

console.log(`Package contents OK (${paths.length} files, ${pack.size} bytes packed).`);
