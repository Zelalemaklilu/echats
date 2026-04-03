// @ts-nocheck
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff, Users, ExternalLink } from "lucide-react";
import { getJitsiUrl } from "@/lib/groupCallService";

const GroupCall = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const jitsiUrl = getJitsiUrl(roomId || "echat-room");

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold">Group Call</p>
            <p className="text-white/50 text-[11px]">Room: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ExternalLink className="h-4 w-4 text-white" />
          </a>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center"
            data-testid="button-leave-group-call"
          >
            <PhoneOff className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <iframe
        src={jitsiUrl}
        className="flex-1 w-full border-0"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        title="Group Video Call"
        data-testid="iframe-group-call"
      />
    </div>
  );
};

export default GroupCall;
