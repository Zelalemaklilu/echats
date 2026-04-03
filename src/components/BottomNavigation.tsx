// @ts-nocheck
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, Phone, Megaphone, BookUser, Settings, Clapperboard, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useChatList } from "@/hooks/useChatStore";
import { useMissedCalls } from "@/hooks/useMissedCalls";

interface NavItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  matchPaths?: string[];
  accent?: string;
}

const navItems: NavItem[] = [
  { path: "/chats",    icon: MessageCircle, label: "Chats",    matchPaths: ["/chats", "/chat"],    accent: "hsl(338 90% 67%)" },
  { path: "/calls",    icon: Phone,         label: "Calls",                                         accent: "hsl(145 65% 50%)" },
  { path: "/channels", icon: Megaphone,     label: "Channels",                                      accent: "hsl(210 90% 60%)" },
  { path: "/wallet",   icon: Wallet,        label: "Wallet",   matchPaths: ["/wallet", "/add-money", "/send-money", "/request-money", "/transaction-history", "/transaction-detail", "/transaction-receipt", "/gifts", "/buy-stars", "/scheduled-payments"], accent: "hsl(45 100% 55%)" },
  { path: "/etok",     icon: Clapperboard,  label: "Etok",     matchPaths: ["/etok"],               accent: "hsl(280 80% 65%)" },
  { path: "/contacts", icon: BookUser,      label: "Contacts",                                      accent: "hsl(168 70% 45%)" },
  { path: "/settings", icon: Settings,      label: "Settings",                                      accent: "hsl(338 90% 67%)" },
];

export function BottomNavigation() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { totalUnread } = useChatList();
  const { missedCount, markCallsAsSeen } = useMissedCalls();

  const isActive = (item: NavItem) => {
    const paths = item.matchPaths || [item.path];
    return paths.some(p => location.pathname.startsWith(p));
  };

  const handleNavClick = (item: NavItem) => {
    if (item.path === "/calls") markCallsAsSeen();
    navigate(item.path);
  };

  const getBadge = (item: NavItem): number => {
    if (item.path === "/chats") return totalUnread;
    if (item.path === "/calls") return missedCount;
    return 0;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "hsl(var(--background) / 0.96)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderTop: "1px solid hsl(var(--border) / 0.4)",
        boxShadow: "0 -8px 32px hsl(222 22% 0% / 0.25)",
      }}
    >
      <nav className="flex items-stretch justify-around h-[66px] max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon   = item.icon;
          const badge  = getBadge(item);

          return (
            <button
              key={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
              onClick={() => handleNavClick(item)}
              className="relative flex flex-col items-center justify-center flex-1 gap-1 py-2 rounded-2xl transition-all"
            >
              {active && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-x-0.5 inset-y-1 rounded-2xl"
                  style={{ background: `${item.accent}18` }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}

              <motion.div
                animate={{
                  scale: active ? 1.12 : 1,
                  y: active ? -1 : 0,
                }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="relative z-10"
              >
                <Icon
                  className="transition-colors"
                  style={{
                    width: 22,
                    height: 22,
                    color: active ? item.accent : "hsl(var(--muted-foreground))",
                    strokeWidth: active ? 2.4 : 1.8,
                    filter: active ? `drop-shadow(0 0 6px ${item.accent}60)` : "none",
                  }}
                />
                {badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 text-[10px] font-black rounded-full bg-destructive text-white flex items-center justify-center px-1 leading-none"
                    style={{ boxShadow: "0 2px 8px hsl(0 68% 58% / 0.5)" }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </motion.span>
                )}
              </motion.div>

              <span
                className="relative z-10 text-[9.5px] font-bold leading-none transition-colors"
                style={{ color: active ? item.accent : "hsl(var(--muted-foreground))" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="h-safe-area-bottom" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
