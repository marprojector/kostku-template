#!/usr/bin/env node

const { spawn } = require("child_process");
const { closeDb } = require("../src/lib/db");

const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start"], {
  stdio: "inherit",
  env: process.env,
});

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  child.kill(signal);
  try { closeDb(); } catch { /* DB may not have been initialized. */ }
}

process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
child.on("exit", (code, signal) => {
  try { closeDb(); } catch { /* DB may not have been initialized. */ }
  process.exit(code ?? (signal ? 1 : 0));
});
