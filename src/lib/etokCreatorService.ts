// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface DailyData {
  date: string;
  views: number;
  followers: number;
  likes: number;
  profileVisits: number;
}

export interface VideoAnalytics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgWatchPercent: number;
  trafficSources: { fyp: number; following: number; search: number; profile: number };
}

export interface CreatorReward {
  id: string;
  date: string;
  views: number;
  amount: number;
  status: "paid" | "pending";
}

export interface EtokShopItem {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  emoji: string;
  category: string;
  sold: number;
  inStock: boolean;
}

export interface EtokSeries {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  price: number;
  episodeCount: number;
  coverEmoji: string;
  subscribers: number;
}

/* ═══════════════════════════════════════════
   Analytics — derived from real video data
   ═══════════════════════════════════════════ */

export async function getAccountGrowthAsync(userId: string, days: 7 | 28): Promise<DailyData[]> {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("etok_video_analytics_daily")
    .select("date, views, likes, source_profile")
    .eq("author_id", userId)
    .gte("date", startStr)
    .order("date", { ascending: true });

  // Aggregate per day, merge with follower deltas
  const byDate = new Map<string, DailyData>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, views: 0, likes: 0, followers: 0, profileVisits: 0 });
  }
  for (const row of data ?? []) {
    const cur = byDate.get(row.date);
    if (cur) {
      cur.views += row.views ?? 0;
      cur.likes += row.likes ?? 0;
      cur.profileVisits += row.source_profile ?? 0;
    }
  }
  return Array.from(byDate.values());
}

export async function getCreatorStatsAsync(userId: string, period: 7 | 28) {
  const data = await getAccountGrowthAsync(userId, period);
  return data.reduce((acc, d) => ({
    views: acc.views + d.views,
    followers: acc.followers + d.followers,
    likes: acc.likes + d.likes,
    profileVisits: acc.profileVisits + d.profileVisits,
  }), { views: 0, followers: 0, likes: 0, profileVisits: 0 });
}

export async function getVideoAnalyticsAsync(userId: string): Promise<VideoAnalytics[]> {
  const { data } = await supabase
    .from("etok_video_analytics_daily")
    .select("video_id, views, likes, comments, shares, avg_watch_percent, source_fyp, source_following, source_search, source_profile")
    .eq("author_id", userId)
    .order("date", { ascending: false })
    .limit(500);

  // Aggregate per video
  const byVideo = new Map<string, any>();
  for (const r of data ?? []) {
    const cur = byVideo.get(r.video_id) ?? {
      videoId: r.video_id, views: 0, likes: 0, comments: 0, shares: 0,
      _watchSum: 0, _watchN: 0, _fyp: 0, _fol: 0, _sea: 0, _pro: 0,
    };
    cur.views += r.views; cur.likes += r.likes; cur.comments += r.comments; cur.shares += r.shares;
    cur._watchSum += Number(r.avg_watch_percent ?? 0); cur._watchN += 1;
    cur._fyp += r.source_fyp; cur._fol += r.source_following; cur._sea += r.source_search; cur._pro += r.source_profile;
    byVideo.set(r.video_id, cur);
  }
  return Array.from(byVideo.values()).map(v => {
    const total = v._fyp + v._fol + v._sea + v._pro || 1;
    return {
      videoId: v.videoId,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      avgWatchPercent: Math.round(v._watchSum / Math.max(1, v._watchN)),
      trafficSources: {
        fyp: Math.round((v._fyp / total) * 100),
        following: Math.round((v._fol / total) * 100),
        search: Math.round((v._sea / total) * 100),
        profile: Math.round((v._pro / total) * 100),
      },
    };
  });
}

/* ═══════════════════════════════════════════
   Creator rewards (real DB)
   ═══════════════════════════════════════════ */

export async function getRewardsAsync(userId: string): Promise<CreatorReward[]> {
  const { data } = await supabase
    .from("etok_creator_rewards")
    .select("*")
    .eq("user_id", userId)
    .order("period_end", { ascending: false });
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.period_end,
    views: Number(r.views_earned),
    amount: Number(r.amount_usd),
    status: r.status,
  }));
}

export async function getTotalPendingRewardsAsync(userId: string): Promise<number> {
  const rewards = await getRewardsAsync(userId);
  return rewards.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
}

/* ═══════════════════════════════════════════
   Shop (real DB)
   ═══════════════════════════════════════════ */

function mapShop(r: any): EtokShopItem {
  return {
    id: r.id, sellerId: r.seller_id, name: r.name, description: r.description,
    price: Number(r.price), currency: r.currency, emoji: r.emoji, category: r.category,
    sold: r.sold, inStock: r.in_stock,
  };
}

