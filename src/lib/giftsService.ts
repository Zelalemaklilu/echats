import { walletService } from "@/lib/walletService";

export interface Gift {
  id: string;
  emoji: string;
  name: string;
  stars: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  animated?: boolean;
}

export interface SentGift {
  id: string;
  giftId: string;
  senderId: string;
  receiverId: string;
  chatId: string;
  message?: string;
  sentAt: string;
  converted: boolean;
  stars?: number;
}

export interface StarsPurchasePackage {
  id: string;
  name: string;
  stars: number;
  bonus: number;
  price: number;
  popular?: boolean;
  badge?: string;
}

export interface StarsPurchase {
  id: string;
  stars: number;
  bonusStars: number;
  price: number;
  purchasedAt: string;
}

export const BUY_STARS_PACKAGES: StarsPurchasePackage[] = [
  { id: "starter", name: "Starter Pack", stars: 100,   bonus: 0, price: 120 },
  { id: "pro",     name: "Pro Pack",     stars: 500,   bonus: 0, price: 550,  popular: true },
  { id: "whale",   name: "Whale Pack",   stars: 2500,  bonus: 0, price: 2400 },
  { id: "legend",  name: "Legend Pack",  stars: 10000, bonus: 0, price: 8900 },
];

export const AVAILABLE_GIFTS: Gift[] = [
  { id: "rose",      emoji: "🌹", name: "Red Rose",       stars: 10,   rarity: "common" },
  { id: "butterfly", emoji: "🦋", name: "Butterfly",      stars: 15,   rarity: "common" },
  { id: "cherry",    emoji: "🍒", name: "Lucky Cherries", stars: 5,    rarity: "common" },
  { id: "fire",      emoji: "🔥", name: "Fire Spirit",    stars: 30,   rarity: "common" },
  { id: "star",      emoji: "⭐", name: "Shooting Star",  stars: 25,   rarity: "common" },
  { id: "cake",      emoji: "🎂", name: "Birthday Cake",  stars: 25,   rarity: "common" },
  { id: "moon",      emoji: "🌙", name: "Silver Moon",    stars: 45,   rarity: "rare" },
  { id: "heart",     emoji: "💖", name: "Diamond Heart",  stars: 50,   rarity: "rare" },
  { id: "rocket",    emoji: "🚀", name: "Space Rocket",   stars: 75,   rarity: "rare" },
  { id: "lightning", emoji: "⚡", name: "Thunder",        stars: 80,   rarity: "rare" },
  { id: "trophy",    emoji: "🏆", name: "Golden Trophy",  stars: 100,  rarity: "rare" },
  { id: "rainbow",   emoji: "🌈", name: "Rainbow",        stars: 150,  rarity: "epic" },
  { id: "gem",       emoji: "💎", name: "Precious Gem",   stars: 200,  rarity: "epic" },
  { id: "unicorn",   emoji: "🦄", name: "Magic Unicorn",  stars: 250,  rarity: "epic" },
  { id: "crystal",   emoji: "🔮", name: "Crystal Ball",   stars: 300,  rarity: "legendary" },
  { id: "dragon",    emoji: "🐉", name: "Lucky Dragon",   stars: 500,  rarity: "epic" },
  { id: "planet",    emoji: "🪐", name: "Mystery Planet", stars: 750,  rarity: "legendary" },
  { id: "crown",     emoji: "👑", name: "Royal Crown",    stars: 1000, rarity: "legendary" },
];

const GIFTS_KEY     = "echat_sent_gifts";
const STARS_KEY     = "echat_stars_balance";
const PURCHASES_KEY = "echat_stars_purchases";

function loadSentGifts(): SentGift[] {
  try { return JSON.parse(localStorage.getItem(GIFTS_KEY) || "[]"); } catch { return []; }
}

function saveSentGifts(gifts: SentGift[]): void {
  localStorage.setItem(GIFTS_KEY, JSON.stringify(gifts));
}

export function getStarsBalance(): number {
  return parseInt(localStorage.getItem(STARS_KEY) || "100", 10);
}

export function addStars(amount: number): void {
  localStorage.setItem(STARS_KEY, String(getStarsBalance() + amount));
}

export function deductStars(amount: number): boolean {
  const balance = getStarsBalance();
  if (balance < amount) return false;
  localStorage.setItem(STARS_KEY, String(balance - amount));
  return true;
}

export function getStarsPurchaseHistory(): StarsPurchase[] {
  try { return JSON.parse(localStorage.getItem(PURCHASES_KEY) || "[]"); } catch { return []; }
}

function savePurchase(purchase: StarsPurchase): void {
  const history = getStarsPurchaseHistory();
  history.unshift(purchase);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(history.slice(0, 50)));
}

export function buyStarsWithWallet(stars: number, bonus: number, price: number): boolean {
  const balance = walletService.getCachedBalance();
  if (balance < price) return false;
  walletService.deductLocalBalance(price);
  const total = stars + bonus;
  addStars(total);
  savePurchase({
    id: Date.now().toString(),
    stars,
    bonusStars: bonus,
    price,
    purchasedAt: new Date().toISOString(),
  });
  return true;
}

export function sendGift(
  giftId: string,
  senderId: string,
  receiverId: string,
  chatId: string,
  message?: string,
): SentGift | null {
  const gift = AVAILABLE_GIFTS.find(g => g.id === giftId);
  if (!gift) return null;
  if (!deductStars(gift.stars)) return null;

  const sentGift: SentGift = {
    id: Date.now().toString(),
    giftId,
    senderId,
    receiverId,
    chatId,
    message,
    sentAt: new Date().toISOString(),
    converted: false,
  };
  const gifts = loadSentGifts();
  gifts.push(sentGift);
  saveSentGifts(gifts);
  return sentGift;
}

export function convertGiftToStars(giftInstanceId: string): number {
  const gifts = loadSentGifts();
  const gift = gifts.find(g => g.id === giftInstanceId);
  if (!gift || gift.converted) return 0;

  const giftDef = AVAILABLE_GIFTS.find(g => g.id === gift.giftId);
  if (!giftDef) return 0;

  const starsBack = Math.floor(giftDef.stars * 0.5);
  gift.converted = true;
  gift.stars = starsBack;
  saveSentGifts(gifts);
  addStars(starsBack);
  return starsBack;
}

export function getReceivedGifts(userId: string): SentGift[] {
  return loadSentGifts().filter(g => g.receiverId === userId);
}

export function getSentGifts(userId: string): SentGift[] {
  return loadSentGifts().filter(g => g.senderId === userId);
}

export function getGiftById(giftId: string): Gift | undefined {
  return AVAILABLE_GIFTS.find(g => g.id === giftId);
}

export const RARITY_COLORS: Record<string, string> = {
  common:    "text-slate-400",
  rare:      "text-blue-400",
  epic:      "text-purple-400",
  legendary: "text-yellow-400",
};

export const RARITY_GLOW: Record<string, string> = {
  common:    "",
  rare:      "shadow-blue-500/20",
  epic:      "shadow-purple-500/30",
  legendary: "shadow-yellow-500/40",
};

export const RARITY_BORDER: Record<string, string> = {
  common:    "border-border/60",
  rare:      "border-blue-500/30",
  epic:      "border-purple-500/40",
  legendary: "border-yellow-500/50",
};

export const RARITY_BG: Record<string, string> = {
  common:    "bg-muted/50",
  rare:      "bg-blue-500/8",
  epic:      "bg-purple-500/8",
  legendary: "bg-yellow-500/10",
};

export const RARITY_LABEL: Record<string, string> = {
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
};
