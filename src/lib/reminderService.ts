// @ts-nocheck
const KEY = "echat_reminders";

export interface Reminder {
  id: string;
  messageId: string;
  chatId: string;
  messageText: string;
  remindAt: string;
}

function load(): Reminder[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(d: Reminder[]) { localStorage.setItem(KEY, JSON.stringify(d)); }

export function addReminder(chatId: string, messageId: string, messageText: string, remindAt: Date): Reminder {
  const r: Reminder = { id: `rem_${Date.now()}`, messageId, chatId, messageText: messageText.slice(0, 80), remindAt: remindAt.toISOString() };
  save([...load(), r]);
  return r;
}

export function getReminders(): Reminder[] { return load(); }

export function removeReminder(id: string): void { save(load().filter(r => r.id !== id)); }

export function getDueReminders(): Reminder[] {
  const now = Date.now();
  const all = load();
  const due = all.filter(r => new Date(r.remindAt).getTime() <= now);
  if (due.length) save(all.filter(r => new Date(r.remindAt).getTime() > now));
  return due;
}

export const REMINDER_PRESETS = [
  { label: "In 30 min", ms: 30 * 60_000 },
  { label: "In 1 hr",   ms: 60 * 60_000 },
  { label: "In 3 hrs",  ms: 3 * 60 * 60_000 },
  { label: "Tomorrow 9am", ms: (() => {
      const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0); return t.getTime() - Date.now();
    })() },
];
