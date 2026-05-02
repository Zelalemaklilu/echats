// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Film, DollarSign, Plus, X, Trash2, TrendingUp, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getShopItemsAsync, addShopItemAsync, deleteShopItemAsync, getShopRevenueAsync,
  getSeriesAsync, createSeriesAsync, deleteSeriesAsync,
  getRewardsAsync, getTotalPendingRewardsAsync,
  type EtokShopItem, type EtokSeries, type CreatorReward,
} from "@/lib/etokCreatorService";
import { EtokBottomNav } from "@/components/etok/EtokBottomNav";

type Tab = "shop" | "series" | "rewards";

const EMOJI_PICKER_SHOP = ["📦", "👕", "👗", "👟", "🎧", "💄", "📱", "💍", "🎒", "☕", "🍫", "🌹"];
const EMOJI_PICKER_SERIES = ["🎬", "📺", "🎭", "🎤", "🍿", "🎮", "🎨", "📚", "🏋️", "🍳", "✈️", "🎵"];

const EtokCreatorTools = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [tab, setTab] = useState<Tab>("shop");
  const [loading, setLoading] = useState(true);

  // Shop
  const [shopItems, setShopItems] = useState<EtokShopItem[]>([]);
  const [shopRevenue, setShopRevenue] = useState({ total: 0, orders: 0, conversion: 0 });
  const [showAddShop, setShowAddShop] = useState(false);
  const [newShop, setNewShop] = useState({ name: "", description: "", price: "", emoji: "📦", category: "Other" });

  // Series
  const [series, setSeries] = useState<EtokSeries[]>([]);
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [newSeries, setNewSeries] = useState({ title: "", description: "", price: "", episodeCount: "1", coverEmoji: "🎬" });

  // Rewards
  const [rewards, setRewards] = useState<CreatorReward[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);

  const loadAll = async () => {
    if (!userId) return;
    setLoading(true);
    const [items, rev, ser, rew, pending] = await Promise.all([
      getShopItemsAsync(userId),
      getShopRevenueAsync(userId),
      getSeriesAsync(userId),
      getRewardsAsync(userId),
      getTotalPendingRewardsAsync(userId),
    ]);
    setShopItems(items); setShopRevenue(rev);
    setSeries(ser);
    setRewards(rew); setPendingTotal(pending);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [userId]);

  /* ─── Shop handlers ─── */
  const handleAddShop = async () => {
    if (!newShop.name.trim() || !newShop.price) { toast.error("Add name and price"); return; }
    const created = await addShopItemAsync({
      sellerId: userId, name: newShop.name, description: newShop.description,
      price: parseFloat(newShop.price), currency: "USD", emoji: newShop.emoji,
      category: newShop.category, inStock: true,
    } as any);
    if (!created) { toast.error("Failed to add"); return; }
    toast.success("Added to shop! 🛍️");
    setNewShop({ name: "", description: "", price: "", emoji: "📦", category: "Other" });
    setShowAddShop(false);
    loadAll();
  };

  const handleDeleteShop = async (id: string) => {
    await deleteShopItemAsync(id);
    toast.success("Removed");
    loadAll();
  };

  /* ─── Series handlers ─── */
  const handleAddSeries = async () => {
    if (!newSeries.title.trim()) { toast.error("Add a title"); return; }
    const created = await createSeriesAsync({
      creatorId: userId, title: newSeries.title, description: newSeries.description,
      price: parseFloat(newSeries.price || "0"), episodeCount: parseInt(newSeries.episodeCount || "1"),
      coverEmoji: newSeries.coverEmoji,
    } as any);
    if (!created) { toast.error("Failed"); return; }
    toast.success("Series created! 🎬");
    setNewSeries({ title: "", description: "", price: "", episodeCount: "1", coverEmoji: "🎬" });
    setShowAddSeries(false);
    loadAll();
  };

  const handleDeleteSeries = async (id: string) => {
    await deleteSeriesAsync(id);
    toast.success("Series deleted");
    loadAll();
  };

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "shop", label: "Shop", icon: ShoppingBag },
    { id: "series", label: "Series", icon: Film },
    { id: "rewards", label: "Rewards", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black z-20 flex items-center justify-between px-4 pt-12 pb-3 border-b border-white/5">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-6 w-6 text-white" /></button>
        <h1 className="font-bold text-[17px]">Creator Tools</h1>
        <button onClick={() => navigate("/etok/analytics")} title="Analytics">
          <BarChart3 className="h-5 w-5 text-white/70" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold border-b-2 transition-colors",
              tab === t.id ? "border-[#ff0050] text-white" : "border-transparent text-white/50"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-white/40">Loading...</div>
      ) : (
        <div className="px-4 pt-5 space-y-5">
          {/* SHOP */}
          {tab === "shop" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Revenue" value={`$${shopRevenue.total.toFixed(2)}`} color="#22c55e" />
                <StatCard label="Orders" value={shopRevenue.orders.toString()} color="#20d5ec" />
                <StatCard label="Conv. %" value={`${shopRevenue.conversion}%`} color="#ff0050" />
              </div>

              <button
                onClick={() => setShowAddShop(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff0050] to-[#ff4080] py-3 rounded-xl font-bold text-[14px]"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>

              {shopItems.length === 0 ? (
                <EmptyState icon={ShoppingBag} text="No products yet. Add your first one!" />
              ) : (
                <div className="space-y-3">
                  {shopItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/[0.08]">
                      <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] truncate">{item.name}</p>
                        <p className="text-white/50 text-[11px] truncate">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px]">
                          <span className="text-[#22c55e] font-bold">${item.price}</span>
                          <span className="text-white/40">{item.sold} sold</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteShop(item.id)} className="p-2">
                        <Trash2 className="h-4 w-4 text-white/40 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SERIES */}
          {tab === "series" && (
            <>
              <button
                onClick={() => setShowAddSeries(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#20d5ec] py-3 rounded-xl font-bold text-[14px]"
              >
                <Plus className="h-4 w-4" /> Create Series
              </button>

              {series.length === 0 ? (
                <EmptyState icon={Film} text="Build a paid series to earn from subscribers" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {series.map(s => (
                    <div key={s.id} className="bg-white/5 rounded-2xl p-3 border border-white/[0.08] relative">
                      <button onClick={() => handleDeleteSeries(s.id)} className="absolute top-2 right-2 p-1">
                        <Trash2 className="h-3.5 w-3.5 text-white/40 hover:text-red-500" />
                      </button>
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-[#7c3aed]/40 to-[#ff0050]/40 flex items-center justify-center text-5xl mb-2">
                        {s.coverEmoji}
                      </div>
                      <p className="font-semibold text-[13px] truncate">{s.title}</p>
                      <p className="text-white/40 text-[11px] mt-0.5">{s.episodeCount} eps · {s.subscribers} subs</p>
                      <p className="text-[#22c55e] font-bold text-[12px] mt-0.5">${s.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* REWARDS */}
          {tab === "rewards" && (
            <>
              <div className="bg-gradient-to-br from-[#ff0050] to-[#ff4080] rounded-2xl p-5">
                <p className="text-white/80 text-[12px] uppercase tracking-wide font-semibold">Pending payout</p>
                <p className="text-white font-bold text-[34px] leading-tight mt-1">${pendingTotal.toFixed(2)}</p>
                <div className="flex items-center gap-1.5 mt-2 text-white/80 text-[12px]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Paid monthly when balance ≥ $50
                </div>
              </div>

              <p className="text-white font-bold text-[14px] mt-2">History</p>
              {rewards.length === 0 ? (
                <EmptyState icon={DollarSign} text="No rewards yet. Keep posting!" />
              ) : (
                <div className="space-y-2">
                  {rewards.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/[0.08]">
                      <div>
                        <p className="font-semibold text-[13px]">${r.amount.toFixed(2)}</p>
                        <p className="text-white/40 text-[11px]">{new Date(r.date).toLocaleDateString()} · {r.views.toLocaleString()} views</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                        r.status === "paid" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add shop sheet */}
      <AnimatePresence>
        {showAddShop && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end"
            onClick={() => setShowAddShop(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111] w-full rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[18px]">New Product</h2>
                <button onClick={() => setShowAddShop(false)}><X className="h-5 w-5 text-white/50" /></button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {EMOJI_PICKER_SHOP.map(e => (
                  <button key={e} onClick={() => setNewShop({ ...newShop, emoji: e })}
                    className={cn("w-12 h-12 flex-shrink-0 rounded-xl text-2xl flex items-center justify-center transition-all",
                      newShop.emoji === e ? "bg-[#ff0050] scale-110" : "bg-white/10")}>{e}</button>
                ))}
              </div>

              <input value={newShop.name} onChange={e => setNewShop({ ...newShop, name: e.target.value })}
                placeholder="Product name" className="w-full bg-white/10 rounded-xl px-4 py-3 text-[14px] mb-2 outline-none placeholder:text-white/30" />
              <textarea value={newShop.description} onChange={e => setNewShop({ ...newShop, description: e.target.value })}
                placeholder="Description (optional)" rows={2} className="w-full bg-white/10 rounded-xl px-4 py-3 text-[14px] mb-2 outline-none resize-none placeholder:text-white/30" />
              <div className="flex gap-2 mb-4">
                <input value={newShop.price} onChange={e => setNewShop({ ...newShop, price: e.target.value })}
                  placeholder="Price (USD)" type="number" step="0.01" className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-white/30" />
                <input value={newShop.category} onChange={e => setNewShop({ ...newShop, category: e.target.value })}
                  placeholder="Category" className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-white/30" />
              </div>
              <button onClick={handleAddShop} className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff4080] py-3 rounded-xl font-bold">Publish</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add series sheet */}
      <AnimatePresence>
        {showAddSeries && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end"
            onClick={() => setShowAddSeries(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111] w-full rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[18px]">New Series</h2>
                <button onClick={() => setShowAddSeries(false)}><X className="h-5 w-5 text-white/50" /></button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {EMOJI_PICKER_SERIES.map(e => (
                  <button key={e} onClick={() => setNewSeries({ ...newSeries, coverEmoji: e })}
                    className={cn("w-12 h-12 flex-shrink-0 rounded-xl text-2xl flex items-center justify-center transition-all",
                      newSeries.coverEmoji === e ? "bg-[#7c3aed] scale-110" : "bg-white/10")}>{e}</button>
                ))}
              </div>

              <input value={newSeries.title} onChange={e => setNewSeries({ ...newSeries, title: e.target.value })}
                placeholder="Series title" className="w-full bg-white/10 rounded-xl px-4 py-3 text-[14px] mb-2 outline-none placeholder:text-white/30" />
              <textarea value={newSeries.description} onChange={e => setNewSeries({ ...newSeries, description: e.target.value })}
                placeholder="Description" rows={2} className="w-full bg-white/10 rounded-xl px-4 py-3 text-[14px] mb-2 outline-none resize-none placeholder:text-white/30" />
              <div className="flex gap-2 mb-4">
                <input value={newSeries.price} onChange={e => setNewSeries({ ...newSeries, price: e.target.value })}
                  placeholder="Price (USD)" type="number" step="0.01" className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-white/30" />
                <input value={newSeries.episodeCount} onChange={e => setNewSeries({ ...newSeries, episodeCount: e.target.value })}
                  placeholder="Episodes" type="number" className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-white/30" />
              </div>
              <button onClick={handleAddSeries} className="w-full bg-gradient-to-r from-[#7c3aed] to-[#20d5ec] py-3 rounded-xl font-bold">Create</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EtokBottomNav />
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-white/5 rounded-xl p-3 border border-white/[0.08]">
    <p className="font-bold text-[18px]" style={{ color }}>{value}</p>
    <p className="text-white/50 text-[10px] mt-0.5">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-12">
    <Icon className="h-12 w-12 text-white/20 mx-auto mb-3" />
    <p className="text-white/40 text-[13px]">{text}</p>
  </div>
);

export default EtokCreatorTools;
