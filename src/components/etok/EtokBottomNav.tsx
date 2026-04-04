import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, User, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface EtokBottomNavProps {
  onCreateClick?: () => void;
}

export function EtokBottomNav({ onCreateClick }: EtokBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isHome = path === "/etok";
  const isSearch = path.startsWith("/etok/search");
  const isProfile = path.startsWith("/etok/me") || path.startsWith("/etok/profile");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-black border-t border-white/10 pb-safe" style={{ height: 56 }}>
      {/* Home */}
      <button
        onClick={() => navigate("/etok")}
        className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
        data-testid="etok-nav-home"
      >
        <Home className={cn("h-6 w-6", isHome ? "text-white" : "text-white/50")} />
        <span className={cn("text-[10px] font-medium", isHome ? "text-white" : "text-white/50")}>Home</span>
      </button>

      {/* Friends */}
      <button
        onClick={() => navigate("/etok/search")}
        className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
        data-testid="etok-nav-search"
      >
        <Search className={cn("h-6 w-6", isSearch ? "text-white" : "text-white/50")} />
        <span className={cn("text-[10px] font-medium", isSearch ? "text-white" : "text-white/50")}>Discover</span>
      </button>

      {/* Create — TikTok-style pink + button */}
      <button
        onClick={onCreateClick ?? (() => navigate("/etok/camera"))}
        className="flex items-center justify-center flex-1 h-full"
        data-testid="etok-nav-create"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-[52px] h-[32px] rounded-[8px] bg-[#ff0050] translate-x-1.5" />
          <div className="absolute w-[52px] h-[32px] rounded-[8px] bg-[#20d5ec] -translate-x-1.5" />
          <div className="relative w-[52px] h-[32px] rounded-[8px] bg-white flex items-center justify-center">
            <Plus className="h-5 w-5 text-black" strokeWidth={3} />
          </div>
        </div>
      </button>

      {/* Back to main app */}
      <button
        onClick={() => navigate("/chats")}
        className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
        data-testid="etok-nav-back-to-app"
      >
        <div className="relative">
          <MessageSquare className="h-6 w-6 text-white/50" />
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ff0050]" />
        </div>
        <span className="text-[10px] font-medium text-white/50">Chat</span>
      </button>

      {/* Profile */}
      <button
        onClick={() => navigate("/etok/me")}
        className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
        data-testid="etok-nav-profile"
      >
        <User className={cn("h-6 w-6", isProfile ? "text-white" : "text-white/50")} />
        <span className={cn("text-[10px] font-medium", isProfile ? "text-white" : "text-white/50")}>Profile</span>
      </button>
    </div>
  );
}
