const KEY = "echat_msg_timers";

function load(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function save(d: Record<string, string>) { localStorage.setItem(KEY, JSON.stringify(d)); }

export function setMessageTimer(messageId: string, ms: number): void {
  const d = load();
  d[messageId] = new Date(Date.now() + ms).toISOString();
  save(d);
}

export function getMessageTimer(messageId: string): string | null {
  return load()[messageId] || null;
}

export function getExpiredMessages(): string[] {
  const d = load();
  const now = Date.now();
  return Object.entries(d).filter(([, exp]) => new Date(exp).getTime() <= now).map(([id]) => id);
}

export function clearMessageTimer(messageId: string): void {
  const d = load();
  delete d[messageId];
  save(d);
}

export function clearExpiredTimers(onExpire: (messageId: string) => void): void {
  const d = load();
  const now = Date.now();
  const updated = { ...d };
  for (const [id, exp] of Object.entries(d)) {
    if (new Date(exp).getTime() <= now) {
      onExpire(id);
      delete updated[id];
    }
  }
  save(updated);
}

export const TIMER_PRESETS = [
  { label: "1 min",  ms: 60_000 },
  { label: "5 min",  ms: 300_000 },
  { label: "30 min", ms: 1_800_000 },
  { label: "1 hr",   ms: 3_600_000 },
  { label: "24 hr",  ms: 86_400_000 },
];
