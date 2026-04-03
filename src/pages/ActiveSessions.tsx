// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Smartphone, Tablet, Globe, X, Trash2, ShieldCheck, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getDeviceSessions, registerDevice, terminateSession, terminateAllOtherSessions, type DeviceSession } from "@/lib/deviceService";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const DeviceIcon = ({ type, className }: { type: DeviceSession["deviceType"]; className?: string }) => {
  const cls = className ?? "h-5 w-5";
  switch (type) {
    case "desktop": return <Monitor className={cls} />;
    case "mobile":  return <Smartphone className={cls} />;
    case "tablet":  return <Tablet className={cls} />;
    default:        return <Globe className={cls} />;
  }
};

const SessionCard = ({ session, onTerminate }: { session: DeviceSession; onTerminate: () => void }) => {
  const lastActiveText = formatDistanceToNow(new Date(session.lastActive), { addSuffix: true });
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn("rounded-2xl border p-4", session.isCurrent ? "bg-emerald-500/6 border-emerald-500/25" : "bg-card border-border/50")}
      data-testid={`session-card-${session.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
          session.isCurrent ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-muted/60 border border-border/50")}>
          <DeviceIcon type={session.deviceType} className={cn("h-5 w-5", session.isCurrent ? "text-emerald-500" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-[14px] truncate">{session.deviceName}</p>
            {session.isCurrent && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
                This device
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground">{session.os}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-muted-foreground/70" />
              <p className="text-[11px] text-muted-foreground">{session.ipAddress}</p>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground/70" />
              <p className="text-[11px] text-muted-foreground">{session.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Clock className="h-3 w-3 text-muted-foreground/70" />
            <p className={cn("text-[11px] font-semibold", session.isCurrent ? "text-emerald-500" : "text-muted-foreground")}>
              {session.isCurrent ? "Active now" : `Last active ${lastActiveText}`}
            </p>
          </div>
        </div>
        {!session.isCurrent && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={onTerminate}
            className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0"
            data-testid={`button-terminate-session-${session.id}`}>
            <X className="h-4 w-4 text-red-400" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const ConfirmSheet = ({ open, onClose, title, body, onConfirm, testIdConfirm, testIdCancel }: {
  open: boolean; onClose: () => void; title: string; body: string; onConfirm: () => void; testIdConfirm?: string; testIdCancel?: string;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full bg-card rounded-t-3xl border-t border-border/50 px-5 pt-5 pb-10">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
          <h2 className="font-bold text-[17px] mb-2">{title}</h2>
          <p className="text-[13px] text-muted-foreground mb-6">{body}</p>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] shadow-lg shadow-red-500/25 mb-3"
            data-testid={testIdConfirm}>
            Terminate
          </motion.button>
          <button onClick={onClose} className="w-full py-3 text-muted-foreground text-[14px] font-medium" data-testid={testIdCancel}>
            Cancel
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ActiveSessions = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [sessions, setSessions]             = useState<DeviceSession[]>([]);
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [showSingle, setShowSingle]         = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    registerDevice(userId);
    setSessions(getDeviceSessions(userId));
  }, [userId]);

  const handleTerminate = (id: string) => {
    if (!userId) return;
    terminateSession(userId, id);
    setSessions(getDeviceSessions(userId));
    toast.success("Session terminated");
    setShowSingle(null);
  };

  const handleTerminateAll = () => {
    if (!userId) return;
    const count = terminateAllOtherSessions(userId);
    setSessions(getDeviceSessions(userId));
    toast.success(`${count} session${count !== 1 ? "s" : ""} terminated`);
    setShowTerminateAll(false);
  };

  const current = sessions.find(s => s.isCurrent);
  const others  = sessions.filter(s => !s.isCurrent);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center" data-testid="button-back-sessions">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-[17px]">Active Sessions</h1>
            <p className="text-[11px] text-muted-foreground">{sessions.length} device{sessions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-primary/8 border border-primary/15 px-4 py-3.5">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Manage your active sessions. Terminate any session you don't recognize immediately.
          </p>
        </div>

        {/* Current session */}
        {current && (
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Session</p>
            <SessionCard session={current} onTerminate={() => {}} />
          </div>
        )}

        {/* Other sessions */}
        {others.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Other Sessions ({others.length})</p>
            <AnimatePresence>
              <div className="space-y-2.5">
                {others.map(s => (
                  <SessionCard key={s.id} session={s} onTerminate={() => setShowSingle(s.id)} />
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}

        {others.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-[13px]">No other active sessions</div>
        )}

        {/* Terminate all */}
        {others.length > 0 && (
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowTerminateAll(true)}
            className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[15px] flex items-center justify-center gap-2"
            data-testid="button-terminate-all-sessions">
            <Trash2 className="h-4 w-4" />
            Terminate All Other Sessions
          </motion.button>
        )}
      </div>

      <ConfirmSheet open={showTerminateAll} onClose={() => setShowTerminateAll(false)}
        title="Terminate All Sessions" body="This will log you out from all other devices. Are you sure?"
        onConfirm={handleTerminateAll} testIdConfirm="button-confirm-terminate-all" testIdCancel="button-cancel-terminate-all" />
      <ConfirmSheet open={!!showSingle} onClose={() => setShowSingle(null)}
        title="Terminate Session" body="This will log you out from this device. Are you sure?"
        onConfirm={() => showSingle && handleTerminate(showSingle)} testIdConfirm="button-confirm-terminate-single" testIdCancel="button-cancel-terminate-single" />
    </div>
  );
};

export default ActiveSessions;
