const { spawnSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const exampleDir = join(root, "example");
const outputDir = mkdtempSync(join(tmpdir(), "react-native-halo-menu-export-"));
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

try {
  const result = spawnSync(
    pnpm,
    ["--dir", exampleDir, "exec", "expo", "export", "--platform", "ios", "--output-dir", outputDir],
    { stdio: "inherit" },
  );

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
