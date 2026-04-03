// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Image, Mic, Clock, Calendar, BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, type ChatStats as StatsType } from "@/lib/chatStatsService";
import { chatStore } from "@/lib/chatStore";
import { motion } from "framer-motion";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="bg-card rounded-2xl border border-border/50 px-4 py-3.5 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[18px] font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const HOURS = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];

const ChatStats = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const currentUserId = chatStore.getCurrentUserId();
  const [stats, setStats] = useState<StatsType | null>(null);
  const [hourlyData, setHourlyData] = useState<number[]>(new Array(24).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;
    supabase.from("messages").select("content, message_type, created_at, sender_id").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => {
        if (data) {
          setStats(computeStats(data, currentUserId || ""));
          const counts = new Array(24).fill(0);
          data.forEach(m => { if (m.created_at) counts[new Date(m.created_at).getHours()]++; });
          setHourlyData(counts);
        }
      }).finally(() => setLoading(false));
  }, [chatId, currentUserId]);

  const maxHour = Math.max(...hourlyData, 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 py-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-[17px]">Chat Stats</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : stats ? (
        <div className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={MessageSquare} label="Total Messages" value={stats.totalMessages} color="bg-primary/10 text-primary" />
            <StatCard icon={TrendingUp} label="Your Messages" value={stats.yourMessages} color="bg-blue-500/10 text-blue-400" />
            <StatCard icon={Image} label="Media Sent" value={stats.mediaCount} color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={Mic} label="Voice Notes" value={stats.voiceCount} color="bg-orange-500/10 text-orange-400" />
            <StatCard icon={Clock} label="Avg Words/Msg" value={stats.avgWordsPerMessage} color="bg-emerald-500/10 text-emerald-400" />
            {stats.firstMessageDate && (
              <StatCard icon={Calendar} label="First Message" value={new Date(stats.firstMessageDate).toLocaleDateString()} color="bg-pink-500/10 text-pink-400" />
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border/50 px-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="font-semibold text-[14px]">Activity by Hour</p>
            </div>
            <div className="flex items-end gap-0.5 h-24">
              {hourlyData.map((count, h) => (
                <motion.div
                  key={h}
                  initial={{ height: 0 }}
                  animate={{ height: `${(count / maxHour) * 100}%` }}
                  transition={{ delay: h * 0.02, duration: 0.4 }}
                  className={`flex-1 rounded-t-sm transition-colors ${h === stats.mostActiveHour ? "bg-primary" : "bg-muted"}`}
                  title={`${HOURS[h]}: ${count} messages`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">12am</span>
              <span className="text-[10px] text-primary font-medium">Peak: {HOURS[stats.mostActiveHour]}</span>
              <span className="text-[9px] text-muted-foreground">11pm</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 px-4 py-3.5">
            <p className="text-[12px] text-muted-foreground mb-3">Message Split</p>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-primary transition-all" style={{ width: `${stats.totalMessages ? (stats.yourMessages / stats.totalMessages) * 100 : 50}%` }} />
              <div className="bg-muted flex-1" />
            </div>
            <div className="flex justify-between mt-2 text-[11px]">
              <span className="text-primary font-medium">You {stats.totalMessages ? Math.round((stats.yourMessages / stats.totalMessages) * 100) : 0}%</span>
              <span className="text-muted-foreground">Them {stats.totalMessages ? Math.round((stats.theirMessages / stats.totalMessages) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-20 text-muted-foreground text-sm">No data available</div>
      )}
    </div>
  );
};

export default ChatStats;
