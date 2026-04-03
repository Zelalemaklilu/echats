const KEY = "echat_close_friends";

export function getCloseFriends(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function isCloseFriend(userId: string): boolean {
  return getCloseFriends().includes(userId);
}

export function addCloseFriend(userId: string): void {
  const list = getCloseFriends();
  if (!list.includes(userId)) {
    list.push(userId);
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

export function removeCloseFriend(userId: string): void {
  const list = getCloseFriends().filter((id) => id !== userId);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toggleCloseFriend(userId: string): boolean {
  if (isCloseFriend(userId)) {
    removeCloseFriend(userId);
    return false;
  } else {
    addCloseFriend(userId);
    return true;
  }
}
