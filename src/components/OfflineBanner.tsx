// @ts-nocheck
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const OfflineBanner = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/30 w-full z-50">
      <WifiOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
        You're offline — showing cached content
      </span>
    </div>
  );
};

export default OfflineBanner;
