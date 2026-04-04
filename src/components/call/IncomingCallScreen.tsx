import { Phone, PhoneOff, Video, MessageSquare, Clock, BellOff } from 'lucide-react';
import { ChatAvatar } from '@/components/ui/chat-avatar';
import { useCall } from '@/contexts/CallContext';
import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RINGTONE_URL = '/ringtone.mp3';

const QUICK_REPLIES = [
  { label: "Can't talk", icon: BellOff },
  { label: "Call me later", icon: Clock },
  { label: "On my way", icon: MessageSquare },
];

export const IncomingCallScreen = () => {
  const { activeCall, acceptCall, rejectCall } = useCall();
  const ringtoneRef   = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef  = useRef(false);

  const startRingtone = useCallback(() => {
    if (isPlayingRef.current || !activeCall) return;
    try {
      const audio = new Audio(RINGTONE_URL);
      audio.loop = true;
      audio.volume = 0.7;
      ringtoneRef.current = audio;
      isPlayingRef.current = true;
      audio.play().catch(() => { isPlayingRef.current = false; });
    } catch { isPlayingRef.current = false; }
  }, [activeCall]);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.src = '';
      ringtoneRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  useEffect(() => { startRingtone(); return () => stopRingtone(); }, [startRingtone, stopRingtone]);

  const handleAccept = useCallback(() => { stopRingtone(); acceptCall(); }, [stopRingtone, acceptCall]);
  const handleReject = useCallback(() => { stopRingtone(); rejectCall(); }, [stopRingtone, rejectCall]);

  if (!activeCall) return null;
  const isVideoCall   = activeCall.callType === 'video';
  const hasAvatar     = !!activeCall.peerAvatar;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* ── Layer 1: Full-screen blurred avatar or gradient background ── */}
      {hasAvatar ? (
        <>
          <img
            src={activeCall.peerAvatar}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: "blur(28px) saturate(1.4) brightness(0.45)" }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.35) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(16,185,129,0.2) 0%, transparent 60%),
              linear-gradient(180deg, #050510 0%, #080d1e 50%, #050510 100%)
            `,
          }}
        />
      )}

      {/* ── Layer 2: Animated light blobs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            top: "5%", left: "50%", x: "-50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ── Layer 3: Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-16 px-6">

        {/* Top: call type badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-2">
            {isVideoCall
              ? <Video className="h-3.5 w-3.5 text-white/80" />
              : <Phone className="h-3.5 w-3.5 text-white/80" />}
            <span className="text-white/80 text-[13px] font-semibold tracking-wide">
              {isVideoCall ? "Incoming Video Call" : "Incoming Voice Call"}
            </span>
          </div>
          <p className="text-white/35 text-[11px] font-medium">via Echat</p>
        </motion.div>

        {/* Center: Avatar + rings + name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center"
        >
          {/* Rings */}
          <div className="relative flex items-center justify-center mb-10">
            {[200, 160, 125].map((size, idx) => (
              <motion.div
                key={size}
                className="absolute rounded-full"
                style={{
                  width: size, height: size,
                  background: idx === 0
                    ? "rgba(255,255,255,0.04)"
                    : idx === 1
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                animate={{ scale: [0.9, 1.06, 0.9], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2 + idx * 0.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 }}
              />
            ))}
            {/* Outer glow blob */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 180, height: 180,
                background: isVideoCall
                  ? "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)",
              }}
              animate={{ scale: [0.95, 1.12, 0.95], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Avatar */}
            <motion.div
              className="relative z-10 rounded-full overflow-hidden shadow-2xl"
              style={{
                width: 120, height: 120,
                boxShadow: isVideoCall
                  ? "0 0 0 3px rgba(99,102,241,0.5), 0 24px 48px rgba(0,0,0,0.6)"
                  : "0 0 0 3px rgba(16,185,129,0.5), 0 24px 48px rgba(0,0,0,0.6)",
              }}
              animate={{ boxShadow: isVideoCall
                ? ["0 0 0 3px rgba(99,102,241,0.4), 0 24px 48px rgba(0,0,0,0.6)", "0 0 0 6px rgba(99,102,241,0.2), 0 24px 48px rgba(0,0,0,0.6)", "0 0 0 3px rgba(99,102,241,0.4), 0 24px 48px rgba(0,0,0,0.6)"]
                : ["0 0 0 3px rgba(16,185,129,0.4), 0 24px 48px rgba(0,0,0,0.6)", "0 0 0 6px rgba(16,185,129,0.2), 0 24px 48px rgba(0,0,0,0.6)", "0 0 0 3px rgba(16,185,129,0.4), 0 24px 48px rgba(0,0,0,0.6)"],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChatAvatar name={activeCall.peerName} src={activeCall.peerAvatar} size="xl" className="w-full h-full" />
            </motion.div>
          </div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white text-[36px] font-black leading-none tracking-tight text-center mb-3"
          >
            {activeCall.peerName}
          </motion.h1>

          {/* Subtitle with wave dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-2 text-white/50 text-[15px] font-medium"
          >
            <span>{isVideoCall ? "wants to video call you" : "is calling you"}</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-white/50"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom: Quick replies + buttons */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-7 w-full"
        >
          {/* Quick reply pills */}
          <div className="flex gap-2 flex-wrap justify-center">
            {QUICK_REPLIES.map((qr, i) => (
              <motion.button
                key={qr.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleReject}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 text-white/70 text-[12px] font-medium rounded-full px-3.5 py-2 hover:bg-white/18 transition-colors"
              >
                <qr.icon className="h-3 w-3" />
                {qr.label}
              </motion.button>
            ))}
          </div>

          {/* Decline / Accept pair */}
          <div className="flex items-center justify-around w-full max-w-[320px]">
            {/* Decline */}
            <div className="flex flex-col items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleReject}
                className="w-[76px] h-[76px] rounded-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #f87171, #dc2626)",
                  boxShadow: "0 8px 32px rgba(239,68,68,0.45), 0 2px 8px rgba(0,0,0,0.4)",
                }}
                data-testid="button-decline-call"
              >
                <PhoneOff className="h-7 w-7 text-white" />
              </motion.button>
              <span className="text-white/55 text-[13px] font-semibold">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-full"
                style={{
                  padding: 6,
                  background: isVideoCall
                    ? "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 80%)"
                    : "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 80%)",
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={handleAccept}
                  className="w-[76px] h-[76px] rounded-full flex items-center justify-center"
                  style={{
                    background: isVideoCall
                      ? "linear-gradient(145deg, #818cf8, #4f46e5)"
                      : "linear-gradient(145deg, #34d399, #059669)",
                    boxShadow: isVideoCall
                      ? "0 8px 32px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.4)"
                      : "0 8px 32px rgba(16,185,129,0.5), 0 2px 8px rgba(0,0,0,0.4)",
                  }}
                  data-testid="button-accept-call"
                >
                  {isVideoCall
                    ? <Video className="h-7 w-7 text-white" />
                    : <Phone className="h-7 w-7 text-white" />}
                </motion.button>
              </motion.div>
              <span className="text-white/55 text-[13px] font-semibold">Accept</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
