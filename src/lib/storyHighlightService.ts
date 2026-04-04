const STORAGE_KEY = "echat_story_highlights";

export interface StoryHighlight {
  id: string;
  userId: string;
  name: string;
  coverColor: string;
  storyIds: string[];
  createdAt: number;
}

const HIGHLIGHT_COLORS = [
  "linear-gradient(135deg, hsl(338 85% 60%), hsl(260 80% 55%))",
  "linear-gradient(135deg, hsl(210 90% 50%), hsl(180 70% 45%))",
  "linear-gradient(135deg, hsl(38 92% 55%), hsl(15 80% 55%))",
  "linear-gradient(135deg, hsl(145 65% 42%), hsl(180 70% 40%))",
  "linear-gradient(135deg, hsl(260 80% 55%), hsl(210 70% 50%))",
  "linear-gradient(135deg, hsl(0 75% 55%), hsl(338 85% 55%))",
  "linear-gradient(135deg, hsl(45 90% 55%), hsl(30 85% 50%))",
  "linear-gradient(135deg, hsl(168 75% 42%), hsl(145 65% 40%))",
];

export function getRandomHighlightColor(): string {
  return HIGHLIGHT_COLORS[Math.floor(Math.random() * HIGHLIGHT_COLORS.length)];
}

export const PRESET_HIGHLIGHT_COLORS = HIGHLIGHT_COLORS;

function load(): StoryHighlight[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(highlights: StoryHighlight[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
}

export function getHighlights(userId: string): StoryHighlight[] {
  return load().filter((h) => h.userId === userId);
}

export function createHighlight(
  userId: string,
  name: string,
  coverColor: string,
  storyIds: string[]
): StoryHighlight {
  const highlight: StoryHighlight = {
    id: `hl_${Date.now()}`,
    userId,
    name,
    coverColor,
    storyIds,
    createdAt: Date.now(),
  };
  const all = load();
  all.push(highlight);
  save(all);
  return highlight;
}

export function deleteHighlight(id: string): void {
  const all = load().filter((h) => h.id !== id);
  save(all);
}

export function addStoryToHighlight(highlightId: string, storyId: string): void {
  const all = load();
  const highlight = all.find((h) => h.id === highlightId);
  if (highlight && !highlight.storyIds.includes(storyId)) {
    highlight.storyIds.push(storyId);
    save(all);
  }
}

export function renameHighlight(id: string, name: string): void {
  const all = load();
  const highlight = all.find((h) => h.id === id);
  if (highlight) {
    highlight.name = name;
    save(all);
  }
}
