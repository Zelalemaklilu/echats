// @ts-nocheck
const STORAGE_KEY = "echat_sharing_prevention";

interface SharingPreventionSettings {
  chatId: string;
  preventForwarding: boolean;
  preventScreenshot: boolean;
}

function load(): SharingPreventionSettings[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(settings: SharingPreventionSettings[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getSharingSettings(chatId: string): SharingPreventionSettings {
  return load().find(s => s.chatId === chatId) || {
    chatId,
    preventForwarding: false,
    preventScreenshot: false,
  };
}

export function updateSharingSettings(chatId: string, updates: Partial<Omit<SharingPreventionSettings, "chatId">>): void {
  const settings = load().filter(s => s.chatId !== chatId);
  const current = load().find(s => s.chatId === chatId) || {
    chatId,
    preventForwarding: false,
    preventScreenshot: false,
  };
  save([...settings, { ...current, ...updates }]);
}

export function isForwardingPrevented(chatId: string): boolean {
  return getSharingSettings(chatId).preventForwarding;
}
