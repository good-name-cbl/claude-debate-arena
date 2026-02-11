"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DebateMessage, DebateConfig, Participant } from "@/lib/types";
import ParticipantCard from "./ParticipantCard";
import ModeratorBanner from "./ModeratorBanner";
import TimerDisplay from "./TimerDisplay";
import Timeline from "./Timeline";

export default function DebateStage() {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [connected, setConnected] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load initial data
  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
        setConfig(data.config || null);
      })
      .catch(console.error);
  }, []);

  // SSE connection
  useEffect(() => {
    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects
    };

    es.onmessage = (event) => {
      try {
        const msg: DebateMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);

        // Track new message for animation
        setNewMessageIds((prev) => {
          const next = new Set(prev);
          next.add(msg.timestamp);
          return next;
        });

        // Remove from new set after animation
        setTimeout(() => {
          setNewMessageIds((prev) => {
            const next = new Set(prev);
            next.delete(msg.timestamp);
            return next;
          });
        }, 2000);
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
    };
  }, []);

  const getMessagesForParticipant = useCallback(
    (participantName: string): DebateMessage[] => {
      return messages.filter((m) => m.sender === participantName);
    },
    [messages]
  );

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  const moderator = config.participants.find((p) => p.role === "moderator");
  const advocates = config.participants.filter((p) => p.role === "advocate");
  const leftAdvocates = advocates.filter((p) => p.side === "left");
  const rightAdvocates = advocates.filter((p) => p.side === "right");

  // If no sides are set, split evenly
  if (leftAdvocates.length === 0 && rightAdvocates.length === 0) {
    const half = Math.ceil(advocates.length / 2);
    advocates.forEach((p, i) => {
      if (i < half) leftAdvocates.push(p);
      else rightAdvocates.push(p);
    });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div>
          <h1 className="text-lg font-bold">{config.topic}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-xs text-gray-400">
              {connected ? "接続中" : "再接続中..."}
            </span>
            <span className="text-xs text-gray-600">
              | {messages.length} メッセージ
            </span>
          </div>
        </div>
        <TimerDisplay durationSeconds={config.duration} />
      </header>

      {/* Moderator Banner */}
      {moderator && (
        <div className="px-4 pt-3">
          <ModeratorBanner
            moderator={moderator}
            messages={getMessagesForParticipant(moderator.name)}
            newMessageIds={newMessageIds}
          />
        </div>
      )}

      {/* Main Content: Left Advocates | Timeline | Right Advocates */}
      <main className="flex-1 flex overflow-hidden px-4 pb-4 gap-4 min-h-0">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {leftAdvocates.map((p) => (
            <div key={p.name} className="flex-1 flex flex-col min-h-0">
              <ParticipantCard
                participant={p}
                messages={getMessagesForParticipant(p.name)}
                newMessageIds={newMessageIds}
              />
            </div>
          ))}
        </div>

        {/* Center Timeline */}
        <div className="w-72 flex-shrink-0 border-x border-gray-800 bg-gray-900/50 rounded-lg overflow-hidden">
          <Timeline
            messages={messages}
            participants={config.participants}
            newMessageIds={newMessageIds}
          />
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {rightAdvocates.map((p) => (
            <div key={p.name} className="flex-1 flex flex-col min-h-0">
              <ParticipantCard
                participant={p}
                messages={getMessagesForParticipant(p.name)}
                newMessageIds={newMessageIds}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