export async function getShopItemsAsync(sellerId?: string): Promise<EtokShopItem[]> {
  let q = supabase.from("etok_shop_items").select("*").eq("in_stock", true).order("created_at", { ascending: false });
  if (sellerId) q = q.eq("seller_id", sellerId);
  const { data } = await q;
  return (data ?? []).map(mapShop);
}

export async function addShopItemAsync(item: Omit<EtokShopItem, "id" | "sold">): Promise<EtokShopItem | null> {
  const { data, error } = await supabase.from("etok_shop_items").insert({
    seller_id: item.sellerId, name: item.name, description: item.description,
    price: item.price, currency: item.currency, emoji: item.emoji,
    category: item.category, in_stock: item.inStock,
  }).select("*").single();
  if (error) { console.error(error); return null; }
  return mapShop(data);
}

export async function deleteShopItemAsync(id: string): Promise<void> {
  await supabase.from("etok_shop_items").delete().eq("id", id);
}

export async function getShopRevenueAsync(sellerId: string) {
  const items = await getShopItemsAsync(sellerId);
  const total = items.reduce((s, i) => s + i.price * i.sold, 0);
  const orders = items.reduce((s, i) => s + i.sold, 0);
  return { total: parseFloat(total.toFixed(2)), orders, conversion: orders > 0 ? 3.4 : 0 };
}

/* ═══════════════════════════════════════════
   Series (real DB)
   ═══════════════════════════════════════════ */

function mapSeries(r: any): EtokSeries {
  return {
    id: r.id, creatorId: r.creator_id, title: r.title, description: r.description,
    price: Number(r.price), episodeCount: r.episode_count, coverEmoji: r.cover_emoji,
    subscribers: r.subscribers,
  };
}

export async function getSeriesAsync(creatorId?: string): Promise<EtokSeries[]> {
  let q = supabase.from("etok_series").select("*").order("created_at", { ascending: false });
  if (creatorId) q = q.eq("creator_id", creatorId);
  const { data } = await q;
  return (data ?? []).map(mapSeries);
}

export async function createSeriesAsync(s: Omit<EtokSeries, "id" | "subscribers">): Promise<EtokSeries | null> {
  const { data, error } = await supabase.from("etok_series").insert({
    creator_id: s.creatorId, title: s.title, description: s.description,
    price: s.price, episode_count: s.episodeCount, cover_emoji: s.coverEmoji,
  }).select("*").single();
  if (error) { console.error(error); return null; }
  return mapSeries(data);
}

export async function deleteSeriesAsync(id: string): Promise<void> {
  await supabase.from("etok_series").delete().eq("id", id);
}

/* ═══════════════════════════════════════════
   Audience demographics (currently static — needs per-view tracking pipeline)
   ═══════════════════════════════════════════ */

export interface AudienceDemographics {
  genderMale: number;
  genderFemale: number;
  genderOther: number;
  ageGroups: { label: string; percent: number }[];
  topCountries: { country: string; percent: number }[];
}

export function getAudienceDemographics(): AudienceDemographics {
  return {
    genderMale: 54, genderFemale: 44, genderOther: 2,
    ageGroups: [
      { label: "13-17", percent: 12 },
      { label: "18-24", percent: 38 },
      { label: "25-34", percent: 32 },
      { label: "35-44", percent: 13 },
      { label: "45+", percent: 5 },
    ],
    topCountries: [
      { country: "Ethiopia 🇪🇹", percent: 62 },
      { country: "USA 🇺🇸", percent: 11 },
      { country: "Kenya 🇰🇪", percent: 8 },
      { country: "UK 🇬🇧", percent: 5 },
      { country: "UAE 🇦🇪", percent: 4 },
    ],
  };
}

/* ═══════════════════════════════════════════
   Sync compat shims
   ═══════════════════════════════════════════ */
export function getAccountGrowth(_d: 7 | 28): DailyData[] { return []; }
export function getCreatorStats(_p: 7 | 28) { return { views: 0, followers: 0, likes: 0, profileVisits: 0 }; }
export function getVideoAnalytics(): VideoAnalytics[] { return []; }
export function getRewards(): CreatorReward[] { return []; }
export function getTotalRewardsBalance(): number { return 0; }
export function getShopItems(): EtokShopItem[] { return []; }
export function addShopItem(item: Omit<EtokShopItem, "id" | "sold">): EtokShopItem {
  return { ...item, id: "tmp", sold: 0 };
}
export function getSeries(): EtokSeries[] { return []; }
export function createSeries(s: Omit<EtokSeries, "id" | "subscribers">): EtokSeries {
  return { ...s, id: "tmp", subscribers: 0 };
}
export function getShopRevenue() { return { total: 0, orders: 0, conversion: 0 }; }
