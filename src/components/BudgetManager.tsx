import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Target, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Lightbulb,
  CheckCircle
} from "lucide-react";
import { Budget } from "./ExpenseTracker";

interface BudgetManagerProps {
  budget: Budget | null;
  onUpdateBudget: (budget: Budget) => void;
  totalExpenses: number;
}

export const BudgetManager = ({ budget, onUpdateBudget, totalExpenses }: BudgetManagerProps) => {
  const [totalAmount, setTotalAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [isEditing, setIsEditing] = useState(!budget);

  useEffect(() => {
    if (budget) {
      setTotalAmount(budget.totalAmount.toString());
      setDuration(budget.duration.toString());
    }
  }, [budget]);

  const handleSaveBudget = () => {
    const amount = parseFloat(totalAmount);
    const days = parseInt(duration);
    
    if (!amount || !days) return;

    const newBudget: Budget = {
      totalAmount: amount,
      duration: days,
      startDate: new Date().toISOString(),
      monthlyLimit: amount / (days / 30)
    };

    onUpdateBudget(newBudget);
    setIsEditing(false);
  };

  const getBudgetStatus = () => {
    if (!budget) return null;

    const remaining = budget.totalAmount - totalExpenses;
    const percentUsed = (totalExpenses / budget.totalAmount) * 100;
    const daysElapsed = Math.floor(
      (new Date().getTime() - new Date(budget.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(0, budget.duration - daysElapsed);
    const dailyBudget = budget.totalAmount / budget.duration;
    const expectedSpent = dailyBudget * daysElapsed;
    const isOverBudget = totalExpenses > expectedSpent;

    return {
      remaining,
      percentUsed,
      daysElapsed,
      daysRemaining,
      dailyBudget,
      expectedSpent,
      isOverBudget,
      dailyRemaining: remaining / Math.max(1, daysRemaining)
    };
  };

  const getSmartTips = () => {
    if (!budget) return [];

    const status = getBudgetStatus();
    if (!status) return [];

    const tips = [];

    if (status.isOverBudget) {
      tips.push({
        icon: AlertTriangle,
        type: "warning",
        title: "Over Budget Alert",
        message: `You're spending ${((totalExpenses / status.expectedSpent - 1) * 100).toFixed(1)}% more than planned. Consider reducing discretionary expenses.`
      });
    }

    if (status.daysRemaining > 0) {
      tips.push({
        icon: Lightbulb,
        type: "info",
        title: "Daily Budget Tip",
        message: `You have $${status.dailyRemaining.toFixed(2)} to spend per day for the remaining ${status.daysRemaining} days.`
      });
    }

    if (status.percentUsed < 50 && status.daysElapsed > budget.duration * 0.5) {
      tips.push({
        icon: CheckCircle,
        type: "success",
        title: "Great Progress!",
        message: "You're doing well with your budget. You might even have some savings this period."
      });
    }

    if (status.percentUsed > 80) {
      tips.push({
        icon: AlertTriangle,
        type: "warning",
        title: "Budget Warning",
        message: "You've used 80% of your budget. Time to be more careful with spending."
      });
    }

    return tips;
  };

  const status = getBudgetStatus();
  const tips = getSmartTips();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Budget Management</h2>
        {budget && !isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="border-border/50"
          >
            Edit Budget
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="bg-gradient-card p-6 border-border/50">
          <h3 className="text-lg font-medium mb-4">Set Your Budget</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalAmount" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Total Budget Amount</span>
              </Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="e.g., 2000"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Budget Duration (Days)</span>
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleSaveBudget}
                className="bg-gradient-primary hover:opacity-90"
              >
                Save Budget
              </Button>
              {budget && (
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-border/50"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : budget && status ? (
        <>
          {/* Budget Overview */}
          <Card className="bg-gradient-primary p-6 border-0 shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-primary-foreground/80 text-sm">Remaining Budget</p>
                <p className="text-3xl font-bold text-primary-foreground">
                  ${status.remaining.toFixed(2)}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary-foreground/80" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-primary-foreground/80">
                <span>Budget Used</span>
                <span>{status.percentUsed.toFixed(1)}%</span>
              </div>
              <Progress 
                value={status.percentUsed} 
                className="h-2 bg-primary-foreground/20"
              />
            </div>
          </Card>

          {/* Budget Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-card p-4 border-border/50">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                  <p className="text-lg font-semibold">{status.daysRemaining}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-card p-4 border-border/50">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Daily Budget</p>
                  <p className="text-lg font-semibold">${status.dailyRemaining.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Budget Analysis */}
          <Card className="bg-gradient-card p-4 border-border/50">
            <h3 className="text-lg font-medium mb-4">Budget Analysis</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Budget</span>
                <span className="font-medium">${budget.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-medium">${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expected Spending</span>
                <span className="font-medium">${status.expectedSpent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center space-x-2">
                  {status.isOverBudget ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="text-destructive font-medium">Over Budget</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-success" />
                      <span className="text-success font-medium">On Track</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Smart Tips */}
          {tips.length > 0 && (
            <Card className="bg-gradient-card p-4 border-border/50">
              <h3 className="text-lg font-medium mb-4">Smart Budget Tips</h3>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <Alert key={index} className={`border-border/50 ${
                    tip.type === 'warning' ? 'border-l-4 border-l-warning' :
                    tip.type === 'success' ? 'border-l-4 border-l-success' :
                    'border-l-4 border-l-accent'
                  }`}>
                    <tip.icon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">{tip.title}</div>
                      <div className="text-sm text-muted-foreground">{tip.message}</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-gradient-card p-8 text-center border-border/50">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Set Your Budget</h3>
          <p className="text-muted-foreground mb-4">
            Define your spending goals and get smart insights to manage your finances better.
          </p>
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Target className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </Card>
      )}
    </div>
  );
};