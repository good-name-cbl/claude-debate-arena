"use client";

import { useState, useEffect, useRef } from "react";
import { DebateMessage, DebateConfig, Participant } from "@/lib/types";
import TimerDisplay from "./TimerDisplay";
import MessageBubble from "./MessageBubble";
import ParticipantSidebar from "./ParticipantSidebar";
import TTSControls from "./TTSControls";
import { useTTS } from "@/hooks/useTTS";

export default function DebateStage() {
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [connected, setConnected] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tts = useTTS({ participants: config?.participants ?? [] });

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
        tts.enqueue(msg);

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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const getParticipant = (name: string): Participant | undefined => {
    return config?.participants.find((p) => p.name === name);
  };

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
        <TTSControls
          enabled={tts.enabled}
          onEnabledChange={tts.setEnabled}
          available={tts.available}
          volume={tts.volume}
          onVolumeChange={tts.setVolume}
          queueLength={tts.queueLength}
          isSpeaking={tts.speakingMessageTimestamp !== null}
          onSkip={tts.skip}
        />
        <TimerDisplay durationSeconds={config.duration} />
      </header>

      {/* Main Content: Sidebar + Chat Feed */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* Participant Sidebar */}
        <div className="w-56 flex-shrink-0 border-r border-gray-800 bg-gray-900/50">
          <ParticipantSidebar
            participants={config.participants}
            messages={messages}
          />
        </div>

        {/* Chat Feed */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center mt-8">
              メッセージ待機中...
            </p>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={`${msg.timestamp}-${i}`}
                message={msg}
                participant={getParticipant(msg.sender)}
                isNew={newMessageIds.has(msg.timestamp)}
                isSpeaking={tts.speakingMessageTimestamp === msg.timestamp}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
