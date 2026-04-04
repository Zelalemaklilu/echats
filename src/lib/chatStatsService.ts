export interface ChatStats {
  totalMessages: number;
  yourMessages: number;
  theirMessages: number;
  mediaCount: number;
  voiceCount: number;
  avgWordsPerMessage: number;
  mostActiveHour: number;
  firstMessageDate: string | null;
}

interface StatMessage {
  content: string | null;
  message_type: string | null;
  created_at: string | null;
  sender_id: string | null;
}

export function computeStats(messages: StatMessage[], currentUserId: string): ChatStats {
  if (!messages.length) return { totalMessages: 0, yourMessages: 0, theirMessages: 0, mediaCount: 0, voiceCount: 0, avgWordsPerMessage: 0, mostActiveHour: 12, firstMessageDate: null };

  const hourCounts = new Array(24).fill(0);
  let totalWords = 0;
  let textCount = 0;

  const stats = messages.reduce((acc, m) => {
    const isOwn = m.sender_id === currentUserId;
    acc.totalMessages++;
    if (isOwn) acc.yourMessages++; else acc.theirMessages++;
    if (m.message_type === "image" || m.message_type === "file" || m.message_type === "video") acc.mediaCount++;
    if (m.message_type === "voice") acc.voiceCount++;
    if (m.message_type === "text" && m.content) {
      totalWords += m.content.trim().split(/\s+/).length;
      textCount++;
    }
    if (m.created_at) {
      const h = new Date(m.created_at).getHours();
      hourCounts[h]++;
    }
    return acc;
  }, { totalMessages: 0, yourMessages: 0, theirMessages: 0, mediaCount: 0, voiceCount: 0 });

  const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
  const firstMessageDate = messages[messages.length - 1]?.created_at || null;
  const avgWordsPerMessage = textCount > 0 ? Math.round(totalWords / textCount) : 0;

  return { ...stats, avgWordsPerMessage, mostActiveHour, firstMessageDate };
}
