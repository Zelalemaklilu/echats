// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type AvailabilityStatus = "online" | "away" | "busy" | "invisible";

const KEY = "echat_my_status";

export const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; dot: string }> = {
  online:    { label: "Online",    color: "text-emerald-400", dot: "bg-emerald-400" },
  away:      { label: "Away",      color: "text-yellow-400",  dot: "bg-yellow-400"  },
  busy:      { label: "Busy",      color: "text-red-400",     dot: "bg-red-400"     },
  invisible: { label: "Invisible", color: "text-gray-400",    dot: "bg-gray-400"    },
};

export function getMyStatus(): AvailabilityStatus {
  return (localStorage.getItem(KEY) as AvailabilityStatus) || "online";
}

export async function setMyStatus(status: AvailabilityStatus): Promise<void> {
  localStorage.setItem(KEY, status);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ is_online: status !== "invisible" }).eq("id", user.id);
}
