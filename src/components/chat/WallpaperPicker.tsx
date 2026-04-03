// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  setChatWallpaper,
  setDefaultWallpaper,
  getChatWallpaper,
  getWallpaperStyle,
  type WallpaperConfig,
} from "@/lib/chatWallpaperService";
import { cn } from "@/lib/utils";

interface WallpaperPickerProps {
  chatId: string;
  open?: boolean;
  onClose: () => void;
}

const SOLID_COLORS: WallpaperConfig[] = [
  { type: "color", value: "transparent" },
  { type: "color", value: "hsl(220 15% 8%)" },
  { type: "color", value: "hsl(338 30% 10%)" },
  { type: "color", value: "hsl(210 40% 10%)" },
  { type: "color", value: "hsl(145 25% 8%)" },
  { type: "color", value: "hsl(270 20% 10%)" },
  { type: "color", value: "hsl(30 20% 8%)" },
  { type: "color", value: "hsl(0 20% 8%)" },
];

const GRADIENTS: WallpaperConfig[] = [
  { type: "gradient", value: "linear-gradient(135deg, hsl(338 80% 18%), hsl(270 60% 10%))" },
  { type: "gradient", value: "linear-gradient(135deg, hsl(210 80% 15%), hsl(190 60% 8%))" },
  { type: "gradient", value: "linear-gradient(160deg, hsl(145 50% 12%), hsl(180 40% 7%))" },
  { type: "gradient", value: "linear-gradient(135deg, hsl(30 70% 15%), hsl(15 60% 8%))" },
  { type: "gradient", value: "linear-gradient(160deg, hsl(260 60% 15%), hsl(220 50% 8%))" },
  { type: "gradient", value: "linear-gradient(135deg, hsl(340 70% 18%), hsl(20 60% 10%))" },
  { type: "gradient", value: "linear-gradient(180deg, hsl(195 80% 12%), hsl(220 60% 7%))" },
  { type: "gradient", value: "linear-gradient(135deg, hsl(120 40% 12%), hsl(80 30% 7%))" },
];

const AURORA: WallpaperConfig[] = [
  { type: "gradient", value: "radial-gradient(ellipse at 20% 50%, hsl(338 80% 20% / 0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, hsl(260 80% 20% / 0.6) 0%, transparent 50%), hsl(220 15% 6%)" },
  { type: "gradient", value: "radial-gradient(ellipse at 30% 40%, hsl(195 90% 18% / 0.7) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, hsl(145 70% 16% / 0.7) 0%, transparent 50%), hsl(210 20% 5%)" },
  { type: "gradient", value: "radial-gradient(ellipse at 60% 30%, hsl(270 80% 20% / 0.7) 0%, transparent 45%), radial-gradient(ellipse at 40% 70%, hsl(180 80% 16% / 0.6) 0%, transparent 45%), hsl(240 15% 5%)" },
  { type: "gradient", value: "radial-gradient(ellipse at 25% 60%, hsl(30 90% 20% / 0.65) 0%, transparent 50%), radial-gradient(ellipse at 75% 40%, hsl(338 80% 18% / 0.65) 0%, transparent 50%), hsl(20 15% 5%)" },
];

const PATTERNS: WallpaperConfig[] = [
  { type: "pattern", value: "radial-gradient(circle, hsl(338 85% 70% / 0.08) 1px, transparent 1px), hsl(220 15% 8%)" },
  { type: "pattern", value: "repeating-linear-gradient(45deg, hsl(338 85% 70% / 0.05) 0px, hsl(338 85% 70% / 0.05) 1px, transparent 1px, transparent 14px), hsl(220 15% 7%)" },
  { type: "pattern", value: "repeating-linear-gradient(0deg, hsl(210 70% 60% / 0.06) 0px, hsl(210 70% 60% / 0.06) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, hsl(210 70% 60% / 0.06) 0px, hsl(210 70% 60% / 0.06) 1px, transparent 1px, transparent 20px), hsl(220 18% 7%)" },
  { type: "pattern", value: "repeating-linear-gradient(60deg, hsl(145 70% 50% / 0.05) 0px, transparent 1px, transparent 10px, hsl(145 70% 50% / 0.03) 11px, transparent 12px), hsl(210 15% 7%)" },
];

