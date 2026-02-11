import { watchMessages } from "@/lib/message-watcher";
import { DebateMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  // Use a padding comment (2KB) to flush internal compression/proxy buffers
  const padding = `: ${" ".repeat(2048)}\n\n`;

  let cleanupWatcher: (() => void) | null = null;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  function cleanupAll() {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
    if (cleanupWatcher) {
      cleanupWatcher();
      cleanupWatcher = null;
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send padding + initial keepalive to flush buffers immediately
      controller.enqueue(encoder.encode(padding));
      controller.enqueue(encoder.encode(": connected\n\n"));

      cleanupWatcher = watchMessages((messages: DebateMessage[]) => {
        try {
          for (const msg of messages) {
            const data = `data: ${JSON.stringify(msg)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch {
          cleanupAll();
        }
      });

      // Keepalive every 15 seconds
      keepaliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          cleanupAll();
        }
      }, 15000);

      // Cleanup when client disconnects via AbortSignal
      request.signal.addEventListener("abort", () => {
        cleanupAll();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanupAll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Content-Encoding": "none",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
