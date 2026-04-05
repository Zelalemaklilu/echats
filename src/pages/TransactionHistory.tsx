// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet, User, ShoppingCart, Search, Loader2, Home, BarChart2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { walletService, type WalletTransaction } from "@/lib/walletService";
import { toast } from "sonner";

/* ─── tokens ─── */
const BG   = "#0D0A1A";
const CARD = "#16102A";
const P    = "#7C3AED";

/* ─── type filter tabs ─── */
const TABS = [
  { key: "all",      label: "All"      },
  { key: "received", label: "Received" },
  { key: "sent",     label: "Sent"     },
  { key: "topup",    label: "Top-up"   },
];

function mapType(t: string): string {
  if (t === "transfer_in") return "received";
  if (t === "transfer_out") return "sent";
  if (t === "deposit") return "topup";
  return "other";
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d))     return "TODAY";
  if (isYesterday(d)) return "YESTERDAY";
  return format(d, "MMMM d").toUpperCase();
}

function groupByDate(txns: WalletTransaction[]): { label: string; txns: WalletTransaction[] }[] {
  const map = new Map<string, WalletTransaction[]>();
  for (const t of txns) {
    const key = format(new Date(t.created_at), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, txns]) => ({
    label: dateLabel(txns[0].created_at),
    txns,
  }));
}

/* ─── per-transaction config ─── */
function txnConfig(type: string) {
  switch (type) {
    case "transfer_in":  return { isIn: true,  iconBg: "rgba(16,185,129,0.2)",  iconColor: "#10b981", Icon: ArrowDownLeft };
    case "transfer_out": return { isIn: false, iconBg: "rgba(239,68,68,0.2)",   iconColor: "#ef4444", Icon: ArrowUpRight  };
    case "deposit":      return { isIn: true,  iconBg: "rgba(124,58,237,0.25)", iconColor: "#a78bfa", Icon: Wallet        };
    case "withdrawal":   return { isIn: false, iconBg: "rgba(251,146,60,0.2)",  iconColor: "#fb923c", Icon: ArrowUpRight  };
    default:             return { isIn: false, iconBg: "rgba(148,163,184,0.15)",iconColor: "#94a3b8", Icon: User          };
  }
}

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  completed: { bg: "rgba(16,185,129,0.18)",  color: "#10b981", label: "COMPLETED" },
  pending:   { bg: "rgba(245,158,11,0.18)",  color: "#f59e0b", label: "PENDING"   },
  failed:    { bg: "rgba(239,68,68,0.18)",   color: "#ef4444", label: "FAILED"    },
  reversed:  { bg: "rgba(251,146,60,0.18)",  color: "#fb923c", label: "REVERSED"  },
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [all,       setAll]       = useState<WalletTransaction[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [tab,       setTab]       = useState("all");
  const [search,    setSearch]    = useState("");

  const load = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      const d = await walletService.getWalletBalance(force);
      setAll(d.transactions || []);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = all.filter(t => {
    if (tab !== "all" && mapType(t.type) !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(t.description || "").toLowerCase().includes(q) && !t.amount.toString().includes(q)) return false;
    }
    return true;
  });

  const groups = groupByDate(filtered);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: P }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: BG }}>

      {/* ── HEADER ── */}
      <div className="flex items-center px-4 pt-12 pb-5">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/wallet")}
          className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft style={{ color: "rgba(255,255,255,0.85)", width: 22, height: 22 }} />
        </motion.button>
        <h1 className="flex-1 text-center font-bold text-[18px] text-white">Transaction History</h1>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => load(true)}
          className="w-9 h-9 flex items-center justify-center">
          <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.5, repeat: refreshing ? Infinity : 0, ease: "linear" }}>
            <RefreshCw style={{ color: "rgba(255,255,255,0.45)", width: 18, height: 18 }} />
          </motion.div>
        </motion.button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-full"
          style={{ background: CARD, border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search style={{ color: "rgba(255,255,255,0.35)", width: 17, height: 17, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by recipient or note"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: "rgba(255,255,255,0.75)" }}
            data-testid="input-txn-search"
          />
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="flex items-center gap-2 px-4 pb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <motion.button key={t.key} whileTap={{ scale: 0.92 }}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? P : CARD,
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                border: `1px solid ${active ? P : "rgba(255,255,255,0.08)"}`,
                boxShadow: active ? "0 3px 10px rgba(124,58,237,0.4)" : "none",
              }}
              data-testid={`filter-${t.key}`}>
              {t.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── TRANSACTION GROUPS ── */}
      <div className="flex-1 px-4 space-y-5">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <Search style={{ color: P, width: 28, height: 28 }} />
            </div>
            <p className="font-semibold text-[15px] text-white">No transactions found</p>
            <p className="text-[13px] text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              {search || tab !== "all" ? "Try adjusting your filters" : "Your transaction history is empty"}
            </p>
            {(search || tab !== "all") && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setTab("all"); setSearch(""); }}
                className="px-5 py-2.5 rounded-full text-[13px] font-bold text-white"
                style={{ background: P }}>
                Clear Filters
              </motion.button>
            )}
          </div>
        ) : (
          groups.map(({ label, txns }) => (
            <div key={label}>
              {/* Date label */}
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3 px-1"
                style={{ color: "rgba(255,255,255,0.35)" }}>
                {label}
              </p>

              {/* Individual transaction cards */}
              <div className="space-y-2.5">
                {txns.map((t, i) => {
                  const cfg    = txnConfig(t.type);
                  const status = STATUS_CFG[t.status] ?? STATUS_CFG.completed;
                  const time   = format(new Date(t.created_at), "h:mm a");
                  const note   = t.description || (t.type === "deposit" ? "Bank Transfer" : t.type.replace("_", " "));

                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/transaction-detail/${t.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
                      style={{ background: CARD, border: "1px solid rgba(255,255,255,0.07)" }}
                      data-testid={`txn-${t.id}`}>

                      {/* Icon circle */}
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.iconBg }}>
                        <cfg.Icon style={{ color: cfg.iconColor, width: 20, height: 20 }} />
                      </div>

                      {/* Name + time · note */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-white truncate">
                          {t.description || (t.type === "deposit" ? "Wallet Top-up" :
                           t.type === "transfer_out" ? "Sent" :
                           t.type === "transfer_in" ? "Received" : note)}
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                          {time} • {note}
                        </p>
                      </div>

                      {/* Amount + status badge */}
                      <div className="text-right flex-shrink-0 ml-1">
                        <p className="font-bold text-[15px]"
                          style={{ color: cfg.isIn ? "#10b981" : "#ef4444" }}>
                          {cfg.isIn ? "+" : "-"}{t.amount.toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                        </p>
                        <div className="flex justify-end mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
        style={{ background: BG, borderTop: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 -8px 32px rgba(0,0,0,0.45)" }}>
        <div className="flex items-center justify-around px-2" style={{ height: 68 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/wallet")}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
            <Home style={{ color: "rgba(255,255,255,0.38)", width: 22, height: 22 }} />
            <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.38)" }}>Home</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/wallet")}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
            <Wallet style={{ color: P, width: 22, height: 22 }} />
            <span className="text-[10px] font-bold" style={{ color: P }}>Wallet</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
            <BarChart2 style={{ color: "rgba(255,255,255,0.38)", width: 22, height: 22 }} />
            <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.38)" }}>Insights</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/profile")}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
            <User style={{ color: "rgba(255,255,255,0.38)", width: 22, height: 22 }} />
            <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.38)" }}>Profile</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
