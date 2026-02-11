"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { DebateMessage, Participant } from "@/lib/types";

const VOICEVOX_BASE = "http://localhost:50021";
const DEFAULT_SPEAKER_ID = 1;

interface QueueItem {
  message: DebateMessage;
  speakerId: number;
}

interface UseTTSOptions {
  participants: Participant[];
}

export interface UseTTSReturn {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  available: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  speakingMessageTimestamp: string | null;
  queueLength: number;
  skip: () => void;
  enqueue: (message: DebateMessage) => void;
}

export function useTTS({ participants }: UseTTSOptions): UseTTSReturn {
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [speakingMessageTimestamp, setSpeakingMessageTimestamp] = useState<string | null>(null);
  const [queueLength, setQueueLength] = useState(0);

  const queueRef = useRef<QueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  const participantsRef = useRef(participants);

  // Keep refs in sync with state
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // Apply volume changes to currently playing audio
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Check VOICEVOX availability on mount + periodically
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${VOICEVOX_BASE}/version`, {
          signal: AbortSignal.timeout(2000),
        });
        if (!cancelled) setAvailable(res.ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    }

    check();
    const interval = setInterval(check, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function synthesize(text: string, speakerId: number): Promise<Blob> {
    const queryRes = await fetch(
      `${VOICEVOX_BASE}/audio_query?speaker=${speakerId}&text=${encodeURIComponent(text)}`,
      { method: "POST" }
    );
    if (!queryRes.ok) throw new Error(`audio_query failed: ${queryRes.status}`);
    const query = await queryRes.json();

    const synthRes = await fetch(
      `${VOICEVOX_BASE}/synthesis?speaker=${speakerId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      }
    );
    if (!synthRes.ok) throw new Error(`synthesis failed: ${synthRes.status}`);

    return synthRes.blob();
  }

  function playAudio(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = volumeRef.current;
      currentAudioRef.current = audio;

      audio.onended = () => {
        currentAudioRef.current = null;
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        currentAudioRef.current = null;
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch((err) => {
        currentAudioRef.current = null;
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  }

  async function processQueue() {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    while (queueRef.current.length > 0) {
      if (!enabledRef.current) {
        queueRef.current = [];
        setQueueLength(0);
        break;
      }

      const item = queueRef.current[0];
      setSpeakingMessageTimestamp(item.message.timestamp);

      try {
        const blob = await synthesize(item.message.content, item.speakerId);
        if (!enabledRef.current) {
          queueRef.current = [];
          setQueueLength(0);
          break;
        }
        await playAudio(blob);
      } catch (err) {
        console.warn("[TTS] Synthesis/playback failed, skipping:", err);
      }

      queueRef.current.shift();
      setQueueLength(queueRef.current.length);
    }

    setSpeakingMessageTimestamp(null);
    isPlayingRef.current = false;
  }

  const enqueue = useCallback((message: DebateMessage) => {
    if (!enabledRef.current) return;

    const participant = participantsRef.current.find(
      (p) => p.name === message.sender
    );
    const speakerId = participant?.voicevoxSpeakerId ?? DEFAULT_SPEAKER_ID;

    queueRef.current.push({ message, speakerId });
    setQueueLength(queueRef.current.length);
    processQueue();
  }, []);

  const skip = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.dispatchEvent(new Event("ended"));
    }
  }, []);

  // When TTS is disabled, stop current playback and clear queue
  useEffect(() => {
    if (!enabled) {
      queueRef.current = [];
      setQueueLength(0);
      setSpeakingMessageTimestamp(null);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    }
  }, [enabled]);

  return {
    enabled,
    setEnabled,
    available,
    volume,
    setVolume,
    speakingMessageTimestamp,
    queueLength,
    skip,
    enqueue,
  };
}
