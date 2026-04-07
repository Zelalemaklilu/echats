import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface ShareImageDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
}

interface ChatOption {
  id: string;
  name: string;
  participant_1: string;
  participant_2: string;
}

export default function ShareImageDialog({ open, onClose, imageUrl }: ShareImageDialogProps) {
  const [chats, setChats] = useState<ChatOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const loadChats = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) { setLoading(false); return; }

    const { data } = await supabase
      .from("chats")
      .select("id, participant_1, participant_2")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const otherIds = data.map((c) => c.participant_1 === userId ? c.participant_2 : c.participant_1);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username")
        .in("id", otherIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      setChats(data.map((c) => {
        const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        const profile = profileMap.get(otherId);
        return { ...c, name: profile?.name || profile?.username || "User" };
      }));
    }
    setLoading(false);
  };

  const handleShare = async (chat: ChatOption) => {
    setSending(chat.id);
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) { setSending(null); return; }

    const receiverId = chat.participant_1 === userId ? chat.participant_2 : chat.participant_1;
    const { error } = await supabase.from("messages").insert({
      chat_id: chat.id,
      sender_id: userId,
      receiver_id: receiverId,
      content: "🎨 AI Generated Image",
      message_type: "image",
      media_url: imageUrl,
    });

    if (error) {
      toast.error("Failed to share image");
    } else {
      toast.success(`Shared to ${chat.name}`);
      onClose();
    }
    setSending(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else loadChats(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share to Chat</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : chats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No chats found</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleShare(chat)}
                disabled={sending === chat.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-sm"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {chat.name[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-left font-medium truncate">{chat.name}</span>
                {sending === chat.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
