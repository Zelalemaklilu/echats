import { supabase } from "@/integrations/supabase/client";

export interface ExportOptions {
  chatId: string;
  chatName: string;
  format: "json" | "text";
  includeMedia?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ImportResult {
  messages: any[];
  count: number;
  dateRange: { from: string; to: string } | null;
}

export function exportChat(messages: any[], options: ExportOptions): void {
  let filtered = messages;
  if (options.dateFrom) filtered = filtered.filter(m => m.created_at >= options.dateFrom!);
  if (options.dateTo) filtered = filtered.filter(m => m.created_at <= options.dateTo! + "T23:59:59Z");
  if (!options.includeMedia) filtered = filtered.filter(m => m.message_type === "text");

  let content: string;
  let mimeType: string;
  let ext: string;

  if (options.format === "json") {
    content = JSON.stringify({ chatName: options.chatName, exportedAt: new Date().toISOString(), messages: filtered }, null, 2);
    mimeType = "application/json";
    ext = "json";
  } else {
    const lines = [`Echat Export — ${options.chatName}`, `Exported on ${new Date().toLocaleString()}`, "─".repeat(40), ""];
    for (const msg of filtered) {
      const date = new Date(msg.created_at).toLocaleString();
      const sender = msg.isOwn ? "You" : (msg.sender_name || "Other");
      let text = msg.text || "";
      if (msg.message_type !== "text") text = `[${msg.message_type}]`;
      lines.push(`[${date}] ${sender}: ${text}`);
    }
    content = lines.join("\n");
    mimeType = "text/plain;charset=utf-8";
    ext = "txt";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `echat-${options.chatName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importChat(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let messages: any[] = [];
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          messages = parsed.messages || [];
        } else {
          const lines = text.split("\n").filter(l => l.trim());
          messages = lines.filter(l => l.match(/^\[.+\]/)).map((line, i) => {
            const match = line.match(/^\[(.+?)\] (.+?): (.*)$/);
            return match ? { id: `import-${i}`, created_at: match[1], sender_name: match[2], text: match[3], message_type: "text" } : null;
          }).filter(Boolean);
        }
        const dates = messages.map(m => m.created_at).filter(Boolean).sort();
        resolve({
          messages,
          count: messages.length,
          dateRange: dates.length >= 2 ? { from: dates[0], to: dates[dates.length - 1] } : null,
        });
      } catch (e) {
        reject(new Error("Failed to parse file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export async function exportChatAsText(chatId: string, chatName: string): Promise<void> {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("created_at, sender_id, text, message_type, profiles:sender_id(username, full_name)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw new Error("Failed to fetch messages: " + error.message);

  const lines: string[] = [`Echat Export — ${chatName}`, `Exported on ${new Date().toLocaleString()}`, "─".repeat(40), ""];
  for (const msg of messages ?? []) {
    const profile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
    const senderName = (profile as any)?.full_name || (profile as any)?.username || "Unknown";
    const date = new Date(msg.created_at).toLocaleString();
    let content = msg.text || "";
    if (msg.message_type === "image") content = "[Image]";
    else if (msg.message_type === "video") content = "[Video]";
    else if (msg.message_type === "voice") content = "[Voice Message]";
    else if (msg.message_type === "file") content = "[File]";
    else if (msg.message_type === "location") content = "[Location]";
    lines.push(`[${date}] ${senderName}: ${content}`);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `echat-${chatName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAllChatsAsText(userId: string): Promise<void> {
  const { data: chats, error } = await supabase
    .from("chats")
    .select("id, user1_id, user2_id, profiles:user1_id(username, full_name), profiles2:user2_id(username, full_name)")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .limit(50);

  if (error) throw new Error("Failed to fetch chats: " + error.message);

  const lines: string[] = [`Echat Full Export`, `Exported on ${new Date().toLocaleString()}`, "═".repeat(50), ""];

  for (const chat of chats ?? []) {
    const otherProfile = chat.user1_id === userId
      ? (Array.isArray(chat.profiles2) ? (chat.profiles2 as any[])[0] : chat.profiles2)
      : (Array.isArray(chat.profiles) ? (chat.profiles as any[])[0] : chat.profiles);
    const name = (otherProfile as any)?.full_name || (otherProfile as any)?.username || "Unknown";
    const { data: msgs } = await supabase
      .from("messages")
      .select("created_at, sender_id, text, message_type")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true })
      .limit(500);

    lines.push(`── Chat with ${name} ──`);
    for (const msg of msgs ?? []) {
      const date = new Date(msg.created_at).toLocaleString();
      const sender = msg.sender_id === userId ? "You" : name;
      const content = msg.message_type !== "text" ? `[${msg.message_type}]` : (msg.text || "");
      lines.push(`[${date}] ${sender}: ${content}`);
    }
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `echat-full-export-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
