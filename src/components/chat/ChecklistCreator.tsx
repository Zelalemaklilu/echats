import { useState } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ChecklistCreatorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (title: string, items: string[]) => void;
}

export const ChecklistCreator = ({ open, onClose, onConfirm }: ChecklistCreatorProps) => {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<string[]>(["", ""]);

  const addItem = () => setItems(prev => [...prev, ""]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => setItems(prev => prev.map((v, i) => i === idx ? val : v));

  const handleConfirm = () => {
    const validItems = items.filter(i => i.trim());
    if (!title.trim()) return toast.error("Please enter a title");
    if (validItems.length === 0) return toast.error("Add at least one item");
    onConfirm(title.trim(), validItems);
    setTitle("");
    setItems(["", ""]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Create Checklist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Shopping list, Tasks..."
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label>Items</Label>
            <div className="space-y-2 mt-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-muted-foreground text-sm w-5 shrink-0">{idx + 1}.</span>
                  <Input
                    value={item}
                    onChange={e => updateItem(idx, e.target.value)}
                    placeholder={`Item ${idx + 1}`}
                    className="flex-1"
                    onKeyDown={e => {
                      if (e.key === "Enter") addItem();
                    }}
                  />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-1" onClick={addItem}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Send Checklist</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
