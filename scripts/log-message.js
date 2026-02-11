#!/usr/bin/env node

/**
 * PostToolUse hook script for capturing SendMessage tool calls.
 * Reads hook input from stdin and appends structured JSONL to debate-data/current.jsonl.
 *
 * Hook input format (JSON on stdin):
 * {
 *   "tool_name": "SendMessage",
 *   "tool_input": { "type", "recipient", "content", "summary" },
 *   "tool_result": { ... },
 *   "session_id": "...",
 *   ...
 * }
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "debate-data");
const OUTPUT_FILE = path.join(DATA_DIR, "current.jsonl");

function main() {
  let input = "";

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", () => {
    try {
      const hookData = JSON.parse(input);

      const toolInput = hookData.tool_input || {};
      const toolResult = hookData.tool_result || {};

      // Only log actual messages and broadcasts (skip shutdown_request, shutdown_response, etc.)
      const messageType = toolInput.type;
      if (messageType !== "message" && messageType !== "broadcast") {
        process.exit(0);
      }

      // Try to determine sender from tool_result routing or session context
      let sender = "unknown";
      if (toolResult.routing && toolResult.routing.sender) {
        sender = toolResult.routing.sender;
      } else if (hookData.agent_name) {
        sender = hookData.agent_name;
      } else if (hookData.session_id) {
        // Fallback: extract agent name from session_id if it contains it
        sender = hookData.session_id;
      }

      const record = {
        timestamp: new Date().toISOString(),
        sender: sender,
        recipient: toolInput.recipient || "all",
        content: toolInput.content || "",
        summary: toolInput.summary || "",
        messageType: messageType,
      };

      // Ensure data directory exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Append to JSONL file
      fs.appendFileSync(OUTPUT_FILE, JSON.stringify(record) + "\n", "utf8");
    } catch (err) {
      // Silently fail to avoid breaking the hook chain
      // Log to stderr for debugging
      process.stderr.write(`log-message.js error: ${err.message}\n`);
    }

    process.exit(0);
  });
}

main();
