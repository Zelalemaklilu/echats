// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Search, X, User, MessageSquare, Hash, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { chatStore } from "@/lib/chatStore";
import { getMyGroups, type GroupWithLastMessage } from "@/lib/groupService";
import { getChannels, type Channel } from "@/lib/channelService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const RECENT_KEY = "echat_recent_searches";
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(query: string): void {
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
}

function removeRecentSearch(query: string): void {
  const searches = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(searches));
}

type Tab = "all" | "people" | "chats" | "channels";

interface SearchResult {
  id: string;
  type: "person" | "chat" | "group" | "channel";
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  route: string;
}

const GlobalSearch = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const lower = q.toLowerCase();
      const found: SearchResult[] = [];

      try {
        const chats = chatStore.chats || [];
        for (const chat of chats) {
          const partnerId = chat.participants?.find((p: string) => p !== userId);
          if (!partnerId) continue;
          const profile = await chatStore.getProfile(partnerId);
          const name = profile?.name || profile?.username || "";
          const username = profile?.username || "";
          if (
            name.toLowerCase().includes(lower) ||
            username.toLowerCase().includes(lower)
          ) {
            found.push({
              id: `person_${chat.id}`,
              type: "person",
              name,
              subtitle: username ? `@${username}` : "Contact",
              avatarUrl: profile?.avatar_url,
              route: `/chat/${chat.id}`,
            });
          }
        }
      } catch {
        // ignore
      }

      try {
        const groups = getMyGroups(userId || "");
        for (const g of groups) {
          if (g.name?.toLowerCase().includes(lower)) {
            found.push({
              id: `group_${g.id}`,
              type: "group",
              name: g.name,
              subtitle: `${g.memberCount || 0} members`,
              avatarUrl: g.avatarUrl,
              route: `/group/${g.id}`,
            });
          }
        }
      } catch {
        // ignore
      }

      try {
        const channels = getChannels();
        for (const ch of channels) {
          if (
            ch.name.toLowerCase().includes(lower) ||
            (ch.description || "").toLowerCase().includes(lower)
          ) {
            found.push({
              id: `channel_${ch.id}`,
              type: "channel",
              name: ch.name,
              subtitle: ch.description || `${ch.subscriberCount || 0} subscribers`,
              avatarUrl: ch.avatarUrl,
              route: `/channel/${ch.id}`,
            });
          }
        }
      } catch {
        // ignore
      }

      setResults(found);
      setLoading(false);
    },
    [userId]
  );

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleSelect = (result: SearchResult) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    navigate(result.route);
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
  };

  const filteredResults = results.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "people") return r.type === "person";
    if (activeTab === "chats") return r.type === "chat" || r.type === "group";
    if (activeTab === "channels") return r.type === "channel";
    return true;
  });

  const groupedResults = {
    people: results.filter((r) => r.type === "person"),
    chats: results.filter((r) => r.type === "chat" || r.type === "group"),
    channels: results.filter((r) => r.type === "channel"),
  };

  const typeIcon = (type: SearchResult["type"]) => {
    if (type === "person") return <User className="h-3.5 w-3.5 text-primary" />;
    if (type === "group") return <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />;
    if (type === "channel") return <Hash className="h-3.5 w-3.5 text-amber-500" />;
    return <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "people", label: "People" },
    { id: "chats", label: "Chats" },
    { id: "channels", label: "Channels" },
  ];

  const renderResult = (r: SearchResult) => (
    <motion.button
      key={r.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => handleSelect(r)}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
      data-testid={`search-result-${r.id}`}
    >
      <div className="relative flex-shrink-0">
        <ChatAvatar
          src={r.avatarUrl}
          name={r.name}
          size="md"
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center">
          {typeIcon(r.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] truncate">{r.name}</p>
        {r.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
        )}
      </div>
    </motion.button>
  );

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pt-4 pb-3 border-b border-border/50">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors flex-shrink-0"
          data-testid="button-search-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, chats, channels…"
            className="pl-9 pr-9 rounded-full bg-muted border-0 text-sm"
            data-testid="input-global-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {query.trim() && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/30 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-white shadow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              style={
                activeTab === tab.id
                  ? { background: "var(--gradient-primary)" }
                  : undefined
              }
              data-testid={`tab-search-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!query.trim() ? (
            /* Recent Searches */
            <motion.div
              key="recent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-4 pt-5 pb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Recent Searches
                    </p>
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecentSearches([]);
                      }}
                      className="text-xs text-primary font-semibold"
                      data-testid="button-clear-recent"
                    >
                      Clear All
                    </button>
                  </div>
                  {recentSearches.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors"
                    >
                      <button
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => handleRecentClick(s)}
                        data-testid={`recent-search-${s}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-foreground">{s}</span>
                      </button>
                      <button
                        onClick={() => {
                          removeRecentSearch(s);
                          setRecentSearches(getRecentSearches());
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/60 flex-shrink-0"
                        data-testid={`button-remove-recent-${s}`}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center pt-24 gap-3 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-bold text-[16px]">Search Everything</p>
                  <p className="text-sm text-muted-foreground">
                    Find people, chats, groups, and channels all in one place.
                  </p>
                </div>
              )}
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center pt-20"
            >
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </motion.div>
          ) : filteredResults.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center pt-20 gap-3 px-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-bold text-[15px]">No results found</p>
              <p className="text-sm text-muted-foreground">
                No matches for "{query}"
              </p>
            </motion.div>
          ) : activeTab === "all" ? (
            <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {groupedResults.people.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 pt-4 pb-1">
                    People
                  </p>
                  {groupedResults.people.slice(0, 3).map(renderResult)}
                </div>
              )}
              {groupedResults.chats.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 pt-4 pb-1">
                    Chats & Groups
                  </p>
                  {groupedResults.chats.slice(0, 3).map(renderResult)}
                </div>
              )}
              {groupedResults.channels.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 pt-4 pb-1">
                    Channels
                  </p>
                  {groupedResults.channels.slice(0, 3).map(renderResult)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredResults.map(renderResult)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GlobalSearch;
