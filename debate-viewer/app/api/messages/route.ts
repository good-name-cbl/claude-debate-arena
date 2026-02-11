import { NextResponse } from "next/server";
import { readAllMessages } from "@/lib/message-watcher";
import { loadDebateConfig } from "@/lib/debate-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const [messages, config] = await Promise.all([
    readAllMessages(),
    loadDebateConfig(),
  ]);

  return NextResponse.json({ messages, config });
}
