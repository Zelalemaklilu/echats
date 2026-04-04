export interface GroupBoost {
  id: string;
  groupId: string;
  userId: string;
  boostedAt: string;
  expiresAt: string;
}

export interface GroupBoostLevel {
  level: number;
  name: string;
  boostsRequired: number;
  perks: string[];
  color: string;
}

export const BOOST_LEVELS: GroupBoostLevel[] = [
  {
    level: 0,
    name: "Base",
    boostsRequired: 0,
    perks: ["Basic group features"],
    color: "gray",
  },
  {
    level: 1,
    name: "Bronze",
    boostsRequired: 5,
    perks: ["Custom emoji status", "Background colors"],
    color: "orange",
  },
  {
    level: 2,
    name: "Silver",
    boostsRequired: 10,
    perks: ["Custom wallpapers", "Story posting", "Profile cover colors"],
    color: "blue",
  },
  {
    level: 3,
    name: "Gold",
    boostsRequired: 20,
    perks: ["Audio transcription", "Emoji pack", "Unlimited pinned messages"],
    color: "yellow",
  },
  {
    level: 4,
    name: "Platinum",
    boostsRequired: 35,
    perks: ["No ads for members", "Custom links", "Priority support"],
    color: "purple",
  },
  {
    level: 5,
    name: "Diamond",
    boostsRequired: 50,
    perks: ["Full customization", "Advanced analytics", "Exclusive badge"],
    color: "cyan",
  },
];

const BOOSTS_KEY = "echat_group_boosts";

function load(): GroupBoost[] {
  try {
    return JSON.parse(localStorage.getItem(BOOSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(boosts: GroupBoost[]): void {
  localStorage.setItem(BOOSTS_KEY, JSON.stringify(boosts));
}

function cleanExpired(): GroupBoost[] {
  const now = new Date();
  const valid = load().filter(b => new Date(b.expiresAt) > now);
  save(valid);
  return valid;
}

export function getGroupBoosts(groupId: string): GroupBoost[] {
  return cleanExpired().filter(b => b.groupId === groupId);
}

export function getBoostCount(groupId: string): number {
  return getGroupBoosts(groupId).length;
}

export function getGroupLevel(groupId: string): GroupBoostLevel {
  const count = getBoostCount(groupId);
  const levels = [...BOOST_LEVELS].reverse();
  return levels.find(l => count >= l.boostsRequired) || BOOST_LEVELS[0];
}

export function hasUserBoosted(groupId: string, userId: string): boolean {
  const now = new Date();
  return cleanExpired().some(
    b => b.groupId === groupId && b.userId === userId && new Date(b.expiresAt) > now
  );
}

export function boostGroup(groupId: string, userId: string): GroupBoost | null {
  if (hasUserBoosted(groupId, userId)) return null;

  const boost: GroupBoost = {
    id: Date.now().toString(),
    groupId,
    userId,
    boostedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const boosts = load();
  boosts.push(boost);
  save(boosts);
  return boost;
}

export function removeBoost(groupId: string, userId: string): void {
  save(load().filter(b => !(b.groupId === groupId && b.userId === userId)));
}
