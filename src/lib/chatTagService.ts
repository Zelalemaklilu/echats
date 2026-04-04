export type TagColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "gray";

export interface ChatTag {
  id: string;
  label: string;
  color: TagColor;
}

export interface ChatTagAssignment {
  chatId: string;
  tagIds: string[];
}

const TAGS_KEY = "echat_chat_tags";
const ASSIGNMENTS_KEY = "echat_chat_tag_assignments";
const TAGS_VERSION_KEY = "echat_chat_tags_v";
const CURRENT_TAGS_VERSION = "2";

const OLD_DEFAULT_IDS = ["work", "personal", "important", "family", "unread"];

function migrateOldDefaults(): void {
  if (localStorage.getItem(TAGS_VERSION_KEY) === CURRENT_TAGS_VERSION) return;
  try {
    const stored = localStorage.getItem(TAGS_KEY);
    if (stored) {
      const tags: ChatTag[] = JSON.parse(stored);
      const cleaned = tags.filter(t => !OLD_DEFAULT_IDS.includes(t.id));
      localStorage.setItem(TAGS_KEY, JSON.stringify(cleaned));
    }
  } catch { /* ignore */ }
  localStorage.setItem(TAGS_VERSION_KEY, CURRENT_TAGS_VERSION);
}

migrateOldDefaults();

export const TAG_COLORS: Record<TagColor, string> = {
  red: "hsl(0, 75%, 55%)",
  orange: "hsl(24, 85%, 55%)",
  yellow: "hsl(45, 90%, 50%)",
  green: "hsl(145, 65%, 45%)",
  blue: "hsl(210, 90%, 55%)",
  purple: "hsl(260, 80%, 60%)",
  pink: "hsl(338, 85%, 60%)",
  gray: "hsl(220, 10%, 55%)",
};

export const DEFAULT_TAGS: ChatTag[] = [];

function loadTags(): ChatTag[] {
  try {
    const stored = localStorage.getItem(TAGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_TAGS;
  } catch {
    return DEFAULT_TAGS;
  }
}

function saveTags(tags: ChatTag[]): void {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

function loadAssignments(): ChatTagAssignment[] {
  try {
    return JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAssignments(assignments: ChatTagAssignment[]): void {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function getAllTags(): ChatTag[] {
  return loadTags();
}

export function createTag(label: string, color: TagColor): ChatTag {
  const tags = loadTags();
  const tag: ChatTag = { id: Date.now().toString(), label, color };
  saveTags([...tags, tag]);
  return tag;
}

export function deleteTag(tagId: string): void {
  saveTags(loadTags().filter(t => t.id !== tagId));
  const assignments = loadAssignments().map(a => ({
    ...a,
    tagIds: a.tagIds.filter(id => id !== tagId),
  }));
  saveAssignments(assignments);
}

export function getChatTags(chatId: string): ChatTag[] {
  const assignments = loadAssignments();
  const assignment = assignments.find(a => a.chatId === chatId);
  if (!assignment) return [];
  const allTags = loadTags();
  return allTags.filter(t => assignment.tagIds.includes(t.id));
}

export function assignTagToChat(chatId: string, tagId: string): void {
  const assignments = loadAssignments();
  const existing = assignments.find(a => a.chatId === chatId);
  if (existing) {
    if (!existing.tagIds.includes(tagId)) {
      existing.tagIds.push(tagId);
    }
    saveAssignments(assignments);
  } else {
    saveAssignments([...assignments, { chatId, tagIds: [tagId] }]);
  }
}

export function removeTagFromChat(chatId: string, tagId: string): void {
  const assignments = loadAssignments();
  const existing = assignments.find(a => a.chatId === chatId);
  if (existing) {
    existing.tagIds = existing.tagIds.filter(id => id !== tagId);
    saveAssignments(assignments);
  }
}

export function getChatsWithTag(tagId: string): string[] {
  return loadAssignments()
    .filter(a => a.tagIds.includes(tagId))
    .map(a => a.chatId);
}
