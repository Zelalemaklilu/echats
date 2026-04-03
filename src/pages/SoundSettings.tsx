import { useState, useEffect } from "react";
import { ArrowLeft, Volume2, Check, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRESET_SOUNDS, playSound, type SoundConfig } from "@/lib/notificationSoundService";
import { useChatList, useProfile } from "@/hooks/useChatStore";
import { chatStore } from "@/lib/chatStore";
import { toast } from "sonner";

const CONTACT_SOUNDS_KEY = "echat_contact_sounds";

function getContactSound(userId: string): string {
  try { return JSON.parse(localStorage.getItem(CONTACT_SOUNDS_KEY) || "{}")[userId] || "default"; } catch { return "default"; }
}
function setContactSound(userId: string, soundId: string) {
  const d = JSON.parse(localStorage.getItem(CONTACT_SOUNDS_KEY) || "{}");
  d[userId] = soundId;
  localStorage.setItem(CONTACT_SOUNDS_KEY, JSON.stringify(d));
}
function getDefaultSound(): string {
  return localStorage.getItem("echat-default-sound") || "default";
}
function setDefaultSoundById(id: string) {
  localStorage.setItem("echat-default-sound", id);
}

const ContactRow = ({ userId }: { userId: string }) => {
  const { profile } = useProfile(userId);
  const [selectedSound, setSelectedSound] = useState(getContactSound(userId));

  if (!profile) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[14px] font-bold flex-shrink-0">
        {(profile.name || profile.username || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate">{profile.name || profile.username}</p>
      </div>
      <select
        value={selectedSound}
        onChange={e => {
          const id = e.target.value;
          setSelectedSound(id);
          setContactSound(userId, id);
          const sound = PRESET_SOUNDS.find(s => s.id === id);
          if (sound) playSound(sound);
        }}
        className="text-[12px] bg-muted border-0 rounded-xl px-3 py-1.5 outline-none"
      >
        {PRESET_SOUNDS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );
};

const SoundSettings = () => {
  const navigate = useNavigate();
  const [defaultSound, setDefaultSoundState] = useState(getDefaultSound);
  const { chats } = useChatList();
  const currentUserId = chatStore.getCurrentUserId();
  const contactIds = Array.from(new Set(chats.map(c => chatStore.getOtherUserId(c)))).filter(id => id && id !== currentUserId) as string[];

  const handleDefault = (sound: SoundConfig) => {
    setDefaultSoundById(sound.id);
    setDefaultSoundState(sound.id);
    playSound(sound);
    toast.success(`Default sound set to "${sound.name}"`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3 z-20">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-bold text-[17px]">Notification Sounds</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-[14px]">Default Sound</p>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2">
            {PRESET_SOUNDS.map(s => (
              <button
                key={s.id}
                onClick={() => handleDefault(s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${defaultSound === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                data-testid={`sound-chip-${s.id}`}
              >
                {defaultSound === s.id && <Check className="h-3 w-3" />}
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-[14px]">Per-Contact Sounds</p>
          </div>
          {contactIds.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-[13px]">No contacts yet</div>
          ) : (
            contactIds.map(id => <ContactRow key={id} userId={id} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundSettings;
