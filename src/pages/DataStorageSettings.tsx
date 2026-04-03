import { useState, useEffect } from "react";
import { ArrowLeft, Database, HardDrive, Download, Trash2, FileDown, Image, Video, File as FileIcon, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { exportAllChatsAsText } from "@/lib/chatExportService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "echat_data_storage_settings";

interface DataStorageSettingsData {
  autoDownloadPhotos: boolean;
  autoDownloadVideos: boolean;
  autoDownloadFiles: boolean;
  dataSaverMode: boolean;
  lessDataForCalls: boolean;
}

function getDefaults(): DataStorageSettingsData {
  return { autoDownloadPhotos: true, autoDownloadVideos: false, autoDownloadFiles: false, dataSaverMode: false, lessDataForCalls: false };
}

function loadSettings(): DataStorageSettingsData {
  try { const s = localStorage.getItem(SETTINGS_KEY); if (s) return { ...getDefaults(), ...JSON.parse(s) }; } catch {}
  return getDefaults();
}

function saveSettings(s: DataStorageSettingsData) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

function estimateStorageUsed(): string {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) total += k.length + (localStorage.getItem(k)?.length || 0);
    }
    const bytes = total * 2;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  } catch { return "Unknown"; }
}

const SectionTitle = ({ label }: { label: string }) => (
  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2 mt-5">{label}</p>
);

