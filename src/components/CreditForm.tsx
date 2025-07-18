import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Banknote } from "lucide-react";

interface CreditFormProps {
  onSubmit: (amount: number, description: string) => void;
  onClose: () => void;
}

export const CreditForm = ({ onSubmit, onClose }: CreditFormProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const creditAmount = parseFloat(amount);
    if (!creditAmount || creditAmount <= 0) return;

    onSubmit(creditAmount, description);
    setAmount("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gradient-card border-border/50">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <Banknote className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold">Add Credit</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium">
              Credit Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 500"
              className="bg-background/50 border-border/50"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Salary, Gift money, Refund..."
              className="bg-background/50 border-border/50 resize-none"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Credit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border/50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};