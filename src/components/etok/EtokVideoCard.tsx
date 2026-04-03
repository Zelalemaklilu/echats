// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Music, Check, VolumeX, Volume2, MoreHorizontal, Scissors, Copy, Flag, Play, Pause, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type EtokVideo, type EtokUser, type EtokSound,
  getUserById, getSoundById,
  isVideoLiked, toggleLike,
  isVideoSaved, toggleSave,
  isFollowing, toggleFollow,
  formatCount, markNotInterested,
} from "@/lib/etokService";
import { EtokComments } from "./EtokComments";
import { EtokShareSheet } from "./EtokShareSheet";

const BG_PATTERNS = [
  { gradient: "linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%)", accent: "#e94560" },
  { gradient: "linear-gradient(135deg,#0d0d0d 0%,#1a0533 50%,#2d1b69 100%)", accent: "#7c3aed" },
  { gradient: "linear-gradient(135deg,#000000 0%,#1c0a00 50%,#2d1200 100%)", accent: "#f97316" },
  { gradient: "linear-gradient(135deg,#001a00 0%,#003300 50%,#004d00 100%)", accent: "#22c55e" },
  { gradient: "linear-gradient(135deg,#0a0a1a 0%,#001a3a 50%,#003366 100%)", accent: "#3b82f6" },
  { gradient: "linear-gradient(135deg,#1a0010 0%,#330022 50%,#660044 100%)", accent: "#ec4899" },
  { gradient: "linear-gradient(135deg,#0d1117 0%,#1a2332 50%,#274151 100%)", accent: "#06b6d4" },
  { gradient: "linear-gradient(135deg,#1a1500 0%,#332900 50%,#665200 100%)", accent: "#eab308" },
  { gradient: "linear-gradient(135deg,#0f0f0f 0%,#1a1a1a 50%,#2a2a2a 100%)", accent: "#ff0050" },
  { gradient: "linear-gradient(135deg,#002233 0%,#004466 50%,#006699 100%)", accent: "#20d5ec" },
  { gradient: "linear-gradient(135deg,#1a0000 0%,#330000 50%,#660000 100%)", accent: "#ef4444" },
  { gradient: "linear-gradient(135deg,#001a1a 0%,#003333 50%,#006666 100%)", accent: "#14b8a6" },
];

interface EtokVideoCardProps {
  video: EtokVideo;
  currentUserId: string;
  isActive: boolean;
  index: number;
  muted: boolean;
  onMuteToggle: () => void;
}

