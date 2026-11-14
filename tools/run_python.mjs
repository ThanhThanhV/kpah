import { spawnSync } from "node:child_process";

const [, , script, ...args] = process.argv;

if (!script) {
  console.error("Usage: node tools/run_python.mjs <script.py> [args...]");
  process.exit(2);
}

const candidates = process.platform === "win32"
  ? [{ command: "py", prefix: ["-3"] }, { command: "python", prefix: [] }, { command: "python3", prefix: [] }]
  : [{ command: "python3", prefix: [] }, { command: "python", prefix: [] }];

let lastError;
for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.prefix, script, ...args], {
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error?.code === "ENOENT") {
    lastError = result.error;
    continue;
  }
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error(
  "Python 3 was not found. Install Python 3 and enable the 'py' launcher, " +
  "or add python.exe to PATH. Then rerun this command."
);
if (lastError) console.error(lastError.message);
process.exit(1);
