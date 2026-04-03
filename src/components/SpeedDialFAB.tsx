import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquarePlus, Users, UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpeedDialAction {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  gradient: string;
  shadow: string;
}

const actions: SpeedDialAction[] = [
  {
    icon: MessageSquarePlus,
    label: "New Chat",
    path: "/new-message",
    gradient: "linear-gradient(135deg, hsl(338 90% 63%), hsl(280 80% 63%))",
    shadow: "0 8px 24px hsl(338 90% 63% / 0.45)",
  },
  {
    icon: Users,
    label: "New Group",
    path: "/new-group",
    gradient: "linear-gradient(135deg, hsl(145 65% 45%), hsl(168 70% 42%))",
    shadow: "0 8px 24px hsl(145 65% 45% / 0.4)",
  },
  {
    icon: UserPlus,
    label: "Add Contact",
    path: "/new-contact",
    gradient: "linear-gradient(135deg, hsl(210 90% 58%), hsl(240 80% 62%))",
    shadow: "0 8px 24px hsl(210 90% 58% / 0.4)",
  },
];

export function SpeedDialFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "hsl(222 22% 5% / 0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[90px] right-5 z-50 flex flex-col-reverse items-end gap-3">
        <AnimatePresence>
          {open && actions.map((action, index) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 16, scale: 0.75 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.75 }}
              transition={{ delay: index * 0.06, type: "spring", stiffness: 440, damping: 26 }}
              className="flex items-center gap-3"
            >
              <motion.span
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: index * 0.06 + 0.08 }}
                className="text-[13px] font-semibold px-3.5 py-2 rounded-2xl whitespace-nowrap"
                style={{
                  background: "hsl(var(--card) / 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid hsl(var(--border) / 0.5)",
                  boxShadow: "0 4px 16px hsl(222 22% 0% / 0.3)",
                }}
              >
                {action.label}
              </motion.span>
              <motion.button
                data-testid={`fab-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleAction(action.path)}
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-white"
                style={{ background: action.gradient, boxShadow: action.shadow }}
                whileTap={{ scale: 0.9 }}
              >
                <action.icon className="h-5 w-5" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          data-testid="fab-main"
          onClick={() => setOpen(!open)}
          className="h-14 w-14 rounded-2xl flex items-center justify-center text-white"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: open
              ? "0 4px 20px hsl(338 90% 67% / 0.3)"
              : "0 8px 32px hsl(338 90% 67% / 0.5), 0 0 0 1px hsl(338 90% 67% / 0.2)",
          }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: open ? 45 : 0, scale: open ? 0.95 : 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.button>
      </div>
    </>
  );
}