const CATEGORIES = [
  { label: "Colors", items: SOLID_COLORS },
  { label: "Gradients", items: GRADIENTS },
  { label: "Aurora", items: AURORA },
  { label: "Patterns", items: PATTERNS },
];

function WallpaperSwatch({ config, isSelected, onSelect, index }: { config: WallpaperConfig; isSelected: boolean; onSelect: () => void; index: number }) {
  const style =
    config.value === "transparent"
      ? { background: "hsl(var(--muted))" }
      : config.type === "color"
      ? { backgroundColor: config.value }
      : { backgroundImage: config.value, backgroundSize: "cover" };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, type: "spring", stiffness: 420, damping: 22 }}
      whileTap={{ scale: 0.88 }}
      onClick={onSelect}
      className="relative w-14 h-14 rounded-2xl border-2 overflow-hidden"
      style={{ ...style, borderColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))", boxShadow: isSelected ? "0 0 0 3px hsl(var(--primary) / 0.25)" : "none" }}
      data-testid={`wallpaper-swatch-${index}`}
    >
      {config.value === "transparent" && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground font-semibold">None</span>
      )}
      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500 }} className="absolute inset-0 flex items-center justify-center bg-primary/25">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function WallpaperPicker({ chatId, open, onClose }: WallpaperPickerProps) {
  const current = getChatWallpaper(chatId);
  const [selected, setSelected] = useState<WallpaperConfig | null>(current);
  const [activeCategory, setActiveCategory] = useState(0);
  const [applied, setApplied] = useState(false);

  if (open === false) return null;

  const handleApply = () => {
    if (selected) { setChatWallpaper(chatId, selected); setDefaultWallpaper(selected); }
    setApplied(true);
    setTimeout(onClose, 500);
  };

  const handleRemove = () => {
    const none: WallpaperConfig = { type: "color", value: "transparent" };
    setChatWallpaper(chatId, none); setDefaultWallpaper(none); setSelected(none); setApplied(true);
    setTimeout(onClose, 400);
  };

  const previewStyle = selected && selected.value !== "transparent" ? getWallpaperStyle(selected) : {};

  return (
    <AnimatePresence>
      <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
        <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="w-full bg-card rounded-t-3xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>

          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-lg font-bold">Chat Wallpaper</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" data-testid="button-close-wallpaper"><X className="w-4 h-4" /></button>
          </div>

          <div className="mx-5 mb-4 h-[68px] rounded-2xl border border-border/40 overflow-hidden relative flex items-center justify-center gap-2 px-4 transition-all duration-500" style={previewStyle}>
            <div className="px-3 py-1.5 rounded-2xl bg-muted/90 text-xs font-medium backdrop-blur-sm">Hello! 👋</div>
            <div className="px-3 py-1.5 rounded-2xl text-xs font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Hey! ✨</div>
          </div>

          <div className="flex gap-2 px-5 mb-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat, i) => (
              <motion.button key={cat.label} whileTap={{ scale: 0.93 }} onClick={() => setActiveCategory(i)}
                className={cn("flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeCategory === i ? "text-primary-foreground" : "bg-muted text-muted-foreground")}
                style={activeCategory === i ? { background: "var(--gradient-primary)" } : {}}
                data-testid={`tab-wallpaper-${cat.label.toLowerCase()}`}
              >{cat.label}</motion.button>
            ))}
          </div>

          <div className="px-5 pb-2 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={activeCategory} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="flex flex-wrap gap-3">
                {CATEGORIES[activeCategory].items.map((cfg, i) => (
                  <WallpaperSwatch key={i} config={cfg} index={i} isSelected={!!selected && selected.value === cfg.value} onSelect={() => { setSelected(cfg); setApplied(false); }} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-5 py-4 flex gap-3 border-t border-border/30">
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleRemove} data-testid="button-wallpaper-remove">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </Button>
            <motion.button whileTap={{ scale: 0.96 }} className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2" style={{ background: "var(--gradient-primary)" }} onClick={handleApply} data-testid="button-wallpaper-apply">
              <AnimatePresence mode="wait">
                {applied ? (
                  <motion.span key="done" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Applied!</motion.span>
                ) : (
                  <motion.span key="apply" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}>Apply Wallpaper</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
