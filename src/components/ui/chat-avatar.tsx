import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "away" | "busy" | "offline";
  className?: string;
}

export function ChatAvatar({ src, name, size = "md", status, className }: ChatAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-32 w-32"
  };

  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size], "border border-border")}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status && (
        <div className={cn("absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background", dotSize)}>
          {status === "online" ? (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-status-online"
                animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 rounded-full bg-status-online" />
            </>
          ) : (
            <div className={cn("w-full h-full rounded-full", {
              "bg-status-away":    status === "away",
              "bg-red-500":        status === "busy",
              "bg-status-offline": status === "offline",
            })} />
          )}
        </div>
      )}
    </div>
  );
}
