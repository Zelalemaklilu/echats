// @ts-nocheck
import { useState } from "react";
import { Zap, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  getGroupLevel,
  getBoostCount,
  hasUserBoosted,
  boostGroup,
  BOOST_LEVELS,
} from "@/lib/groupBoostService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GroupBoostPanelProps {
  groupId: string;
}

const LEVEL_COLORS: Record<string, string> = {
  gray: "text-gray-500",
  orange: "text-orange-500",
  blue: "text-blue-500",
  yellow: "text-yellow-500",
  purple: "text-purple-500",
  cyan: "text-cyan-500",
};

const LEVEL_BG: Record<string, string> = {
  gray: "from-gray-500/20 to-gray-600/5",
  orange: "from-orange-500/20 to-orange-600/5",
  blue: "from-blue-500/20 to-blue-600/5",
  yellow: "from-yellow-500/20 to-yellow-600/5",
  purple: "from-purple-500/20 to-purple-600/5",
  cyan: "from-cyan-500/20 to-cyan-600/5",
};

export const GroupBoostPanel = ({ groupId }: GroupBoostPanelProps) => {
  const { user } = useAuth();
  const [boosted, setBoosted] = useState(() => user ? hasUserBoosted(groupId, user.id) : false);
  const [count, setCount] = useState(() => getBoostCount(groupId));
  const level = getGroupLevel(groupId);
  const nextLevel = BOOST_LEVELS[level.level + 1];

  const progress = nextLevel
    ? ((count - level.boostsRequired) / (nextLevel.boostsRequired - level.boostsRequired)) * 100
    : 100;

  const handleBoost = () => {
    if (!user) return;
    if (boosted) {
      toast.info("You already boosted this group this month.");
      return;
    }
    const result = boostGroup(groupId, user.id);
    if (result) {
      setBoosted(true);
      setCount(c => c + 1);
      toast.success("Group boosted! 🚀", { description: "Thanks for supporting this group." });
    }
  };

  return (
    <div className={cn(
      "rounded-xl p-4 bg-gradient-to-br border",
      LEVEL_BG[level.color]
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className={cn("h-5 w-5", LEVEL_COLORS[level.color])} />
          <div>
            <p className="font-bold text-sm">Level {level.level} — {level.name}</p>
            <p className="text-xs text-muted-foreground">{count} boost{count !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("font-bold", LEVEL_COLORS[level.color])}>
          Lvl {level.level}
        </Badge>
      </div>

      {nextLevel && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{count} boosts</span>
            <span>{nextLevel.boostsRequired} for Level {nextLevel.level}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">
          Current Perks
        </p>
        <div className="space-y-1">
          {level.perks.map(perk => (
            <div key={perk} className="flex items-center gap-2 text-sm">
              <span className="text-green-500 text-xs">✓</span>
              {perk}
            </div>
          ))}
        </div>
        {nextLevel && (
          <div className="mt-2 pt-2 border-t border-current/10">
            <p className="text-xs text-muted-foreground mb-1">Next level unlocks:</p>
            {nextLevel.perks.map(perk => (
              <div key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-xs">◦</span>
                {perk}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        className="w-full gap-2"
        variant={boosted ? "outline" : "default"}
        onClick={handleBoost}
      >
        <Zap className="h-4 w-4" />
        {boosted ? "Already Boosted ✓" : "Boost Group"}
      </Button>
    </div>
  );
};
