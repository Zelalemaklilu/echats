// @ts-nocheck
import { useState } from "react";
import { ArrowLeft, Radio, Send, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatList, useProfile } from "@/hooks/useChatStore";
import { chatStore } from "@/lib/chatStore";
import { findOrCreateChat } from "@/lib/supabaseService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ContactSelectRow = ({ userId, selected, onToggle }: { userId: string; selected: boolean; onToggle: () => void }) => {
  const { profile } = useProfile(userId);
  if (!profile) return null;
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/40 transition-colors"
      data-testid={`broadcast-contact-${userId}`}
    >
      <div className="relative">
        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-[15px] font-bold">
          {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" /> : (profile.name || profile.username || "?")[0].toUpperCase()}
        </div>
        {selected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[14px] font-medium truncate">{profile.name || profile.username}</p>
        <p className="text-[12px] text-muted-foreground">@{profile.username}</p>
      </div>
    </motion.button>
  );
};

const BroadcastList = () => {
  const navigate = useNavigate();
  const { chats } = useChatList();
  const currentUserId = chatStore.getCurrentUserId();
  const contactIds = Array.from(new Set(chats.map(c => chatStore.getOtherUserId(c)))).filter(id => id && id !== currentUserId) as string[];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const toggleContact = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Enter a message"); return; }
    if (selected.size === 0) { toast.error("Select at least one contact"); return; }
    setSending(true);
    const list = Array.from(selected);
    setProgress({ done: 0, total: list.length });
    let done = 0;
    for (const userId of list) {
      try {
        const chat = await findOrCreateChat(userId);
        if (chat?.id) await chatStore.sendMessage(chat.id, message.trim());
      } catch { /* skip */ }
      done++;
      setProgress({ done, total: list.length });
    }
    setSending(false);
    toast.success(`Message sent to ${done} contact${done !== 1 ? "s" : ""}`);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3 z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <h1 className="font-bold text-[17px]">Broadcast</h1>
          <Radio className="h-4 w-4 text-primary" />
        </div>
        {selected.size > 0 && (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/25">
            <span className="text-[12px] font-bold text-primary-foreground">{selected.size}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Select Recipients</p>
        </div>
        {contactIds.map(id => (
          <ContactSelectRow key={id} userId={id} selected={selected.has(id)} onToggle={() => toggleContact(id)} />
        ))}
        {contactIds.length === 0 && (
          <div className="flex justify-center py-16 text-muted-foreground text-[13px]">No contacts found</div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 space-y-3">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows={3}
          className="w-full bg-muted rounded-2xl px-4 py-3 text-[14px] outline-none resize-none placeholder:text-muted-foreground/60"
          data-testid="input-broadcast-message"
        />
        {progress && (
          <div className="text-center text-[12px] text-muted-foreground">
            Sending to {progress.done}/{progress.total} contacts...
          </div>
        )}
        <button
          onClick={handleSend}
          disabled={sending || selected.size === 0 || !message.trim()}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
          data-testid="button-broadcast-send"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? "Sending..." : `Broadcast to ${selected.size} contact${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
};

export default BroadcastList;
