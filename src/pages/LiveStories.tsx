import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Radio, Users, MessageCircle, Heart, Send, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActiveLiveStories,
  startLiveStory,
  endLiveStory,
  joinLiveStory,
  leaveLiveStory,
  getLiveComments,
  addLiveComment,
  type LiveStory,
  type LiveComment,
} from "@/lib/liveStoryService";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const LiveStories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState<LiveStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<LiveStory | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [myLiveStory, setMyLiveStory] = useState<LiveStory | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [reactionAnims, setReactionAnims] = useState<{ id: string; emoji: string }[]>([]);
  const [storyReactions, setStoryReactions] = useState<Record<string, number>>({});
  const [replyText, setReplyText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStories();
    loadProfile();
    const interval = setInterval(loadStories, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStory) {
      const interval = setInterval(() => {
        setComments(getLiveComments(selectedStory.id));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedStory]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("username,avatar_url").eq("id", user.id).single();
    if (data) {
      setUsername(data.username || "");
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const loadStories = () => {
    setStories(getActiveLiveStories());
  };

  const handleJoin = (story: LiveStory) => {
    joinLiveStory(story.id);
    setSelectedStory(story);
    setComments(getLiveComments(story.id));
  };

  const handleLeave = () => {
    if (selectedStory) leaveLiveStory(selectedStory.id);
    setSelectedStory(null);
    setComments([]);
  };

  const handleSendComment = () => {
    if (!commentText.trim() || !selectedStory || !user) return;
    addLiveComment(selectedStory.id, user.id, username || "User", commentText.trim());
    setCommentText("");
    setComments(getLiveComments(selectedStory.id));
  };

  const handleStartLive = () => {
    if (!liveTitle.trim()) return toast.error("Please enter a title");
    if (!user) return;
    const story = startLiveStory(user.id, username || "You", liveTitle, avatarUrl);
    setMyLiveStory(story);
    setShowStartDialog(false);
    setLiveTitle("");
    loadStories();
    toast.success("You're now Live! 🔴");
  };

  const handleEndLive = () => {
    if (myLiveStory) {
      endLiveStory(myLiveStory.id);
      setMyLiveStory(null);
      loadStories();
      toast.success("Live stream ended.");
    }
  };

  const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

  const handleReaction = (emoji: string) => {
    if (!selectedStory) return;
    const animId = `${Date.now()}_${Math.random()}`;
    setReactionAnims(prev => [...prev, { id: animId, emoji }]);
    setStoryReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    const key = `echat_story_reactions_${selectedStory.id}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[emoji] = (existing[emoji] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(existing));
    setTimeout(() => setReactionAnims(prev => prev.filter(a => a.id !== animId)), 1500);
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedStory || !user) return;
    addLiveComment(selectedStory.id, user.id, username || "User", `💬 ${replyText.trim()}`);
    setReplyText("");
    setComments(getLiveComments(selectedStory.id));
    toast.success("Reply sent!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Live Stories</h1>
          <p className="text-xs text-muted-foreground">{stories.length} live now</p>
        </div>
        {!myLiveStory ? (
          <Button size="sm" className="gap-1.5 bg-red-500 hover:bg-red-600" onClick={() => setShowStartDialog(true)}>
            <Radio className="h-4 w-4" />
            Go Live
          </Button>
        ) : (
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleEndLive}>
            <Radio className="h-4 w-4 animate-pulse" />
            End Live
          </Button>
        )}
      </div>

      {myLiveStory && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-500">You are LIVE</span>
            <span className="text-sm text-muted-foreground">— {myLiveStory.title}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Eye className="h-3 w-3" />
            {myLiveStory.viewerCount} viewers
          </div>
        </div>
      )}

      {!selectedStory ? (
        <div className="flex-1 overflow-y-auto p-4">
          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <Radio className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-muted-foreground">No live streams</p>
                <p className="text-sm text-muted-foreground">Be the first to go live!</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {stories.map(story => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleJoin(story)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-red-500">
                      <AvatarImage src={story.avatarUrl} />
                      <AvatarFallback>{(story.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-1 -right-1 h-5 px-1 bg-red-500 text-[10px] gap-0.5">
                      <Radio className="h-2.5 w-2.5" />
                      LIVE
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{story.username}</p>
                    <p className="text-sm text-muted-foreground truncate">{story.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {story.viewerCount}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="bg-black relative flex-1 flex items-center justify-center min-h-48">
            <div className="text-center text-white/60">
              <Radio className="h-16 w-16 mx-auto mb-3 animate-pulse text-red-500" />
              <p className="font-semibold">{selectedStory.title}</p>
              <p className="text-sm opacity-70">{selectedStory.username} is live</p>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge className="bg-red-500 gap-1">
                <Radio className="h-3 w-3" />
                LIVE
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Eye className="h-3 w-3" />
                {selectedStory.viewerCount}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3"
              onClick={handleLeave}
            >
              Leave
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-48">
            <AnimatePresence>
              {comments.map(c => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2"
                >
                  <span className="font-semibold text-xs text-primary shrink-0">{c.username}:</span>
                  <span className="text-sm">{c.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={commentsEndRef} />
          </div>

          {/* Emoji reactions bar */}
          <div className="border-t border-border/50 px-4 py-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {["❤️", "😂", "😮", "😢", "🔥", "👏"].map(emoji => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 1.4 }}
                    onClick={() => handleReaction(emoji)}
                    className="text-xl active:scale-125 transition-transform"
                  >
                    {emoji}
                    {storyReactions[emoji] ? (
                      <span className="text-[10px] text-muted-foreground ml-0.5">{storyReactions[emoji]}</span>
                    ) : null}
                  </motion.button>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {reactionAnims.map(anim => (
                <motion.div
                  key={anim.id}
                  initial={{ opacity: 1, y: 0, x: Math.random() * 40 - 20, scale: 1 }}
                  animate={{ opacity: 0, y: -60, scale: 1.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute bottom-4 left-1/2 pointer-events-none text-2xl"
                  style={{ zIndex: 10 }}
                >
                  {anim.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Reply + comment bar */}
          <div className="border-t border-border/50 p-3 flex gap-2">
            <div className="flex gap-2 flex-1">
              <Input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Reply to story..."
                className="flex-1 text-[13px]"
                onKeyDown={e => e.key === "Enter" && handleReply()}
              />
              <Button size="icon" variant="outline" onClick={handleReply} disabled={!replyText.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Comment..."
              className="flex-1 text-[13px]"
              onKeyDown={e => e.key === "Enter" && handleSendComment()}
            />
            <Button size="icon" onClick={handleSendComment} disabled={!commentText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" />
              Start Live Story
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Stream Title</Label>
              <Input
                value={liveTitle}
                onChange={e => setLiveTitle(e.target.value)}
                placeholder="What are you sharing?"
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancel</Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={handleStartLive}>
              Go Live 🔴
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveStories;
