import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Expense, Category } from "./ExpenseTrackerWithAuth";
import { TrendingDown, TrendingUp, Filter, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'credit';
  category?: string;
  date: string;
  description?: string;
}

interface TransactionListProps {
  expenses: Expense[];
  categories: Category[];
  credits: Array<{ amount: number; date: string; description?: string }>;
}

export const TransactionList = ({ expenses, categories, credits }: TransactionListProps) => {
  const [filter, setFilter] = useState<"all" | "expenses" | "credits">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Convert expenses and credits to unified transaction format
  const transactions: Transaction[] = [
    ...expenses.map(expense => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      type: 'expense' as const,
      category: expense.category,
      date: expense.date,
      description: expense.description
    })),
    ...credits.map((credit, index) => ({
      id: `credit-${index}-${credit.date}`,
      title: credit.description || "Budget Credit",
      amount: credit.amount,
      type: 'credit' as const,
      date: credit.date,
      description: credit.description
    }))
  ];

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "expenses") return transaction.type === "expense";
    if (filter === "credits") return transaction.type === "credit";
    return true;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return b.amount - a.amount;
    }
  });

  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return "💰";
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || "📦";
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <Card className="bg-gradient-card p-4 border-border/50">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-lg font-semibold text-destructive">₹{totalExpenses.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-lg font-semibold text-success">₹{totalCredits.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Select value={filter} onValueChange={(value: "all" | "expenses" | "credits") => setFilter(value)}>
            <SelectTrigger className="w-32 bg-background/50 border-border/50">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span className="capitalize">{filter}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="credits">Credits</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: "date" | "amount") => setSortBy(value)}>
            <SelectTrigger className="w-32 bg-background/50 border-border/50">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span className="capitalize">{sortBy}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Transaction List */}
      <Card className="bg-gradient-card p-4 border-border/50">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions found</p>
            </div>
          ) : (
            sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-background/20 rounded-lg hover:bg-background/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {transaction.type === 'credit' ? '💰' : getCategoryIcon(transaction.category)}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{transaction.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span>{transaction.category}</span>
                        </>
                      )}
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold text-sm ${
                      transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.type}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};