const SettingRow = ({
  icon: Icon, iconBg, label, sub, right, onClick, danger, testId,
}: {
  icon: React.ComponentType<{ className?: string }>; iconBg: string; label: string; sub?: string;
  right?: React.ReactNode; onClick?: () => void; danger?: boolean; testId?: string;
}) => (
  <motion.button whileTap={{ scale: 0.99 }} onClick={onClick}
    className="flex items-center w-full px-4 py-3.5 hover:bg-muted/40 transition-colors text-left" data-testid={testId}>
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mr-3.5", iconBg)}>
      <Icon className="h-[17px] w-[17px] text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn("text-[14px] font-semibold leading-tight", danger ? "text-red-400" : "")}>{label}</p>
      {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
    {right !== undefined && <div className="ml-3 flex-shrink-0">{right}</div>}
  </motion.button>
);

const ConfirmSheet = ({
  open, onClose, title, body, onConfirm, danger = false, testIdConfirm, testIdCancel,
}: {
  open: boolean; onClose: () => void; title: string; body: string; onConfirm: () => void;
  danger?: boolean; testIdConfirm?: string; testIdCancel?: string;
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
          <div className="space-y-3">
            <motion.button whileTap={{ scale: 0.98 }} onClick={onConfirm}
              className={cn("w-full py-4 rounded-2xl font-bold text-[15px]", danger ? "bg-red-500 text-white shadow-lg shadow-red-500/25" : "bg-primary text-primary-foreground shadow-lg shadow-primary/25")}
              data-testid={testIdConfirm}>
              {danger ? "Confirm" : "OK"}
            </motion.button>
            <button onClick={onClose} className="w-full py-3 text-muted-foreground text-[14px] font-medium" data-testid={testIdCancel}>
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const DataStorageSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings]     = useState<DataStorageSettingsData>(loadSettings);
  const [storageUsed, setStorageUsed] = useState(estimateStorageUsed);
  const [showClearCache, setShowClearCache]   = useState(false);
  const [showDeleteChats, setShowDeleteChats] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const update = (partial: Partial<DataStorageSettingsData>) => {
    setSettings(prev => { const next = { ...prev, ...partial }; saveSettings(next); return next; });
  };

  const handleExport = async () => {
    if (!user?.id || exporting) return;
    setExporting(true);
    const tid = toast.loading("Preparing export…");
    try { await exportAllChatsAsText(user.id); toast.dismiss(tid); toast.success("Chat history downloaded!"); setExportDone(true); setTimeout(() => setExportDone(false), 3000); }
    catch { toast.dismiss(tid); toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const handleClearCache = () => {
    const keep = [SETTINGS_KEY, "echat_notification_settings", "echat-theme", "echat-accent-color", "echat-default-sound"];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keep.includes(k) && !k.startsWith("sb-")) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    setStorageUsed(estimateStorageUsed());
    toast.success("Cache cleared");
    setShowClearCache(false);
  };

  const handleDeleteChats = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes("chat") || k.includes("message"))) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    setStorageUsed(estimateStorageUsed());
    toast.success("All chats deleted");
    setShowDeleteChats(false);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bold text-[17px]">Data & Storage</h1>
        </div>
      </div>

      <div className="px-4">
        {/* Storage info card */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 px-4 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <HardDrive className="h-5.5 w-5.5 text-primary" style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Local Storage Used</p>
            <p className="text-[22px] font-black text-primary" data-testid="text-storage-used">{storageUsed}</p>
          </div>
        </div>

        {/* Storage actions */}
        <SectionTitle label="Storage" />
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingRow icon={Trash2} iconBg="bg-slate-500" label="Clear Cache" sub="Remove temporary files"
            onClick={() => setShowClearCache(true)} testId="button-clear-cache" />
        </div>

        {/* Auto-download */}
        <SectionTitle label="Auto-Download" />
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingRow icon={Image} iconBg="bg-blue-500" label="Photos" sub="Auto-download images"
            right={<Switch checked={settings.autoDownloadPhotos} onCheckedChange={v => update({ autoDownloadPhotos: v })} />}
            testId="switch-auto-download-photos" />
          <SettingRow icon={Video} iconBg="bg-purple-500" label="Videos" sub="Auto-download videos"
            right={<Switch checked={settings.autoDownloadVideos} onCheckedChange={v => update({ autoDownloadVideos: v })} />}
            testId="switch-auto-download-videos" />
          <SettingRow icon={FileIcon} iconBg="bg-orange-500" label="Files" sub="Auto-download documents"
            right={<Switch checked={settings.autoDownloadFiles} onCheckedChange={v => update({ autoDownloadFiles: v })} />}
            testId="switch-auto-download-files" />
        </div>

        {/* Data Saver */}
        <SectionTitle label="Data Saver" />
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingRow icon={Download} iconBg="bg-teal-500" label="Data Saver Mode" sub="Reduce media quality to save data"
            right={<Switch checked={settings.dataSaverMode} onCheckedChange={v => update({ dataSaverMode: v })} />}
            testId="switch-data-saver" />
          <SettingRow icon={Database} iconBg="bg-indigo-500" label="Less Data for Calls" sub="Lower audio quality to save data"
            right={<Switch checked={settings.lessDataForCalls} onCheckedChange={v => update({ lessDataForCalls: v })} />}
            testId="switch-less-data-calls" />
        </div>

        {/* Chat History */}
        <SectionTitle label="Chat History" />
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <SettingRow
            icon={exportDone ? Check : exporting ? Loader2 : FileDown}
            iconBg={exportDone ? "bg-emerald-500" : "bg-cyan-500"}
            label={exportDone ? "Downloaded!" : exporting ? "Exporting…" : "Export Chat History"}
            sub="Download all chats as text file"
            onClick={handleExport}
            testId="button-export-chat"
          />
          <SettingRow icon={Trash2} iconBg="bg-red-500" label="Delete All Chats" sub="Permanently remove all chat data" danger
            onClick={() => setShowDeleteChats(true)} testId="button-delete-all-chats" />
        </div>
      </div>

      <ConfirmSheet open={showClearCache} onClose={() => setShowClearCache(false)} title="Clear Cache"
        body="This will clear temporary cached data. Your account, settings, and chat history will be preserved."
        onConfirm={handleClearCache} testIdConfirm="button-confirm-clear-cache" testIdCancel="button-cancel-clear-cache" />
      <ConfirmSheet open={showDeleteChats} onClose={() => setShowDeleteChats(false)} title="Delete All Chats"
        body="This action cannot be undone. All your local chat data will be permanently deleted."
        onConfirm={handleDeleteChats} danger testIdConfirm="button-confirm-delete-chats" testIdCancel="button-cancel-delete-chats" />
    </div>
  );
};

export default DataStorageSettings;
