// @ts-nocheck
import { useState } from "react";
import { X, Users, Receipt, DollarSign } from "lucide-react";
import { createBillSplit } from "@/lib/billSplitService";
import { chatStore } from "@/lib/chatStore";
import { toast } from "sonner";

interface Member {
  userId: string;
  name: string;
  selected: boolean;
}

interface BillSplitCreatorProps {
  chatId: string;
  participants: { userId: string; name: string }[];
  onClose: () => void;
  onCreated: (billSplitId: string) => void;
}

export const BillSplitCreator = ({ chatId, participants, onClose, onCreated }: BillSplitCreatorProps) => {
  const currentUserId = chatStore.getCurrentUserId();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState<Member[]>(
    participants.map(p => ({ ...p, selected: true }))
  );

  const selectedMembers = members.filter(m => m.selected);
  const numeric = parseFloat(amount.replace(/,/g, "")) || 0;
  const perPerson = selectedMembers.length > 0 ? numeric / selectedMembers.length : 0;

  const toggleMember = (userId: string) => {
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, selected: !m.selected } : m));
  };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (numeric <= 0) { toast.error("Please enter a valid amount"); return; }
    if (selectedMembers.length < 2) { toast.error("Select at least 2 members"); return; }
    if (!currentUserId) return;

    const split = createBillSplit(currentUserId, chatId, title.trim(), numeric, selectedMembers);
    toast.success("Bill split created");
    onCreated(split.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full bg-background rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-[17px]">Split Bill</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[12px] text-muted-foreground mb-1.5 font-medium">Title</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Habesha"
              className="w-full bg-muted rounded-2xl px-4 py-3 text-[14px] outline-none placeholder:text-muted-foreground/60"
              data-testid="input-bill-title"
            />
          </div>

          <div>
            <p className="text-[12px] text-muted-foreground mb-1.5 font-medium">Total Amount (ETB)</p>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                className="w-full bg-muted rounded-2xl pl-10 pr-4 py-3 text-[14px] outline-none placeholder:text-muted-foreground/60"
                data-testid="input-bill-amount"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-muted-foreground font-medium">Split Between</p>
              <div className="flex items-center gap-1.5 text-primary">
                <Users className="h-3.5 w-3.5" />
                <span className="text-[12px] font-semibold">{selectedMembers.length} people</span>
              </div>
            </div>
            <div className="space-y-2">
              {members.map(member => (
                <button
                  key={member.userId}
                  onClick={() => toggleMember(member.userId)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-muted/60 hover:bg-muted transition-colors"
                  data-testid={`member-toggle-${member.userId}`}
                >
                  <span className="text-[13px] font-medium">{member.name}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${member.selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                    {member.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {numeric > 0 && selectedMembers.length >= 2 && (
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-center">
              <p className="text-[12px] text-muted-foreground">Each person pays</p>
              <p className="text-[22px] font-bold text-primary mt-0.5">{perPerson.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px]"
            data-testid="button-create-bill-split"
          >
            Create Split
          </button>
        </div>
      </div>
    </div>
  );
};
