import { watchMessages } from "@/lib/message-watcher";
import { DebateMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  // Use a padding comment (2KB) to flush internal compression/proxy buffers
  const padding = `: ${" ".repeat(2048)}\n\n`;

  const stream = new ReadableStream({
    start(controller) {
      // Send padding + initial keepalive to flush buffers immediately
      controller.enqueue(encoder.encode(padding));
      controller.enqueue(encoder.encode(": connected\n\n"));

      const cleanup = watchMessages((messages: DebateMessage[]) => {
        try {
          for (const msg of messages) {
            const data = `data: ${JSON.stringify(msg)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch {
          // Stream closed
          cleanup();
        }
      });

      // Keepalive every 15 seconds
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          cleanup();
        }
      }, 15000);

      // Cleanup when client disconnects
      const checkClosed = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(""));
        } catch {
          clearInterval(checkClosed);
          clearInterval(keepalive);
          cleanup();
        }
      }, 5000);
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
