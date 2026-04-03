import { useRef, useState, useEffect } from "react";
import { X, Trash2, Send, Loader2, Minus, Plus } from "lucide-react";
import { uploadChatImage } from "@/lib/supabaseStorage";
import { toast } from "sonner";

interface DrawingCanvasProps {
  chatId: string;
  onClose: () => void;
  onSend: (url: string) => void;
}

const COLORS = ["#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#000000"];

export const DrawingCanvas = ({ chatId, onClose, onSend }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [sending, setSending] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || !lastPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#1a1a2e" : color;
    ctx.lineWidth = isEraser ? strokeWidth * 3 : strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { setDrawing(false); lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSend = async () => {
    const canvas = canvasRef.current!;
    setSending(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) { toast.error("Failed to create image"); setSending(false); return; }
        const file = new File([blob], `drawing-${Date.now()}.png`, { type: "image/png" });
        const url = await uploadChatImage(file, chatId);
        if (url) { onSend(url); onClose(); }
        else { toast.error("Failed to upload drawing"); }
        setSending(false);
      }, "image/png");
    } catch { setSending(false); toast.error("Failed to send drawing"); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="h-4 w-4 text-white" />
        </button>
        <p className="text-white font-semibold text-[15px]">Draw</p>
        <button onClick={handleSend} disabled={sending} className="h-9 px-4 rounded-full bg-primary flex items-center gap-2">
          {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
          <span className="text-white text-[13px] font-semibold">Send</span>
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 w-full touch-none cursor-crosshair"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{ cursor: isEraser ? "cell" : "crosshair" }}
        data-testid="drawing-canvas"
      />

      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c && !isEraser ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              data-testid={`color-${c.slice(1)}`}
            />
          ))}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`px-3 h-8 rounded-full text-[12px] font-medium border-2 transition-colors ${isEraser ? "border-white bg-white/20 text-white" : "border-white/30 text-white/60"}`}
          >
            Eraser
          </button>
        </div>
        <div className="flex items-center justify-between px-4">
          <button onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 2))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Minus className="h-3.5 w-3.5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white" style={{ width: strokeWidth * 2, height: strokeWidth * 2 }} />
            <span className="text-white text-[13px]">{strokeWidth}px</span>
          </div>
          <button onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 2))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 text-white" />
          </button>
          <button onClick={clearCanvas} className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
