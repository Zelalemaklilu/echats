// @ts-nocheck
import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Wallet, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { walletService } from "@/lib/walletService";
import { toast } from "sonner";

interface WalletTermsProps {
  onAccepted: () => void;
  onCancel: () => void;
}

const TERMS_VERSION = "1.0.0";

const WALLET_TERMS = [
  { title: "Real Money Wallet", content: "This wallet represents real monetary value. All balances and transactions are final once confirmed.", icon: Wallet, accent: "text-amber-400 bg-amber-500/10" },
  { title: "Transaction Finality", content: "All completed transactions are irreversible. Sent funds cannot be recalled once confirmed.", icon: AlertTriangle, accent: "text-red-400 bg-red-500/10" },
  { title: "Balance Accuracy", content: "Wallet balances are calculated from verified transaction records. The displayed balance reflects actual available funds.", icon: CheckCircle, accent: "text-emerald-400 bg-emerald-500/10" },
  { title: "User Responsibility", content: "You are fully responsible for verifying recipient details before sending funds. Errors cannot be reversed.", icon: Shield, accent: "text-blue-400 bg-blue-500/10" },
  { title: "No Unauthorized Access", content: "You may only access and operate your own wallet. Any attempt to bypass security will result in immediate suspension.", icon: Shield, accent: "text-purple-400 bg-purple-500/10" },
  { title: "Insufficient Balance", content: "Transactions will automatically fail if the wallet balance is insufficient. No partial sends are processed.", icon: AlertTriangle, accent: "text-orange-400 bg-orange-500/10" },
  { title: "Security & Monitoring", content: "All wallet activity is logged and monitored to prevent fraud, abuse, or unauthorized manipulation.", icon: Shield, accent: "text-blue-400 bg-blue-500/10" },
  { title: "Service Availability", content: "Temporary interruptions may occur due to maintenance or security updates. Funds are always safe.", icon: CheckCircle, accent: "text-emerald-400 bg-emerald-500/10" },
  { title: "Compliance & Suspension", content: "Wallet access may be restricted if suspicious or illegal activity is detected.", icon: Shield, accent: "text-red-400 bg-red-500/10" },
  { title: "Acceptance of Terms", content: "By activating the wallet, you confirm you have read, understood, and agreed to all wallet rules and responsibilities.", icon: CheckCircle, accent: "text-emerald-400 bg-emerald-500/10" },
];

export const WalletTerms = ({ onAccepted, onCancel }: WalletTermsProps) => {
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (!accepted) { toast.error("Please accept the terms and conditions"); return; }
    setIsLoading(true);
    try {
      const result = await walletService.activateWallet();
      if (result.success) {
        toast.success("Wallet activated successfully!");
        onAccepted();
      } else {
        toast.error(result.error || "Failed to activate wallet");
      }
    } catch {
      toast.error("Failed to activate wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-[17px]">Wallet Activation</h1>
            <p className="text-[11px] text-muted-foreground">Terms & Conditions v{TERMS_VERSION}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-4">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-amber-500 text-[14px]">Important Notice</p>
            <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
              This is a <strong className="text-foreground">REAL MONEY</strong> wallet. Please read all terms carefully.
              All transactions are final and cannot be reversed.
            </p>
          </div>
        </div>
      </div>

      {/* Terms list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {WALLET_TERMS.map((term, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 rounded-2xl bg-card border border-border/50 px-4 py-4"
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", term.accent.split(" ")[1])}>
              <term.icon className={cn("h-4.5 w-4.5", term.accent.split(" ")[0])} />
            </div>
            <div>
              <p className="font-semibold text-[14px] text-foreground">{i + 1}. {term.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{term.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Accept section — sticky bottom */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/50 px-4 pt-4 pb-6 space-y-4">
        {/* Custom checkbox */}
        <button
          onClick={() => setAccepted(!accepted)}
          className="flex items-start gap-3 w-full text-left"
          data-testid="checkbox-terms"
        >
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
            accepted ? "bg-primary border-primary" : "border-border"
          )}>
            <AnimatePresence>
              {accepted && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <CheckCircle className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            I have read, understood, and agree to all wallet terms. I understand this wallet handles{" "}
            <strong className="text-foreground">real money</strong> and all transactions are{" "}
            <strong className="text-foreground">final and irreversible</strong>.
          </p>
        </button>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-4 rounded-2xl border border-border font-bold text-[15px] hover:bg-muted transition-colors"
            data-testid="button-cancel-terms"
          >
            Cancel
          </button>
          <button
            onClick={handleActivate}
            disabled={!accepted || isLoading}
            className={cn(
              "flex-1 py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity",
              accepted && !isLoading ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground opacity-50"
            )}
            data-testid="button-activate-wallet"
          >
            {isLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Activating…</>
              : <><Wallet className="h-4 w-4" /> Activate Wallet</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletTerms;