export function EtokVideoCard({ video, currentUserId, isActive, index, muted, onMuteToggle }: EtokVideoCardProps) {
  const author = getUserById(video.authorId);
  const sound = getSoundById(video.soundId);

  const [liked, setLiked] = useState(() => isVideoLiked(currentUserId, video.id));
  const [likeCount, setLikeCount] = useState(video.likes);
  const [saved, setSaved] = useState(() => isVideoSaved(currentUserId, video.id));
  const [following, setFollowing] = useState(() => isFollowing(currentUserId, video.authorId) || video.authorId === currentUserId);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(video.comments);
  const [progress, setProgress] = useState(0);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const pauseIconTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pattern = BG_PATTERNS[index % BG_PATTERNS.length];

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive && !paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive, paused]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
  }, [muted]);

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
  };

  const handleCanPlay = () => {
    setVideoLoading(false);
    setVideoError(false);
  };

  const handleError = () => {
    setVideoLoading(false);
    setVideoError(true);
  };

  const handleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const el = videoRef.current;
    if (now - lastTapRef.current < 280) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setHeartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      if (!liked) {
        setLiked(true);
        setLikeCount(c => c + 1);
        toggleLike(currentUserId, video.id);
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    } else {
      if (el) {
        if (el.paused) {
          el.play().catch(() => {});
          setPaused(false);
        } else {
          el.pause();
          setPaused(true);
        }
        clearTimeout(pauseIconTimerRef.current);
        setShowPauseIcon(true);
        pauseIconTimerRef.current = setTimeout(() => setShowPauseIcon(false), 800);
      }
    }
    lastTapRef.current = now;
  }, [liked, currentUserId, video.id]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowLiked = toggleLike(currentUserId, video.id);
    setLiked(nowLiked);
    setLikeCount(c => nowLiked ? c + 1 : Math.max(0, c - 1));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowSaved = toggleSave(currentUserId, video.id);
    setSaved(nowSaved);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video.authorId === currentUserId) return;
    const f = toggleFollow(currentUserId, video.authorId);
    setFollowing(f);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoError(false);
    setVideoLoading(true);
    const el = videoRef.current;
    if (el) { el.load(); }
  };

  const soundName = sound?.title ?? "Original Sound";

  const renderHashtagDescription = () => {
    const parts = video.description.split(/(#\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("#")
        ? <span key={i} className="font-semibold text-white">{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "100dvh", scrollSnapAlign: "start", scrollSnapStop: "always" }}
      onClick={handleTap}
    >
      {/* ─── Real Video Background ─────────────────── */}
      {video.videoUrl && !videoError ? (
        <>
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            playsInline
            muted={muted}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onCanPlay={handleCanPlay}
            onError={handleError}
            onWaiting={() => setVideoLoading(true)}
            onPlaying={() => setVideoLoading(false)}
          />
          {videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="absolute inset-0" style={{ background: pattern.gradient }} />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: pattern.gradient }}>
          <motion.div
            animate={isActive ? { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-64 h-64 rounded-full blur-3xl"
            style={{ background: pattern.accent + "60", top: "15%", left: "10%" }}
          />
          <motion.div
            animate={isActive ? { scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-48 h-48 rounded-full blur-2xl"
            style={{ background: pattern.accent + "40", bottom: "25%", right: "5%" }}
          />
          <motion.div
            animate={isActive ? { y: [-20, 20, -20] } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-[140px] opacity-20 select-none">{video.thumbnailEmoji}</span>
          </motion.div>
          {videoError && video.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                onClick={handleRetry}
                className="flex flex-col items-center gap-2 bg-black/50 rounded-2xl p-5"
              >
                <RefreshCw className="h-8 w-8 text-white" />
                <span className="text-white text-sm font-semibold">Tap to retry</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gradient overlays like TikTok */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20" />

      {/* ─── Play/Pause icon flash ─────────────── */}
      <AnimatePresence>
        {showPauseIcon && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/50 rounded-full p-5">
              {paused
                ? <Play className="h-12 w-12 text-white fill-white" />
                : <Pause className="h-12 w-12 text-white fill-white" />
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Double-tap heart burst ─────────────── */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.8, 1.5], opacity: [1, 1, 0] }}
            transition={{ duration: 0.8, times: [0, 0.4, 1] }}
            className="absolute pointer-events-none z-20"
            style={{ left: heartPos.x - 48, top: heartPos.y - 48 }}
          >
            <Heart className="h-24 w-24 fill-white text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute indicator */}
      <button
        className="absolute top-16 right-3 z-10 p-2 rounded-full bg-black/30"
        onClick={e => { e.stopPropagation(); onMuteToggle(); }}
        data-testid="button-mute"
      >
        {muted
          ? <VolumeX className="h-4 w-4 text-white" />
          : <Volume2 className="h-4 w-4 text-white" />
        }
      </button>

      {/* ─── RIGHT ACTION COLUMN ─────────────────── */}
      <div
        className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Avatar + follow */}
        <div className="relative mb-1">
          <div className="w-[48px] h-[48px] rounded-full border-[2px] border-white overflow-hidden bg-white/10 flex items-center justify-center text-2xl">
            {author?.avatar ?? "👤"}
          </div>
          {video.authorId !== currentUserId && (
            <button
              onClick={handleFollow}
              className={cn(
                "absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors",
                following ? "bg-white" : "bg-[#ff0050]"
              )}
            >
              {following
                ? <Check className="h-3 w-3 text-[#ff0050]" strokeWidth={3} />
                : <PlusIcon className="h-3 w-3 text-white" strokeWidth={3} />
              }
            </button>
          )}
        </div>

        {/* Like */}
        <ActionBtn
          icon={
            <motion.div whileTap={{ scale: 1.4 }}>
              <Heart className={cn("h-[34px] w-[34px] drop-shadow", liked ? "fill-[#ff0050] text-[#ff0050]" : "fill-white text-white")} />
            </motion.div>
          }
          label={formatCount(likeCount)}
          onClick={handleLike}
          testId="button-like"
        />

        {/* Comment */}
        <ActionBtn
          icon={<MessageCircle className="h-[34px] w-[34px] fill-white text-white drop-shadow" />}
          label={formatCount(commentCount)}
          onClick={e => { e.stopPropagation(); setShowComments(true); }}
          testId="button-comment"
        />

        {/* Bookmark */}
        <ActionBtn
          icon={<Bookmark className={cn("h-[34px] w-[34px] drop-shadow", saved ? "fill-yellow-400 text-yellow-400" : "fill-white text-white")} />}
          label={formatCount(video.saves)}
          onClick={handleSave}
          testId="button-save"
        />

        {/* Share */}
        <ActionBtn
          icon={<Share2 className="h-[30px] w-[30px] text-white drop-shadow" />}
          label={formatCount(video.shares)}
          onClick={e => { e.stopPropagation(); setShowShare(true); }}
          testId="button-share"
        />

        {/* More */}
        <button
          onClick={e => { e.stopPropagation(); setShowMore(true); }}
          className="flex flex-col items-center"
          data-testid="button-more"
        >
          <MoreHorizontal className="h-7 w-7 text-white drop-shadow" />
        </button>

        {/* Spinning sound disc */}
        <motion.div
          animate={isActive && !paused ? { rotate: 360 } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="w-[42px] h-[42px] rounded-full border-[5px] overflow-hidden flex items-center justify-center"
          style={{ borderColor: "#2a2a2a", background: "radial-gradient(circle at center, #333 30%, #111 100%)" }}
        >
          <div className="w-[16px] h-[16px] rounded-full" style={{ background: pattern.accent }} />
        </motion.div>
      </div>

      {/* ─── BOTTOM TEXT AREA ─────────────────────── */}
      <div
        className="absolute bottom-16 left-0 right-16 px-3 pb-2 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Username */}
        <p className="text-white font-bold text-[15px] mb-1 drop-shadow">
          @{author?.username}
          {author?.isVerified && <span className="ml-1 text-blue-400 text-xs">✓</span>}
        </p>

        {/* Description */}
        <button onClick={() => setDescExpanded(!descExpanded)} className="text-left w-full">
          <p className={cn("text-white text-[13px] leading-[18px] drop-shadow", !descExpanded && "line-clamp-2")}>
            {renderHashtagDescription()}
          </p>
          {!descExpanded && video.description.length > 80 && (
            <span className="text-white/60 text-[13px]"> more</span>
          )}
        </button>

        {/* Sound bar */}
        <div className="flex items-center gap-2 mt-2">
          <Music className="h-3 w-3 text-white flex-shrink-0" />
          <div className="overflow-hidden flex-1" style={{ maxWidth: 220 }}>
            <motion.p
              animate={isActive && !paused ? { x: ["0%", "-50%"] } : { x: "0%" }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              className="text-white text-[12px] whitespace-nowrap drop-shadow"
            >
              {soundName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{soundName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </motion.p>
          </div>
        </div>
      </div>

      {/* ─── VIDEO PROGRESS BAR ──────────────────── */}
      {video.videoUrl && !videoError && (
        <div className="absolute bottom-14 left-0 right-0 h-[2px] bg-white/20 z-10">
          <div
            className="h-full bg-white transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* More options */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-30"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-2xl z-40 pb-8"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
              {[
                { icon: Flag, label: "Not Interested", action: () => { markNotInterested(video.id); setShowMore(false); } },
                { icon: Flag, label: "Report", action: () => setShowMore(false) },
                ...(video.allowDuet ? [{ icon: Copy, label: "Duet", action: () => setShowMore(false) }] : []),
                ...(video.allowStitch ? [{ icon: Scissors, label: "Stitch", action: () => setShowMore(false) }] : []),
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 text-left"
                >
                  <item.icon className="h-5 w-5 text-white/70" />
                  <span className="text-white text-[15px]">{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Comments drawer */}
      {showComments && (
        <div className="absolute inset-0 z-50" onClick={e => e.stopPropagation()}>
          <EtokComments
            video={video}
            currentUserId={currentUserId}
            onClose={() => setShowComments(false)}
            onCommentAdded={() => setCommentCount(c => c + 1)}
          />
        </div>
      )}

      {/* Share sheet */}
      {showShare && (
        <div className="absolute inset-0 z-50" onClick={e => e.stopPropagation()}>
          <EtokShareSheet video={video} currentUserId={currentUserId} onClose={() => setShowShare(false)} />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, testId }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; testId?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
      data-testid={testId}
    >
      {icon}
      <span className="text-white text-[11px] font-semibold drop-shadow">{label}</span>
    </button>
  );
}

function PlusIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
