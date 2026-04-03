// @ts-nocheck
import { useState } from "react";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type QuickReply, searchQuickReplies } from "@/lib/quickReplyService";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface QuickReplyBarProps {
  query: string;
  onSelect: (text: string) => void;
  onClose: () => void;
}

export const QuickReplyBar = ({ query, onSelect, onClose }: QuickReplyBarProps) => {
  const results = searchQuickReplies(query.startsWith("/") ? query : `/${query}`);

  if (results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 z-50 bg-background border border-border rounded-t-xl shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Quick Replies
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="max-h-48">
        {results.map(reply => (
          <button
            key={reply.id}
            onClick={() => onSelect(reply.text)}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted text-left group"
          >
            <span className="font-mono text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 shrink-0 mt-0.5">
              {reply.shortcut}
            </span>
            <span className="text-sm text-foreground line-clamp-2 flex-1">{reply.text}</span>
          </button>
        ))}
      </ScrollArea>
    </motion.div>
  );
};
