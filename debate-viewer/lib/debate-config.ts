import { DebateConfig } from "./types";

const DATA_DIR = process.env.DEBATE_DATA_DIR || "/home/makkan/workspace/claude_code_test/debate-data";

export function getDebateDataDir(): string {
  return DATA_DIR;
}

export async function loadDebateConfig(): Promise<DebateConfig> {
  const fs = await import("fs");
  const path = await import("path");

  const configPath = path.join(DATA_DIR, "config.json");

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw) as DebateConfig;
  } catch {
    // Return default config if file doesn't exist
    return {
      topic: "討論会",
      duration: 180,
      participants: [],
    };
  }
}
