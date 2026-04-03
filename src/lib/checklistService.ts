export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  chatId: string;
  title: string;
  items: ChecklistItem[];
  createdBy: string;
  createdAt: string;
}

const STORAGE_KEY = "echat_checklists";

function load(): Checklist[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(checklists: Checklist[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
}

export function createChecklist(
  chatId: string,
  title: string,
  items: string[],
  createdBy: string,
): Checklist {
  const checklists = load();
  const checklist: Checklist = {
    id: Date.now().toString(),
    chatId,
    title,
    items: items.map((text, i) => ({ id: `${Date.now()}_${i}`, text, checked: false })),
    createdBy,
    createdAt: new Date().toISOString(),
  };
  checklists.push(checklist);
  save(checklists);
  return checklist;
}

export function toggleChecklistItem(checklistId: string, itemId: string): Checklist | null {
  const checklists = load();
  const checklist = checklists.find(c => c.id === checklistId);
  if (!checklist) return null;
  const item = checklist.items.find(i => i.id === itemId);
  if (item) item.checked = !item.checked;
  save(checklists);
  return checklist;
}

export function getChecklistsForChat(chatId: string): Checklist[] {
  return load().filter(c => c.chatId === chatId);
}

export function getChecklist(id: string): Checklist | null {
  return load().find(c => c.id === id) || null;
}

export function deleteChecklist(id: string): void {
  save(load().filter(c => c.id !== id));
}
