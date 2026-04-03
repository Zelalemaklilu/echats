// @ts-nocheck
const KEY = "echat_savings_goals";

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  currency: string;
  createdAt: string;
}

function load(): SavingsGoal[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(d: SavingsGoal[]) { localStorage.setItem(KEY, JSON.stringify(d)); }

export function getGoals(): SavingsGoal[] { return load(); }

export function createGoal(name: string, emoji: string, targetAmount: number, deadline?: string): SavingsGoal {
  const g: SavingsGoal = { id: `goal_${Date.now()}`, name, emoji, targetAmount, currentAmount: 0, deadline, currency: "ETB", createdAt: new Date().toISOString() };
  save([...load(), g]);
  return g;
}

export function addFundsToGoal(id: string, amount: number): SavingsGoal | null {
  const all = load();
  const g = all.find(x => x.id === id);
  if (!g) return null;
  g.currentAmount = Math.min(g.currentAmount + amount, g.targetAmount);
  save(all);
  return g;
}

export function deleteGoal(id: string): void { save(load().filter(g => g.id !== id)); }
