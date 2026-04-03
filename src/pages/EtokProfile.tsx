import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Settings, Pin, PinOff, Share2, MessageSquare, Edit3, Link, CheckCircle2, BarChart2, Lock, Grid3X3, Heart, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  getAllUsers, getUserById, getUserVideos, getFollowers, getFollowing,
  isFollowing, toggleFollow, getSavedVideos, getRepostedVideos,
  pinVideo, unpinVideo, recordProfileView,
  formatCount, type EtokUser, type EtokVideo,
} from "@/lib/etokService";
import { getSeries } from "@/lib/etokCreatorService";
import { blockUser } from "@/lib/etokPrivacyService";
import { EtokBottomNav } from "@/components/etok/EtokBottomNav";

type ProfileTab = "videos" | "likes" | "favorites";

const EtokProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? "u5";

  const resolvedId = userId ?? currentUserId;
  const isOwn = resolvedId === currentUserId;

  const [profile, setProfile] = useState<EtokUser | undefined>(() => getUserById(resolvedId));
  const [following, setFollowingState] = useState(() => isFollowing(currentUserId, resolvedId));
  const [activeTab, setActiveTab] = useState<ProfileTab>("videos");
  const [showMore, setShowMore] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const [editName, setEditName] = useState(profile?.displayName ?? "");
  const [editUsername, setEditUsername] = useState(profile?.username ?? "");
  const [editBio, setEditBio] = useState(profile?.bio ?? "");

  const videos = getUserVideos(resolvedId);
  const pinnedIds = profile?.pinnedVideoIds ?? [];
  const savedVideos = isOwn ? getSavedVideos(currentUserId) : [];

  const followersCount = profile?.followers ?? 0;
  const followingCount = profile?.following ?? 0;
  const likesCount = profile?.totalLikes ?? 0;

  useEffect(() => {
    if (!isOwn) recordProfileView(currentUserId, resolvedId);
    setProfile(getUserById(resolvedId));
  }, [resolvedId]);

  const handleFollow = () => {
    const f = toggleFollow(currentUserId, resolvedId);
    setFollowingState(f);
    setProfile(getUserById(resolvedId));
  };

  const handlePin = (videoId: string) => {
    if (pinnedIds.includes(videoId)) unpinVideo(currentUserId, videoId);
    else pinVideo(currentUserId, videoId);
    setProfile(getUserById(resolvedId));
  };

  const VideoGrid = ({ vids }: { vids: EtokVideo[] }) => (
    <>
      {vids.length === 0 ? (
        <div className="col-span-3 flex flex-col items-center justify-center py-20 text-white/40">
          <Lock className="h-8 w-8 mb-3" />
          <p className="text-sm">No videos yet</p>
        </div>
      ) : (
        vids.map(v => (
          <button
            key={v.id}
            onClick={() => navigate("/etok")}
            className="relative aspect-[9/16] overflow-hidden rounded-sm bg-black"
          >
            {v.videoUrl ? (
              <video
                src={v.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                preload="metadata"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-b", v.thumbnailColor, "flex items-center justify-center")}>
                <span className="text-4xl">{v.thumbnailEmoji}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
            <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
              <svg className="h-3 w-3 text-white fill-white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              <span className="text-white text-[10px] font-medium">{formatCount(v.views)}</span>
            </div>
            {pinnedIds.includes(v.id) && (
              <div className="absolute top-1 left-1 bg-[#ff0050]/80 rounded px-1 flex items-center gap-0.5">
                <Pin className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            {isOwn && (
              <button
                onClick={e => { e.stopPropagation(); handlePin(v.id); }}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
              >
                {pinnedIds.includes(v.id) ? <PinOff className="h-3 w-3 text-white" /> : <Pin className="h-3 w-3 text-white/60" />}
              </button>
            )}
          </button>
        ))
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black z-20 flex items-center justify-between px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>
        <span className="font-bold text-[16px]">@{profile?.username}</span>
        <div className="flex items-center gap-3">
          {isOwn && (
            <button onClick={() => navigate("/etok/analytics")}>
              <BarChart2 className="h-5 w-5 text-white/70" />
            </button>
          )}
          <button onClick={() => setShowMore(true)}>
            <MoreHorizontal className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto pb-24">
        {/* Profile header */}
        <div className="flex flex-col items-center pt-4 pb-5 px-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-5xl mb-3">
            {profile?.avatar ?? "👤"}
          </div>

          {/* Name + badges */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-[18px]">{profile?.displayName}</span>
            {profile?.isVerified && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
            {profile?.isBusinessAccount && (
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">Biz</span>
            )}
          </div>
          <p className="text-white/60 text-[13px] mb-3">@{profile?.username}</p>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-5">
            {[
              { label: "Following", value: formatCount(followingCount) },
              { label: "Followers", value: formatCount(followersCount) },
              { label: "Likes", value: formatCount(likesCount) },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="font-bold text-[18px]">{s.value}</span>
                <span className="text-white/50 text-[12px]">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile?.bio && (
            <button onClick={() => setBioExpanded(!bioExpanded)} className="mb-3 text-center max-w-xs">
              <p className={cn("text-white/80 text-[13px] leading-relaxed", !bioExpanded && "line-clamp-2")}>
                {profile.bio}
              </p>
            </button>
          )}

          {/* Links */}
          {(profile?.links?.instagram || profile?.links?.youtube) && (
            <div className="flex items-center gap-1.5 mb-4 text-[#ff0050] text-[13px]">
              <Link className="h-3.5 w-3.5" />
              {profile.links.instagram && <span>@{profile.links.instagram}</span>}
              {profile.links.youtube && <span>@{profile.links.youtube}</span>}
            </div>
          )}

          {/* Action buttons */}
          {isOwn ? (
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 py-2 rounded-lg border border-white/20 text-white font-semibold text-[14px]"
              >
                Edit profile
              </button>
              <button
                onClick={() => navigate("/etok/settings")}
                className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center"
              >
                <Settings className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={handleFollow}
                className={cn(
                  "flex-1 py-2.5 rounded-lg font-bold text-[14px] transition-colors",
                  following ? "border border-white/20 text-white" : "bg-[#ff0050] text-white"
                )}
              >
                {following ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => navigate("/chats")}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-white font-semibold text-[14px] flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </button>
              <button className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {[
            { id: "videos" as ProfileTab, icon: Grid3X3 },
            { id: "likes" as ProfileTab, icon: Heart },
            ...(isOwn ? [{ id: "favorites" as ProfileTab, icon: Bookmark }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("flex-1 flex items-center justify-center py-3 border-b-[2px] transition-colors", activeTab === tab.id ? "border-white" : "border-transparent")}
            >
              <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-white" : "text-white/40")} />
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-3 gap-[1.5px]">
          {activeTab === "videos" && <VideoGrid vids={videos} />}
          {activeTab === "likes" && (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-white/40">
              <Lock className="h-8 w-8 mb-3" />
              <p className="text-sm">Liked videos are private</p>
            </div>
          )}
          {activeTab === "favorites" && isOwn && <VideoGrid vids={savedVideos} />}
        </div>
      </div>

      {/* More options */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowMore(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-2xl z-50 pb-8"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
              {isOwn ? (
                <>
                  <button onClick={() => { setShowEdit(true); setShowMore(false); }} className="flex items-center gap-4 w-full px-6 py-4">
                    <Edit3 className="h-5 w-5 text-white/70" />
                    <span className="text-white text-[15px]">Edit profile</span>
                  </button>
                  <button onClick={() => { navigate("/etok/settings"); setShowMore(false); }} className="flex items-center gap-4 w-full px-6 py-4">
                    <Settings className="h-5 w-5 text-white/70" />
                    <span className="text-white text-[15px]">Privacy settings</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { blockUser(currentUserId, resolvedId); setShowMore(false); toast.success("User blocked"); }} className="flex items-center gap-4 w-full px-6 py-4">
                    <span className="text-red-400 text-[15px]">Block @{profile?.username}</span>
                  </button>
                  <button onClick={() => setShowMore(false)} className="flex items-center gap-4 w-full px-6 py-4">
                    <span className="text-red-400 text-[15px]">Report</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit profile sheet */}
      <AnimatePresence>
        {showEdit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowEdit(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 bg-[#111] rounded-t-2xl z-50 pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <button onClick={() => setShowEdit(false)} className="text-white/60 text-[15px]">Cancel</button>
                <span className="text-white font-bold text-[16px]">Edit profile</span>
                <button onClick={() => { toast.success("Profile updated!"); setShowEdit(false); }} className="text-[#ff0050] font-bold text-[15px]">Save</button>
              </div>

              <div className="flex justify-center py-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-5xl">
                    {profile?.avatar}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ff0050] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Change</div>
                </div>
              </div>

              <div className="px-4 space-y-0 divide-y divide-white/10">
                {[
                  { label: "Name", value: editName, setter: setEditName, placeholder: "Add name" },
                  { label: "Username", value: editUsername, setter: setEditUsername, placeholder: "Add username" },
                  { label: "Bio", value: editBio, setter: setEditBio, placeholder: "Add bio" },
                  { label: "Instagram", value: "", setter: () => {}, placeholder: "@username" },
                  { label: "YouTube", value: "", setter: () => {}, placeholder: "@channel" },
                ].map(field => (
                  <div key={field.label} className="flex items-center gap-4 py-3.5">
                    <span className="text-white/50 text-[14px] w-20 flex-shrink-0">{field.label}</span>
                    <input
                      value={field.value}
                      onChange={e => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 bg-transparent text-white text-[14px] outline-none placeholder:text-white/20"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <EtokBottomNav />
    </div>
  );
};

export default EtokProfile;
