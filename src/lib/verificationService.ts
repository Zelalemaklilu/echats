export type VerificationBadge = "official" | "press" | "business" | "government" | "premium";

export interface VerifiedAccount {
  userId: string;
  badge: VerificationBadge;
  verifiedBy: string;
  verifiedAt: string;
  description?: string;
}

const STORAGE_KEY = "echat_verifications";

const BADGE_CONFIG: Record<VerificationBadge, { label: string; color: string; icon: string }> = {
  official: { label: "Official", color: "text-blue-500", icon: "✓" },
  press: { label: "Press", color: "text-green-500", icon: "📰" },
  business: { label: "Business", color: "text-purple-500", icon: "💼" },
  government: { label: "Government", color: "text-red-500", icon: "🏛️" },
  premium: { label: "Premium", color: "text-yellow-500", icon: "⭐" },
};

export function getBadgeConfig(badge: VerificationBadge) {
  return BADGE_CONFIG[badge];
}

function load(): VerifiedAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getVerification(userId: string): VerifiedAccount | null {
  return load().find(v => v.userId === userId) || null;
}

export function addVerification(
  userId: string,
  badge: VerificationBadge,
  verifiedBy: string,
  description?: string,
): void {
  const all = load().filter(v => v.userId !== userId);
  save([...all, { userId, badge, verifiedBy, verifiedAt: new Date().toISOString(), description }]);
}

export function removeVerification(userId: string): void {
  save(load().filter(v => v.userId !== userId));
}

function save(data: VerifiedAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isPremiumUser(userId: string): boolean {
  const v = getVerification(userId);
  return v?.badge === "premium";
}

export function setPremiumStatus(userId: string, isPremium: boolean): void {
  if (isPremium) {
    addVerification(userId, "premium", "system");
  } else {
    const v = getVerification(userId);
    if (v?.badge === "premium") removeVerification(userId);
  }
}
