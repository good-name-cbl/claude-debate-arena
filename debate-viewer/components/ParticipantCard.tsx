"use client";

import { useEffect, useRef } from "react";
import { DebateMessage, Participant } from "@/lib/types";
import MessageBubble from "./MessageBubble";

interface ParticipantCardProps {
  participant: Participant;
  messages: DebateMessage[];
  newMessageIds: Set<string>;
}

export default function ParticipantCard({
  participant,
  messages,
  newMessageIds,
}: ParticipantCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 rounded-t-lg"
        style={{
          backgroundColor: `${participant.color}20`,
          borderBottom: `2px solid ${participant.color}`,
        }}
      >
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: participant.color }}
        />
        <div>
          <span className="font-bold text-sm" style={{ color: participant.color }}>
            {participant.displayName}
          </span>
          <span className="text-xs text-gray-500 ml-2">({participant.name})</span>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {messages.length} 発言
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-900/50 rounded-b-lg"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center mt-8">
            発言待ち...
          </p>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={`${msg.timestamp}-${i}`}
              message={msg}
              participant={participant}
              isNew={newMessageIds.has(msg.timestamp)}
            />
          ))
        )}
      </div>
    </div>
  );
}
