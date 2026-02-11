#!/usr/bin/env node

/**
 * Direct logging script for subagents.
 * Reads a JSON message from stdin and appends to debate-data/current.jsonl.
 *
 * Usage (from agent via Bash):
 *   cat <<'LOGEOF' | node /path/to/log-direct.js
 *   {"sender":"agent-name","recipient":"target","content":"...","summary":"...","messageType":"message"}
 *   LOGEOF
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "debate-data");
const OUTPUT_FILE = path.join(DATA_DIR, "current.jsonl");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  try {
    const msg = JSON.parse(input);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const record = {
      timestamp: new Date().toISOString(),
      sender: msg.sender || "unknown",
      recipient: msg.recipient || "all",
      content: msg.content || "",
      summary: msg.summary || "",
      messageType: msg.messageType || "message",
    };
    fs.appendFileSync(OUTPUT_FILE, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    process.stderr.write(`log-direct.js error: ${err.message}\n`);
  }
});
