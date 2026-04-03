// @ts-nocheck
export interface QuickReply {
  id: string;
  shortcut: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = "echat_quick_replies";

function load(): QuickReply[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [
      { id: "1", shortcut: "/hi", text: "Hello! How can I help you today?", createdAt: new Date().toISOString() },
      { id: "2", shortcut: "/thanks", text: "Thank you for reaching out!", createdAt: new Date().toISOString() },
      { id: "3", shortcut: "/bye", text: "Goodbye! Have a great day!", createdAt: new Date().toISOString() },
      { id: "4", shortcut: "/brb", text: "I'll be right back, give me a moment.", createdAt: new Date().toISOString() },
      { id: "5", shortcut: "/busy", text: "I'm currently busy, I'll get back to you soon.", createdAt: new Date().toISOString() },
    ];
  } catch {
    return [];
  }
}

function save(replies: QuickReply[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(replies));
}

export function getAllQuickReplies(): QuickReply[] {
  return load();
}

export function searchQuickReplies(query: string): QuickReply[] {
  const q = query.toLowerCase();
  return load().filter(r => r.shortcut.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
}

export function addQuickReply(shortcut: string, text: string): QuickReply {
  const replies = load();
  const reply: QuickReply = {
    id: Date.now().toString(),
    shortcut: shortcut.startsWith("/") ? shortcut : `/${shortcut}`,
    text,
    createdAt: new Date().toISOString(),
  };
  save([...replies, reply]);
  return reply;
}

export function updateQuickReply(id: string, shortcut: string, text: string): void {
  const replies = load().map(r =>
    r.id === id ? { ...r, shortcut: shortcut.startsWith("/") ? shortcut : `/${shortcut}`, text } : r
  );
  save(replies);
}

export function deleteQuickReply(id: string): void {
  save(load().filter(r => r.id !== id));
}
