// @ts-nocheck
/**
 * Group Extension Service
 * localStorage-based enhancements for group chats:
 * reactions on messages, pinned messages, banned members, invite links,
 * message edits, and poll references
 */

function rj<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function wj<T>(key: string, v: T): void { localStorage.setItem(key, JSON.stringify(v)); }

// ─── REACTIONS ────────────────────────────────────────────────────────────────
// stored as: groupId → messageId → emoji → userId[]

const reactKey = (gid: string) => `zg_reactions_${gid}`;

type ReactionsMap = Record<string, Record<string, string[]>>;

export function getGroupReactions(groupId: string): ReactionsMap {
  return rj<ReactionsMap>(reactKey(groupId), {});
}

export function getMessageReactions(groupId: string, messageId: string): Record<string, string[]> {
  return getGroupReactions(groupId)[messageId] || {};
}

export function toggleGroupReaction(groupId: string, messageId: string, emoji: string, userId: string): void {
  const all = getGroupReactions(groupId);
  if (!all[messageId]) all[messageId] = {};
  const users = all[messageId][emoji] || [];
  if (users.includes(userId)) {
    all[messageId][emoji] = users.filter(u => u !== userId);
    if (all[messageId][emoji].length === 0) delete all[messageId][emoji];
  } else {
    all[messageId][emoji] = [...users, userId];
  }
  if (Object.keys(all[messageId]).length === 0) delete all[messageId];
  wj(reactKey(groupId), all);
}

// ─── PINNED MESSAGE ────────────────────────────────────────────────────────────

const pinnedKey = (gid: string) => `zg_pinned_${gid}`;

export interface GroupPinnedMessage {
  messageId: string;
  content: string;
  pinnedBy: string;
  pinnedAt: string;
}

export function getPinnedMessage(groupId: string): GroupPinnedMessage | null {
  return rj<GroupPinnedMessage | null>(pinnedKey(groupId), null);
}

export function pinGroupMessage(groupId: string, messageId: string, content: string, userId: string): void {
  wj(pinnedKey(groupId), { messageId, content, pinnedBy: userId, pinnedAt: new Date().toISOString() });
}

export function unpinGroupMessage(groupId: string): void {
  localStorage.removeItem(pinnedKey(groupId));
}

// ─── BANNED MEMBERS ────────────────────────────────────────────────────────────

const bannedKey = (gid: string) => `zg_banned_${gid}`;

export interface BannedMember {
  userId: string;
  bannedBy: string;
  bannedAt: string;
  reason?: string;
}

export function getBannedMembers(groupId: string): BannedMember[] {
  return rj<BannedMember[]>(bannedKey(groupId), []);
}

export function banMember(groupId: string, userId: string, bannedBy: string, reason?: string): void {
  const banned = getBannedMembers(groupId).filter(b => b.userId !== userId);
  banned.push({ userId, bannedBy, bannedAt: new Date().toISOString(), reason });
  wj(bannedKey(groupId), banned);
}

export function unbanMember(groupId: string, userId: string): void {
  wj(bannedKey(groupId), getBannedMembers(groupId).filter(b => b.userId !== userId));
}

export function isMemberBanned(groupId: string, userId: string): boolean {
  return getBannedMembers(groupId).some(b => b.userId === userId);
}

// ─── INVITE LINKS ─────────────────────────────────────────────────────────────

const inviteKey = (gid: string) => `zg_invite_${gid}`;

export interface GroupInviteLink {
  code: string;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export function getOrCreateInviteLink(groupId: string, userId: string): GroupInviteLink {
  const existing = rj<GroupInviteLink | null>(inviteKey(groupId), null);
  if (existing) return existing;
  const link: GroupInviteLink = {
    code: Math.random().toString(36).slice(2, 12).toUpperCase(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };
  wj(inviteKey(groupId), link);
  return link;
}

export function revokeInviteLink(groupId: string, userId: string): GroupInviteLink {
  const link: GroupInviteLink = {
    code: Math.random().toString(36).slice(2, 12).toUpperCase(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };
  wj(inviteKey(groupId), link);
  return link;
}

// ─── EDITED MESSAGES ──────────────────────────────────────────────────────────

const editsKey = (gid: string) => `zg_edits_${gid}`;

type EditsMap = Record<string, { content: string; editedAt: string }>;

export function getGroupEdits(groupId: string): EditsMap {
  return rj<EditsMap>(editsKey(groupId), {});
}

export function editGroupMessage(groupId: string, messageId: string, newContent: string): void {
  const edits = getGroupEdits(groupId);
  edits[messageId] = { content: newContent, editedAt: new Date().toISOString() };
  wj(editsKey(groupId), edits);
}

export function getEditedContent(groupId: string, messageId: string): string | null {
  return getGroupEdits(groupId)[messageId]?.content || null;
}

// ─── POLL REFERENCES (for ordering polls with messages) ───────────────────────

const pollRefKey = (gid: string) => `zg_pollrefs_${gid}`;

export interface PollRef {
  pollId: string;
  createdAt: string;
  createdBy: string;
}

export function getGroupPollRefs(groupId: string): PollRef[] {
  return rj<PollRef[]>(pollRefKey(groupId), []);
}

export function addGroupPollRef(groupId: string, pollId: string, userId: string): void {
  const refs = getGroupPollRefs(groupId);
  refs.push({ pollId, createdAt: new Date().toISOString(), createdBy: userId });
  wj(pollRefKey(groupId), refs);
}

// ─── SAVED MESSAGES (LOCAL) ───────────────────────────────────────────────────

const savedKey = `zg_saved_local`;

export interface LocalSavedMessage {
  id: string;
  groupId: string;
  messageId: string;
  content: string;
  senderName: string;
  savedAt: string;
}

export function getSavedMessagesLocal(): LocalSavedMessage[] {
  return rj<LocalSavedMessage[]>(savedKey, []);
}

export function saveMessageLocal(groupId: string, messageId: string, content: string, senderName: string): void {
  const saved = getSavedMessagesLocal();
  if (saved.find(s => s.messageId === messageId)) return;
  saved.push({
    id: `sm_${Date.now()}`,
    groupId,
    messageId,
    content,
    senderName,
    savedAt: new Date().toISOString(),
  });
  wj(savedKey, saved);
}

export function isMessageSavedLocal(messageId: string): boolean {
  return getSavedMessagesLocal().some(s => s.messageId === messageId);
}
