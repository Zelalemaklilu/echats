// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { Heart, Pin, Trash2, CornerDownRight, X, SmilePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type EtokVideo, type EtokComment,
  fetchComments, addCommentAsync, deleteCommentAsync, formatCount,
} from "@/lib/etokService";

const QUICK_EMOJI = ["❤️", "🔥", "😂", "👏", "😍", "🎉", "💯", "🙌"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

interface EtokCommentsProps {
  video: EtokVideo;
  currentUserId: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function EtokComments({ video, currentUserId, onClose, onCommentAdded }: EtokCommentsProps) {
  const [comments, setComments] = useState<EtokComment[]>([]);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<EtokComment | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadComments = async () => {
    const data = await fetchComments(video.id);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => { loadComments(); }, [video.id]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t) return;
    await addCommentAsync(video.id, currentUserId, t, replyingTo?.id);
    setText("");
    setReplyingTo(null);
    setShowEmoji(false);
    await loadComments();
    onCommentAdded?.();
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const handleDelete = async (commentId: string) => {
    await deleteCommentAsync(commentId);
    await loadComments();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="absolute inset-0 z-50 flex flex-col justify-end"
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-[#1a1a1a] rounded-t-2xl flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0">
          <div />
          <p className="text-white font-bold text-[15px]" data-testid="text-comment-count">
            {formatCount(comments.length)} {comments.length === 1 ? "comment" : "comments"}
          </p>
          <button onClick={onClose} data-testid="button-close-comments">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-white font-semibold text-[15px]">No comments yet</p>
              <p className="text-white/40 text-[13px] mt-1">Be the first to comment!</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {comments.map(c => {
              const isOwn = c.authorId === currentUserId;
              const isVideoOwner = video.authorId === currentUserId;
              const commentLiked = likedIds.has(c.id);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {c.author?.avatar ? (
                      <img src={c.author.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white font-semibold text-[13px]">{c.author?.username ?? "Unknown"}</span>
                      {c.isPinned && (
                        <span className="flex items-center gap-0.5 text-[#ff0050] text-[10px] font-semibold">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-white/90 text-[13px] mt-0.5 leading-relaxed">{c.text}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-white/40 text-[11px]">{timeAgo(c.createdAt)}</span>
                      <button
                        onClick={() => {
                          setReplyingTo(c);
                          setText(`@${c.author?.username ?? ""} `);
                          inputRef.current?.focus();
                        }}
                        className="text-white/50 text-[11px] font-semibold active:text-white"
                      >
                        Reply
                      </button>
                      {(isOwn || isVideoOwner) && (
                        <button onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3 text-white/40 active:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setLikedIds(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                    className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5"
                  >
                    <Heart className={cn("h-4 w-4 transition-colors", commentLiked ? "fill-[#ff0050] text-[#ff0050]" : "text-white/40")} />
                    {c.likes > 0 && <span className="text-white/40 text-[10px]">{c.likes}</span>}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-3 px-4 py-2 border-t border-white/10 overflow-hidden flex-shrink-0"
            >
              {QUICK_EMOJI.map(e => (
                <button key={e} onClick={() => setText(t => t + e)} className="text-2xl active:scale-125 transition-transform">{e}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-white/60 text-[12px]">
              <CornerDownRight className="h-3 w-3" />
              Replying to @{replyingTo.author?.username ?? "user"}
            </div>
            <button onClick={() => { setReplyingTo(null); setText(""); }}>
              <X className="h-4 w-4 text-white/40" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10 pb-6 flex-shrink-0">
          <button onClick={() => setShowEmoji(!showEmoji)}>
            <SmilePlus className={cn("h-6 w-6 transition-colors", showEmoji ? "text-[#ff0050]" : "text-white/50")} />
          </button>
          <div className="flex-1 bg-white/10 rounded-full px-4 py-2.5 flex items-center gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Add comment..."
              className="flex-1 bg-transparent text-white text-[14px] outline-none placeholder:text-white/30"
              data-testid="input-comment"
            />
            {text.trim() && (
              <button onClick={handleSend} className="text-[#ff0050] font-bold text-[14px] flex-shrink-0" data-testid="button-post-comment">
                Post
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
