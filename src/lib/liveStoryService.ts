export interface LiveStory {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  isLive: boolean;
  roomId: string;
}

export interface LiveComment {
  id: string;
  userId: string;
  username: string;
  text: string;
  sentAt: string;
}

const LIVE_KEY = "echat_live_stories";
const COMMENTS_KEY = "echat_live_comments";

function loadLiveStories(): LiveStory[] {
  try {
    return JSON.parse(localStorage.getItem(LIVE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLiveStories(stories: LiveStory[]): void {
  localStorage.setItem(LIVE_KEY, JSON.stringify(stories));
}

export function startLiveStory(userId: string, username: string, title: string, avatarUrl?: string): LiveStory {
  const existing = loadLiveStories();
  const live: LiveStory = {
    id: Date.now().toString(),
    userId,
    username,
    avatarUrl,
    title,
    viewerCount: 0,
    startedAt: new Date().toISOString(),
    isLive: true,
    roomId: `live_${userId}_${Date.now()}`,
  };
  existing.push(live);
  saveLiveStories(existing);
  return live;
}

export function endLiveStory(storyId: string): void {
  const stories = loadLiveStories().map(s =>
    s.id === storyId ? { ...s, isLive: false } : s
  );
  saveLiveStories(stories);
}

export function getActiveLiveStories(): LiveStory[] {
  return loadLiveStories().filter(s => s.isLive);
}

export function joinLiveStory(storyId: string): void {
  const stories = loadLiveStories().map(s =>
    s.id === storyId ? { ...s, viewerCount: s.viewerCount + 1 } : s
  );
  saveLiveStories(stories);
}

export function leaveLiveStory(storyId: string): void {
  const stories = loadLiveStories().map(s =>
    s.id === storyId ? { ...s, viewerCount: Math.max(0, s.viewerCount - 1) } : s
  );
  saveLiveStories(stories);
}

export function getLiveComments(storyId: string): LiveComment[] {
  try {
    const all: Record<string, LiveComment[]> = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "{}");
    return all[storyId] || [];
  } catch {
    return [];
  }
}

export function addLiveComment(storyId: string, userId: string, username: string, text: string): LiveComment {
  try {
    const all: Record<string, LiveComment[]> = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "{}");
    if (!all[storyId]) all[storyId] = [];
    const comment: LiveComment = {
      id: Date.now().toString(),
      userId,
      username,
      text,
      sentAt: new Date().toISOString(),
    };
    all[storyId].push(comment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
    return comment;
  } catch {
    return { id: "", userId, username, text, sentAt: new Date().toISOString() };
  }
}
