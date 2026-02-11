"use client";

import { DebateMessage, Participant } from "@/lib/types";
import MessageBubble from "./MessageBubble";

interface ModeratorBannerProps {
  moderator: Participant;
  messages: DebateMessage[];
  newMessageIds: Set<string>;
}

export default function ModeratorBanner({
  moderator,
  messages,
  newMessageIds,
}: ModeratorBannerProps) {
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{
        backgroundColor: `${moderator.color}10`,
        border: `1px solid ${moderator.color}40`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: moderator.color }}
        />
        <span className="font-bold text-sm" style={{ color: moderator.color }}>
          {moderator.displayName}
        </span>
        <span className="text-xs text-gray-500">({moderator.name})</span>
      </div>

      {latestMessage ? (
        <MessageBubble
          message={latestMessage}
          participant={moderator}
          isNew={newMessageIds.has(latestMessage.timestamp)}
        />
      ) : (
        <p className="text-sm text-gray-500 italic">発言待ち...</p>
      )}

      {messages.length > 1 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
            過去の発言 ({messages.length - 1}件)
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {messages.slice(0, -1).map((msg, i) => (
              <MessageBubble
                key={`${msg.timestamp}-${i}`}
                message={msg}
                participant={moderator}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
