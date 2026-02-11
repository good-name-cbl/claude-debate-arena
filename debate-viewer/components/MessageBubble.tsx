"use client";

import { DebateMessage, Participant } from "@/lib/types";

interface MessageBubbleProps {
  message: DebateMessage;
  participant?: Participant;
  isNew?: boolean;
  isSpeaking?: boolean;
}

export default function MessageBubble({
  message,
  participant,
  isNew,
  isSpeaking,
}: MessageBubbleProps) {
  const color = participant?.color || "#6B7280";
  const time = new Date(message.timestamp).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={`mb-3 transition-all duration-500 ${isNew ? "animate-fade-in" : ""}`}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs font-bold" style={{ color }}>
          {participant?.displayName || message.sender}
        </span>
        {isSpeaking && (
          <span className="text-xs animate-pulse" title="読み上げ中">
            {"\u{1F50A}"}
          </span>
        )}
        {message.recipient !== "all" && (
          <span className="text-xs text-gray-500">
            → {message.recipient}
          </span>
        )}
        <span className="text-xs text-gray-600">{time}</span>
      </div>
      <div
        className="rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300"
        style={{
          backgroundColor: isSpeaking ? `${color}25` : `${color}15`,
          borderLeft: `3px solid ${color}`,
          ...(isSpeaking ? { boxShadow: `0 0 0 1px ${color}80` } : {}),
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
