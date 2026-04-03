// @ts-nocheck
export type RepeatInterval = "none" | "daily" | "weekly" | "monthly";

export interface ScheduledMessage {
  id: string;
  chatId: string;
  text: string;
  scheduledAt: string;
  createdAt: string;
  repeat: RepeatInterval;
  lastSentAt?: string;
}

const STORAGE_KEY = "echat_scheduled_messages";

function loadMessages(): ScheduledMessage[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return data.map((m: ScheduledMessage) => ({ ...m, repeat: m.repeat || "none" }));
  } catch {
    return [];
  }
}

function saveMessages(messages: ScheduledMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function getScheduledMessages(chatId?: string): ScheduledMessage[] {
  const messages = loadMessages();
  if (chatId) return messages.filter((m) => m.chatId === chatId);
  return messages;
}

export function addScheduledMessage(
  chatId: string,
  text: string,
  scheduledAt: Date,
  repeat: RepeatInterval = "none",
): ScheduledMessage {
  const messages = loadMessages();
  const newMessage: ScheduledMessage = {
    id: Date.now().toString(),
    chatId,
    text,
    scheduledAt: scheduledAt.toISOString(),
    createdAt: new Date().toISOString(),
    repeat,
  };
  messages.push(newMessage);
  saveMessages(messages);
  return newMessage;
}

export function removeScheduledMessage(id: string): void {
  const messages = loadMessages();
  saveMessages(messages.filter((m) => m.id !== id));
}

export function getReadyMessages(): ScheduledMessage[] {
  const messages = loadMessages();
  const now = new Date();
  return messages.filter((m) => new Date(m.scheduledAt) <= now);
}

export function clearSentMessages(ids: string[]): void {
  const messages = loadMessages();
  const idSet = new Set(ids);
  const updated: ScheduledMessage[] = [];

  for (const m of messages) {
    if (!idSet.has(m.id)) {
      updated.push(m);
      continue;
    }
    if (m.repeat === "none") continue;

    const scheduled = new Date(m.scheduledAt);
    let next = new Date(scheduled);
    while (next <= new Date()) {
      if (m.repeat === "daily") next.setDate(next.getDate() + 1);
      else if (m.repeat === "weekly") next.setDate(next.getDate() + 7);
      else if (m.repeat === "monthly") next.setMonth(next.getMonth() + 1);
    }
    updated.push({ ...m, scheduledAt: next.toISOString(), lastSentAt: new Date().toISOString() });
  }

  saveMessages(updated);
}

export const REPEAT_LABELS: Record<RepeatInterval, string> = {
  none: "No repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};
