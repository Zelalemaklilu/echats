// @ts-nocheck
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Zap, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAllQuickReplies, addQuickReply, updateQuickReply, deleteQuickReply, type QuickReply } from "@/lib/quickReplyService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const QuickRepliesSettings = () => {
  const navigate = useNavigate();
  const [replies, setReplies]   = useState<QuickReply[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing]   = useState<QuickReply | null>(null);
  const [shortcut, setShortcut] = useState("");
  const [text, setText]         = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { setReplies(getAllQuickReplies()); }, []);

  const openAdd = () => { setEditing(null); setShortcut(""); setText(""); setShowSheet(true); };
  const openEdit = (r: QuickReply) => { setEditing(r); setShortcut(r.shortcut); setText(r.text); setShowSheet(true); };

  const handleSave = () => {
    if (!shortcut.trim()) { toast.error("Enter a shortcut"); return; }
    if (!text.trim())     { toast.error("Enter reply text"); return; }
    if (editing) { updateQuickReply(editing.id, shortcut, text); toast.success("Updated"); }
    else         { addQuickReply(shortcut, text); toast.success("Added"); }
    setReplies(getAllQuickReplies()); setShowSheet(false);
  };

  const handleDelete = (id: string) => {
    deleteQuickReply(id); setReplies(getAllQuickReplies()); setDeleteId(null); toast.success("Deleted");
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-[17px]">Quick Replies</h1>
            <p className="text-[11px] text-muted-foreground">Type / to use in chats</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={openAdd}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/25" data-testid="button-add-reply">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </motion.button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-primary/8 border border-primary/15 rounded-2xl px-4 py-3.5 mb-4">
          <Zap className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" style={{ width: 18, height: 18 }} />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Type <code className="bg-muted px-1.5 py-0.5 rounded-lg text-primary font-mono text-[12px]">/shortcut</code> in any chat to instantly insert your reply.
          </p>
        </div>

        {/* List */}
        <AnimatePresence>
          {replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary/50" />
              </div>
              <div>
                <p className="font-semibold text-[15px] mb-1">No quick replies yet</p>
                <p className="text-muted-foreground text-[13px]">Tap + to create your first shortcut</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {replies.map(reply => (
                <motion.div key={reply.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex items-start gap-3 bg-card rounded-2xl border border-border/50 px-4 py-3.5"
                  data-testid={`reply-item-${reply.id}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[13px] font-bold text-primary">{reply.shortcut}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{reply.text}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(reply)}
                      className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDeleteId(reply.id)}
                      className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Sheet */}
      <AnimatePresence>
        {showSheet && (
          <div className="fixed inset-0 z-50 flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSheet(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full bg-card rounded-t-3xl border-t border-border/50 px-5 pt-5 pb-10">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-bold text-[17px] mb-5">{editing ? "Edit Quick Reply" : "New Quick Reply"}</h2>
              <div className="space-y-3.5">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Shortcut</p>
                  <input value={shortcut} onChange={e => setShortcut(e.target.value)} placeholder="/hi"
                    className="w-full bg-muted rounded-2xl px-4 py-3.5 text-[14px] font-mono outline-none border border-border/50 focus:border-primary/50 transition-colors"
                    autoFocus data-testid="input-shortcut" />
                  <p className="text-[11px] text-muted-foreground mt-1.5 pl-1">Start with /</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Reply Text</p>
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Your reply message…" rows={3}
                    className="w-full bg-muted rounded-2xl px-4 py-3.5 text-[14px] outline-none resize-none border border-border/50 focus:border-primary/50 transition-colors"
                    data-testid="input-reply-text" />
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-lg shadow-primary/20">
                  {editing ? "Save Changes" : "Add Quick Reply"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full bg-card rounded-t-3xl border-t border-border/50 px-5 pt-5 pb-10">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <h2 className="font-bold text-[17px] mb-2">Delete Quick Reply?</h2>
              <p className="text-[13px] text-muted-foreground mb-6">This action cannot be undone.</p>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => deleteId && handleDelete(deleteId)}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] shadow-lg shadow-red-500/25 mb-3">
                Delete
              </motion.button>
              <button onClick={() => setDeleteId(null)} className="w-full py-3 text-muted-foreground text-[14px] font-medium">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickRepliesSettings;
