export interface DebateMessage {
  timestamp: string;
  sender: string;
  recipient: string;
  content: string;
  summary: string;
  messageType: "message" | "broadcast";
}

export type ParticipantRole = "moderator" | "advocate" | "timekeeper";
export type Side = "left" | "right";

export interface Participant {
  name: string;
  displayName: string;
  role: ParticipantRole;
  side?: Side;
  color: string;
  voicevoxSpeakerId?: number;
}

export interface DebateConfig {
  topic: string;
  duration: number; // seconds
  participants: Participant[];
}
