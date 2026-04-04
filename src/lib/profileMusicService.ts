export interface ProfileMusic {
  userId: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  enabled: boolean;
}

const STORAGE_KEY = "echat_profile_music";

function load(): ProfileMusic[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(music: ProfileMusic[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(music));
}

export function getProfileMusic(userId: string): ProfileMusic | null {
  return load().find(m => m.userId === userId) || null;
}

export function setProfileMusic(music: ProfileMusic): void {
  const all = load().filter(m => m.userId !== music.userId);
  save([...all, music]);
}

export function removeProfileMusic(userId: string): void {
  save(load().filter(m => m.userId !== userId));
}

export function toggleProfileMusic(userId: string): void {
  const all = load();
  const existing = all.find(m => m.userId === userId);
  if (existing) {
    existing.enabled = !existing.enabled;
    save(all);
  }
}
