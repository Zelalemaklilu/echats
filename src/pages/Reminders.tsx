import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getReminders, removeReminder, type Reminder } from "@/lib/reminderService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const Reminders = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => { setReminders(getReminders()); }, []);

  const handleRemove = (id: string) => {
    removeReminder(id);
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success("Reminder removed");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3 z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-bold text-[17px] flex-1">Reminders</h1>
        {reminders.length > 0 && (
          <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
            <span className="text-[11px] font-bold text-primary">{reminders.length}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <AnimatePresence>
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-[14px]">No reminders set</p>
              <p className="text-muted-foreground/60 text-[12px] text-center">Long-press any message to set a reminder</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()).map(r => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="bg-card rounded-2xl border border-border/50 px-4 py-3.5 flex items-start gap-3"
                  data-testid={`reminder-item-${r.id}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground line-clamp-2">"{r.messageText}"</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-primary font-semibold">{formatTime(r.remindAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/chat/${r.chatId}`)}
                      className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
                      data-testid={`button-goto-chat-${r.id}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleRemove(r.id)}
                      className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center"
                      data-testid={`button-delete-reminder-${r.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reminders;
