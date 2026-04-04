import { useState } from "react";
import { Check, Users, Wallet } from "lucide-react";
import { BillSplit, markMemberPaid } from "@/lib/billSplitService";
import { walletService } from "@/lib/walletService";
import { chatStore } from "@/lib/chatStore";
import { toast } from "sonner";

interface BillSplitCardProps {
  billSplit: BillSplit;
  onUpdate?: () => void;
}

export const BillSplitCard = ({ billSplit, onUpdate }: BillSplitCardProps) => {
  const currentUserId = chatStore.getCurrentUserId();
  const [paying, setPaying] = useState(false);
  const [localSplit, setLocalSplit] = useState(billSplit);

  const myShare = localSplit.splits.find(s => s.userId === currentUserId);
  const paidCount = localSplit.splits.filter(s => s.paid).length;
  const totalCount = localSplit.splits.length;

  const handlePayMyShare = async () => {
    if (!myShare || myShare.paid || !currentUserId) return;
    setPaying(true);
    try {
      const result = await walletService.getWalletBalance();
      if (!result.wallet || result.wallet.balance < myShare.amount) {
        toast.error("Insufficient wallet balance");
        return;
      }
      walletService.deductLocalBalance(myShare.amount);
      markMemberPaid(localSplit.id, currentUserId);
      setLocalSplit(prev => ({
        ...prev,
        splits: prev.splits.map(s =>
          s.userId === currentUserId ? { ...s, paid: true, paidAt: new Date().toISOString() } : s
        ),
      }));
      toast.success(`Paid ${myShare.amount.toLocaleString()} ${localSplit.currency}`);
      onUpdate?.();
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden w-full max-w-[280px]">
      <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-[13px] text-foreground">{localSplit.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {localSplit.totalAmount.toLocaleString()} {localSplit.currency} total
          </p>
        </div>
      </div>

      <div className="px-4 py-2 space-y-1.5">
        {localSplit.splits.map(member => (
          <div key={member.userId} className="flex items-center justify-between">
            <span className="text-[12px] text-foreground truncate flex-1">{member.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-foreground">
                {member.amount.toLocaleString()} {localSplit.currency}
              </span>
              {member.paid ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-emerald-500" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
          <span>{paidCount}/{totalCount} paid</span>
          <span>{Math.round((paidCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(paidCount / totalCount) * 100}%` }}
          />
        </div>

        {myShare && !myShare.paid && (
          <button
            onClick={handlePayMyShare}
            disabled={paying}
            className="mt-3 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2"
            data-testid="button-pay-my-share"
          >
            <Wallet className="h-3.5 w-3.5" />
            {paying ? "Processing…" : `Pay My Share (${myShare.amount.toLocaleString()} ${localSplit.currency})`}
          </button>
        )}
        {myShare?.paid && (
          <div className="mt-3 w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[12px] font-medium text-center">
            ✓ Your share is paid
          </div>
        )}
      </div>
    </div>
  );
};
