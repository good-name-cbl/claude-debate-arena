import fs from "fs";
import path from "path";
import { DebateMessage } from "./types";
import { getDebateDataDir } from "./debate-config";

const JSONL_FILE = path.join(getDebateDataDir(), "current.jsonl");

/**
 * Read all messages from the JSONL file.
 */
export function readAllMessages(): DebateMessage[] {
  try {
    if (!fs.existsSync(JSONL_FILE)) {
      return [];
    }
    const content = fs.readFileSync(JSONL_FILE, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as DebateMessage);
  } catch {
    return [];
  }
}

/**
 * Read messages from a given byte offset. Returns new messages and the updated offset.
 */
export function readMessagesFromOffset(offset: number): {
  messages: DebateMessage[];
  newOffset: number;
} {
  try {
    if (!fs.existsSync(JSONL_FILE)) {
      return { messages: [], newOffset: 0 };
    }

    const stat = fs.statSync(JSONL_FILE);
    if (stat.size <= offset) {
      return { messages: [], newOffset: offset };
    }

    const fd = fs.openSync(JSONL_FILE, "r");
    const buffer = Buffer.alloc(stat.size - offset);
    fs.readSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);

    const chunk = buffer.toString("utf8");
    const messages = chunk
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as DebateMessage);

    return { messages, newOffset: stat.size };
  } catch {
    return { messages: [], newOffset: offset };
  }
}

export type WatcherCallback = (messages: DebateMessage[]) => void;

/**
 * Watch the JSONL file for changes and call the callback with new messages.
 * Returns an abort function.
 */
export function watchMessages(callback: WatcherCallback): () => void {
  let currentOffset = 0;

  // Read existing file size as initial offset
  try {
    if (fs.existsSync(JSONL_FILE)) {
      currentOffset = fs.statSync(JSONL_FILE).size;
    }
  } catch {
    // ignore
  }

  // Ensure the directory exists for watching
  const dir = path.dirname(JSONL_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Use polling-based watch for reliability
  const interval = setInterval(() => {
    try {
      if (!fs.existsSync(JSONL_FILE)) return;

      const stat = fs.statSync(JSONL_FILE);
      if (stat.size > currentOffset) {
        const { messages, newOffset } = readMessagesFromOffset(currentOffset);
        currentOffset = newOffset;
        if (messages.length > 0) {
          callback(messages);
        }
      } else if (stat.size < currentOffset) {
        // File was truncated/reset, read from beginning
        currentOffset = 0;
        const { messages, newOffset } = readMessagesFromOffset(0);
        currentOffset = newOffset;
        if (messages.length > 0) {
          callback(messages);
        }
      }
    } catch {
      // ignore polling errors
    }
  }, 200);

  // Also try fs.watch for faster detection
  let watcher: fs.FSWatcher | null = null;
  try {
    watcher = fs.watch(dir, (eventType, filename) => {
      if (filename === "current.jsonl") {
        try {
          if (!fs.existsSync(JSONL_FILE)) return;
          const stat = fs.statSync(JSONL_FILE);
          if (stat.size > currentOffset) {
            const { messages, newOffset } =
              readMessagesFromOffset(currentOffset);
            currentOffset = newOffset;
            if (messages.length > 0) {
              callback(messages);
            }
          }
        } catch {
          // ignore
        }
      }
    });
  } catch {
    // fs.watch not available, polling will handle it
  }

  return () => {
    clearInterval(interval);
    if (watcher) {
      watcher.close();
    }
  };
}
