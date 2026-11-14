import { spawnSync } from "node:child_process";

const [, , script, ...args] = process.argv;

if (!script) {
  console.error("Usage: node tools/run_python.mjs <script.py> [args...]");
  process.exit(2);
}

const candidates = process.platform === "win32"
  ? [{ command: "py", prefix: ["-3"] }, { command: "python", prefix: [] }, { command: "python3", prefix: [] }]
  : [{ command: "python3", prefix: [] }, { command: "python", prefix: [] }];

for (const candidate of candidates) {
  const version = spawnSync(candidate.command, [...candidate.prefix, "--version"], {
    encoding: "utf8",
    windowsHide: true
  });

  const versionText = `${version.stdout ?? ""}${version.stderr ?? ""}`;
  if (version.error || version.status !== 0 || !/Python 3\./.test(versionText)) {
    continue;
  }

  const result = spawnSync(candidate.command, [...candidate.prefix, script, ...args], {
    stdio: "inherit",
    windowsHide: true
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error(
  "Python 3 was not found. Install Python 3 and enable the 'py' launcher, " +
  "or add the Python 3 executable to PATH. Then rerun this command."
);
process.exit(1);
