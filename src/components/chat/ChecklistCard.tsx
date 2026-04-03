// @ts-nocheck
import { useState } from "react";
import { CheckSquare, Square, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toggleChecklistItem, deleteChecklist, type Checklist } from "@/lib/checklistService";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistCardProps {
  checklist: Checklist;
  isOwn: boolean;
  onUpdate: (updated: Checklist) => void;
  onDelete: () => void;
}

export const ChecklistCard = ({ checklist, isOwn, onUpdate, onDelete }: ChecklistCardProps) => {
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [newItem, setNewItem] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const completed = localChecklist.items.filter(i => i.checked).length;
  const total = localChecklist.items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleToggle = (itemId: string) => {
    const updated = toggleChecklistItem(localChecklist.id, itemId);
    if (updated) {
      setLocalChecklist(updated);
      onUpdate(updated);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl p-3 min-w-[220px] max-w-[300px]",
      isOwn ? "bg-primary/90 text-primary-foreground" : "bg-muted"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-4 w-4 opacity-80" />
          <span className="font-semibold text-sm">{localChecklist.title}</span>
        </div>
        {isOwn && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-70 hover:opacity-100"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="mb-2">
        <div className={cn(
          "h-1.5 rounded-full overflow-hidden",
          isOwn ? "bg-primary-foreground/20" : "bg-border"
        )}>
          <motion.div
            className={cn("h-full rounded-full", isOwn ? "bg-primary-foreground" : "bg-primary")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
        <p className={cn("text-xs mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {completed}/{total} completed
        </p>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {localChecklist.items.map(item => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => handleToggle(item.id)}
              className="flex items-center gap-2 w-full text-left group"
            >
              {item.checked ? (
                <CheckSquare className={cn("h-4 w-4 shrink-0", isOwn ? "text-primary-foreground" : "text-primary")} />
              ) : (
                <Square className="h-4 w-4 shrink-0 opacity-50" />
              )}
              <span className={cn(
                "text-sm leading-tight",
                item.checked && "line-through opacity-50"
              )}>
                {item.text}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {isOwn && (
        <div className="mt-2 pt-2 border-t border-current/10">
          {showAdd ? (
            <div className="flex gap-1">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Add item..."
                className="h-7 text-xs bg-background/20 border-0"
                onKeyDown={e => {
                  if (e.key === "Enter" && newItem.trim()) {
                    const updated: Checklist = {
                      ...localChecklist,
                      items: [...localChecklist.items, {
                        id: Date.now().toString(),
                        text: newItem.trim(),
                        checked: false,
                      }],
                    };
                    setLocalChecklist(updated);
                    onUpdate(updated);
                    setNewItem("");
                  }
                  if (e.key === "Escape") setShowAdd(false);
                }}
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => setShowAdd(false)}
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
            >
              <Plus className="h-3 w-3" />
              Add item
            </button>
          )}
        </div>
      )}
    </div>
  );
};
