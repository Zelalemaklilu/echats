export interface ContactNote {
  contactId: string;
  note: string;
  updatedAt: string;
}

const STORAGE_KEY = "echat_contact_notes";

function load(): ContactNote[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(notes: ContactNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getContactNote(contactId: string): string {
  return load().find(n => n.contactId === contactId)?.note || "";
}

export function saveContactNote(contactId: string, note: string): void {
  const notes = load().filter(n => n.contactId !== contactId);
  if (note.trim()) {
    notes.push({ contactId, note: note.trim(), updatedAt: new Date().toISOString() });
  }
  save(notes);
}

export function deleteContactNote(contactId: string): void {
  save(load().filter(n => n.contactId !== contactId));
}
