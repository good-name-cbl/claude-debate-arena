"use client";

import { useEffect, useRef } from "react";
import { DebateMessage, Participant } from "@/lib/types";

interface TimelineProps {
  messages: DebateMessage[];
  participants: Participant[];
  newMessageIds: Set<string>;
}

export default function Timeline({
  messages,
  participants,
  newMessageIds,
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const getParticipant = (name: string): Participant | undefined => {
    return participants.find((p) => p.name === name);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-700">
        タイムライン ({messages.length})
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-2"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <p className="text-xs text-gray-600 italic text-center mt-8">
            メッセージ待機中...
          </p>
        ) : (
          messages.map((msg, i) => {
            const p = getParticipant(msg.sender);
            const color = p?.color || "#6B7280";
            const isNew = newMessageIds.has(msg.timestamp);
            const time = new Date(msg.timestamp).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={`${msg.timestamp}-${i}`}
                className={`relative pl-4 transition-all duration-500 ${isNew ? "animate-fade-in" : ""}`}
              >
                {/* Timeline line */}
                <div
                  className="absolute left-1 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: `${color}40` }}
                />
                {/* Timeline dot */}
                <div
                  className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: `${color}80`,
                  }}
                />

                <div className="text-xs">
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="font-bold" style={{ color }}>
                      {p?.displayName || msg.sender}
                    </span>
                    {msg.recipient !== "all" && (
                      <span className="text-gray-600">
                        → {getParticipant(msg.recipient)?.displayName || msg.recipient}
                      </span>
                    )}
                    <span className="text-gray-600 ml-auto flex-shrink-0">
                      {time}
                    </span>
                  </div>
                  <p className="text-gray-400 line-clamp-3 whitespace-pre-wrap">
                    {msg.summary || msg.content.slice(0, 100)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
