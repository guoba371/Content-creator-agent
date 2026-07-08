import { openSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const outPath = join(cwd, "vite-dev.out.log");
const errPath = join(cwd, "vite-dev.err.log");
const viteBin = join(cwd, "node_modules", "vite", "bin", "vite.js");

const out = openSync(outPath, "a");
const err = openSync(errPath, "a");
const child = spawn(
  process.execPath,
  [viteBin, "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
  {
    cwd,
    detached: true,
    stdio: ["ignore", out, err],
    windowsHide: true,
  },
);

child.unref();
writeFileSync(join(cwd, "vite-dev.pid"), String(child.pid));
console.log(JSON.stringify({ pid: child.pid, outPath, errPath }));
