import path from "path";
import { DebateConfig } from "./types";

export function getDebateDataDir(): string {
  return process.env.DEBATE_DATA_DIR || path.resolve(process.cwd(), "..", "debate-data");
}

export async function loadDebateConfig(): Promise<DebateConfig> {
  const fs = await import("fs");

  const configPath = path.join(getDebateDataDir(), "config.json");

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
