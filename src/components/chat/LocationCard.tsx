// @ts-nocheck
import { MapPin, ExternalLink, Clock } from "lucide-react";

interface LocationCardProps {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  expiresAt?: number;
  isOwn?: boolean;
}

export default function LocationCard({ latitude, longitude, lat, lng, expiresAt, isOwn }: LocationCardProps) {
  const finalLat = lat ?? latitude ?? 0;
  const finalLng = lng ?? longitude ?? 0;
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${finalLat},${finalLng}&zoom=14&size=280x120&markers=${finalLat},${finalLng},red-pushpin`;
  const mapsLink = `https://www.google.com/maps?q=${finalLat},${finalLng}`;
  const now = Date.now();
  const isLive = expiresAt && expiresAt > now;
  const minutesLeft = isLive ? Math.round((expiresAt - now) / 60000) : 0;

  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/50 w-[240px]">
      <div className="relative">
        <img
          src={staticMapUrl}
          alt="Location map"
          className="w-full h-[110px] object-cover"
          onError={e => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            el.parentElement!.style.height = "40px";
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </div>
        {isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] text-white font-bold">LIVE</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-foreground">{isLive ? "Live Location" : "Location"}</p>
          {isLive && minutesLeft > 0 ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{minutesLeft}m remaining</span>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground mt-0.5">{finalLat.toFixed(5)}, {finalLng.toFixed(5)}</p>
          )}
        </div>
        <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <ExternalLink className="h-3.5 w-3.5 text-primary" />
        </a>
      </div>
    </div>
  );
}
