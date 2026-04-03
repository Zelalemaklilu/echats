// @ts-nocheck
const ENABLED_KEY = "echat_smart_notif";
const KEYWORDS_KEY = "echat_smart_notif_keywords";
const PRIORITY_KEY = "echat_smart_notif_priority";

const DEFAULT_KEYWORDS = ["urgent", "asap", "help", "emergency", "call me", "please call", "money", "payment", "important", "now", "hurry"];

export function isSmartNotifEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === "true";
}
export function setSmartNotifEnabled(v: boolean) { localStorage.setItem(ENABLED_KEY, String(v)); }

export function getKeywords(): string[] {
  try { return JSON.parse(localStorage.getItem(KEYWORDS_KEY) || "null") || DEFAULT_KEYWORDS; } catch { return DEFAULT_KEYWORDS; }
}
export function setKeywords(kw: string[]) { localStorage.setItem(KEYWORDS_KEY, JSON.stringify(kw)); }

export function getPriorityContacts(): string[] {
  try { return JSON.parse(localStorage.getItem(PRIORITY_KEY) || "[]"); } catch { return []; }
}
export function setPriorityContacts(ids: string[]) { localStorage.setItem(PRIORITY_KEY, JSON.stringify(ids)); }

export function isImportantMessage(text: string, senderId: string): boolean {
  if (!isSmartNotifEnabled()) return true;
  const lower = text.toLowerCase();
  if (getKeywords().some(kw => lower.includes(kw))) return true;
  if (getPriorityContacts().includes(senderId)) return true;
  return false;
}
