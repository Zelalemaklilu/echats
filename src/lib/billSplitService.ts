// @ts-nocheck
const STORAGE_KEY = "echat_bill_splits";

export interface BillSplitMember {
  userId: string;
  name: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export interface BillSplit {
  id: string;
  creatorId: string;
  groupId: string;
  title: string;
  totalAmount: number;
  currency: string;
  splits: BillSplitMember[];
  createdAt: string;
}

function load(): BillSplit[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(splits: BillSplit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(splits));
}

export function createBillSplit(
  creatorId: string,
  groupId: string,
  title: string,
  totalAmount: number,
  members: { userId: string; name: string }[]
): BillSplit {
  const perPerson = totalAmount / members.length;
  const split: BillSplit = {
    id: `bs_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    creatorId,
    groupId,
    title,
    totalAmount,
    currency: "ETB",
    splits: members.map(m => ({
      userId: m.userId,
      name: m.name,
      amount: Math.round(perPerson * 100) / 100,
      paid: false,
    })),
    createdAt: new Date().toISOString(),
  };
  const all = load();
  all.unshift(split);
  save(all);
  return split;
}

export function getBillSplit(id: string): BillSplit | null {
  return load().find(s => s.id === id) || null;
}

export function getBillSplits(groupId: string): BillSplit[] {
  return load().filter(s => s.groupId === groupId);
}

export function markMemberPaid(splitId: string, userId: string): void {
  const all = load();
  const split = all.find(s => s.id === splitId);
  if (!split) return;
  const member = split.splits.find(m => m.userId === userId);
  if (member) {
    member.paid = true;
    member.paidAt = new Date().toISOString();
  }
  save(all);
}
