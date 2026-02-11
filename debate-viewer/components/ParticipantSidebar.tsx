"use client";

import { DebateMessage, Participant } from "@/lib/types";

interface ParticipantSidebarProps {
  participants: Participant[];
  messages: DebateMessage[];
}

const roleLabel: Record<string, string> = {
  moderator: "司会",
  advocate: "弁論者",
  timekeeper: "計時",
};

export default function ParticipantSidebar({
  participants,
  messages,
}: ParticipantSidebarProps) {
  const countByName = new Map<string, number>();
  for (const msg of messages) {
    countByName.set(msg.sender, (countByName.get(msg.sender) || 0) + 1);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-700">
        参加者
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {participants.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate" style={{ color: p.color }}>
                {p.displayName}
              </div>
              <div className="text-xs text-gray-500">
                {roleLabel[p.role] || p.role} · {countByName.get(p.name) || 0} 発言
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
