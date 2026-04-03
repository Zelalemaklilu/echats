import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, Eye, Heart, PlayCircle, Calendar, ChevronDown } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAccountGrowth, getCreatorStats, getAudienceDemographics, getVideoAnalytics, getRewards,
  type DailyData, type AudienceDemographics,
} from "@/lib/etokCreatorService";
import { getUserVideos, formatCount } from "@/lib/etokService";
import { EtokBottomNav } from "@/components/etok/EtokBottomNav";

type Period = "7d" | "28d";
type AnalyticsTab = "overview" | "content" | "audience" | "rewards";

const PIE_COLORS = ["#ff0050", "#20d5ec", "#7c3aed"];

const EtokAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id ?? "demo_user";
  const [period, setPeriod] = useState<Period>("7d");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const days = period === "7d" ? 7 : 28;
  const stats = getCreatorStats(days);
  const growth: DailyData[] = getAccountGrowth(days);
  const demographics: AudienceDemographics = getAudienceDemographics();
  const videoAnalytics = getVideoAnalytics();
  const rewards = getRewards();
  const videos = getUserVideos(currentUserId);

  const genderData = [
    { name: "Male", value: demographics.genderMale },
    { name: "Female", value: demographics.genderFemale },
    { name: "Other", value: demographics.genderOther },
  ];

  const ageData = demographics.ageGroups.map(g => ({ range: g.label, value: g.percent }));

  const periodLabel = period === "7d" ? "Last 7 days" : "Last 28 days";

  const TABS: { id: AnalyticsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "content", label: "Content" },
    { id: "audience", label: "Audience" },
    { id: "rewards", label: "Rewards" },
  ];

  const statCards = [
    { label: "Video Views", value: formatCount(stats.views), icon: Eye, color: "#ff0050", change: "+12%" },
    { label: "Profile Views", value: formatCount(stats.profileVisits), icon: Users, color: "#20d5ec", change: "+8%" },
    { label: "Likes", value: formatCount(stats.likes), icon: Heart, color: "#f97316", change: "+24%" },
    { label: "New Followers", value: formatCount(stats.followers), icon: TrendingUp, color: "#22c55e", change: "+5%" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black z-20 flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-6 w-6 text-white" /></button>
        <h1 className="font-bold text-[17px]">Creator Analytics</h1>
        <div />
      </div>

      {/* Period selector */}
      <div className="px-4 mb-4 relative">
        <button
          onClick={() => setShowPeriodPicker(!showPeriodPicker)}
          className="flex items-center gap-1.5 bg-white/10 rounded-lg px-4 py-2.5 text-white text-[14px] font-semibold"
        >
          <Calendar className="h-4 w-4 text-white/60" />
          {periodLabel}
          <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", showPeriodPicker && "rotate-180")} />
        </button>
        {showPeriodPicker && (
          <div className="absolute top-full left-4 mt-1 bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 z-10">
            {(["7d", "28d"] as Period[]).map(p => (
              <button key={p} onClick={() => { setPeriod(p); setShowPeriodPicker(false); }} className={cn("flex items-center w-full px-5 py-3 text-[14px]", period === p ? "text-[#ff0050] font-bold" : "text-white/80")}>
                {p === "7d" ? "Last 7 days" : "Last 28 days"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-2 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn("flex-shrink-0 px-3 py-2.5 text-[14px] font-semibold border-b-2 transition-colors", activeTab === tab.id ? "border-[#ff0050] text-white" : "border-transparent text-white/50")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-28 space-y-5">
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map(s => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="h-5 w-5" style={{ color: s.color }} />
                    <span className="text-green-400 text-[11px] font-semibold">{s.change}</span>
                  </div>
                  <p className="text-white font-bold text-[22px]">{s.value}</p>
                  <p className="text-white/50 text-[11px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.08]">
              <p className="text-white font-bold text-[15px] mb-4">Video Views</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={growth}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff0050" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ff0050" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatCount(v)} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Area type="monotone" dataKey="views" stroke="#ff0050" fill="url(#viewsGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.08]">
              <p className="text-white font-bold text-[15px] mb-4">Follower Growth</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={growth}>
                  <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Bar dataKey="followers" fill="#20d5ec" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "content" && (
          <>
            <p className="text-white/50 text-[13px]">Your last {videos.length} videos</p>
            <div className="space-y-3">
              {videos.map(v => {
                const va = videoAnalytics.find(a => a.videoId === v.id);
                return (
                  <div key={v.id} className="flex gap-3 bg-white/5 rounded-2xl p-3 border border-white/[0.08]">
                    <div className={cn("w-14 h-[78px] rounded-xl overflow-hidden bg-gradient-to-b flex items-center justify-center text-3xl flex-shrink-0", v.thumbnailColor)}>
                      {v.thumbnailEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-semibold line-clamp-2">{v.description.slice(0, 50)}...</p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { icon: Eye, val: formatCount(va?.views ?? v.views) },
                          { icon: Heart, val: formatCount(va?.likes ?? v.likes) },
                          { icon: PlayCircle, val: `${va?.avgWatchPercent ?? Math.floor(Math.random() * 80 + 20)}%` },
                        ].map((s, j) => (
                          <div key={j} className="flex items-center gap-1">
                            <s.icon className="h-3 w-3 text-white/40" />
                            <span className="text-white/70 text-[11px] font-semibold">{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "audience" && (
          <>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.08]">
              <p className="text-white font-bold text-[15px] mb-4">Gender Breakdown</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                      {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {genderData.map((g, i) => (
                    <div key={g.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-white/70 text-[13px]">{g.name}</span>
                      <span className="text-white font-bold text-[13px] ml-auto">{g.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.08]">
              <p className="text-white font-bold text-[15px] mb-4">Age Breakdown</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={ageData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="range" type="category" tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={v => `${v}%`} />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.08]">
              <p className="text-white font-bold text-[15px] mb-3">Top Locations</p>
              <div className="space-y-2.5">
                {demographics.topCountries.map((c, i) => (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="text-white/40 text-[13px] w-4">{i + 1}</span>
                    <span className="text-white text-[13px] flex-1">{c.country}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#ff0050]" style={{ width: `${c.percent}%` }} />
                    </div>
                    <span className="text-white/60 text-[12px] w-10 text-right">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "rewards" && (
          <>
            <div className="bg-gradient-to-br from-[#ff0050]/20 to-[#20d5ec]/10 rounded-2xl p-5 border border-[#ff0050]/20">
              <p className="text-white/60 text-[13px]">Creator Fund Balance</p>
              <p className="text-white font-bold text-[32px] mt-1">${(stats.views * 0.000025).toFixed(2)}</p>
              <p className="text-white/50 text-[12px] mt-1">Based on {formatCount(stats.views)} views this period</p>
              <button className="mt-3 px-5 py-2 bg-[#ff0050] rounded-full text-white text-[14px] font-bold">Withdraw</button>
            </div>

            <p className="text-white font-bold text-[15px]">Payment History</p>
            <div className="space-y-3">
              {rewards.length === 0 ? (
                <p className="text-white/40 text-center py-8 text-[14px]">No rewards yet. Keep creating!</p>
              ) : rewards.map(r => (
                <div key={r.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/[0.08]">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-[14px]">{new Date(r.date).toLocaleDateString()}</p>
                    <p className="text-white/50 text-[12px]">{formatCount(r.views)} views</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-[16px]">${r.amount.toFixed(2)}</p>
                    <span className={cn("text-[11px] font-semibold", r.status === "paid" ? "text-green-400" : "text-yellow-400")}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <EtokBottomNav />
    </div>
  );
};

export default EtokAnalytics;
