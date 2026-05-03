// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { sendWebRTCSignal, subscribeToWebRTCSignals } from "@/lib/etokLiveService";
import { getEtokIceServers } from "@/lib/etokIceServers";

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.l.google.com:19302" },
];

interface BroadcastOptions {
  streamId: string | undefined;
  userId: string;
  isHost: boolean;
  hostId?: string;
}

/**
 * WebRTC mesh broadcast for Etok Live.
 * - Host: captures camera/mic, listens for "request" signals from viewers, sends offer + ICE.
 * - Viewer: on mount sends "request" to host, accepts offer, replies with answer + ICE.
 */
export function useEtokLiveBroadcast({ streamId, userId, isHost, hostId }: BroadcastOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // host: viewerId -> pc;  viewer: hostId -> pc
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Attach a stream to the video element
  const attachStream = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  };

  /* ─── HOST ─── */
  useEffect(() => {
    if (!streamId || !isHost || !userId) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: "user" },
          audio: true,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        attachStream(stream);
        setIsConnected(true);
      } catch (err: any) {
        console.error("[Broadcast] host getUserMedia failed:", err);
        setError(err?.message ?? "Camera permission denied");
      }
    })();

    const unsub = subscribeToWebRTCSignals(userId, async (sig) => {
      if (sig.streamId !== streamId) return;

      if (sig.signalType === "request") {
        // Viewer wants to join → create new RTCPeerConnection and send offer
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peersRef.current.set(sig.fromUserId, pc);

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
        }

        pc.onicecandidate = (e) => {
          if (e.candidate) sendWebRTCSignal(streamId, userId, sig.fromUserId, "ice", e.candidate.toJSON());
        };
        pc.onconnectionstatechange = () => {
          if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
            pc.close();
            peersRef.current.delete(sig.fromUserId);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendWebRTCSignal(streamId, userId, sig.fromUserId, "offer", offer);
      } else if (sig.signalType === "answer") {
        const pc = peersRef.current.get(sig.fromUserId);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
      } else if (sig.signalType === "ice") {
        const pc = peersRef.current.get(sig.fromUserId);
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload)); } catch {}
        }
      }
    });

    return () => {
      cancelled = true;
      unsub();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      setIsConnected(false);
    };
  }, [streamId, isHost, userId]);

  /* ─── VIEWER ─── */
  useEffect(() => {
    if (!streamId || isHost || !userId || !hostId) return;
    let cancelled = false;
    let pc: RTCPeerConnection | null = null;

    const unsub = subscribeToWebRTCSignals(userId, async (sig) => {
      if (sig.streamId !== streamId) return;

      if (sig.signalType === "offer") {
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peersRef.current.set(hostId, pc);

        const remoteStream = new MediaStream();
        attachStream(remoteStream);

        pc.ontrack = (e) => {
          e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
          setIsConnected(true);
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) sendWebRTCSignal(streamId, userId, hostId, "ice", e.candidate.toJSON());
        };
        pc.onconnectionstatechange = () => {
          if (pc && ["disconnected", "failed", "closed"].includes(pc.connectionState)) {
            setIsConnected(false);
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        await sendWebRTCSignal(streamId, userId, hostId, "answer", ans);
      } else if (sig.signalType === "ice" && pc?.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload)); } catch {}
      }
    });

    // Ask the host to start the offer once subscription is up
    const t = setTimeout(() => {
      if (!cancelled) sendWebRTCSignal(streamId, userId, hostId, "request", {});
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
      unsub();
      pc?.close();
      peersRef.current.forEach(p => p.close());
      peersRef.current.clear();
      setIsConnected(false);
    };
  }, [streamId, isHost, userId, hostId]);

  return { videoRef, error, isConnected, viewerCount: peersRef.current.size };
}
