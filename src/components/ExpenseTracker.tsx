import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, TrendingUp, Wallet, Target } from "lucide-react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseChart } from "@/components/ExpenseChart";
import { CategoryList } from "@/components/CategoryList";
import { BudgetManager } from "@/components/BudgetManager";
import { useToast } from "@/hooks/use-toast";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Budget {
  totalAmount: number;
  duration: number; // in days
  startDate: string;
  monthlyLimit?: number;
}

const defaultCategories: Category[] = [
  { id: "food", name: "Food & Dining", color: "category-food", icon: "🍕" },
  { id: "transport", name: "Transport", color: "category-transport", icon: "🚗" },
  { id: "entertainment", name: "Entertainment", color: "category-entertainment", icon: "🎬" },
  { id: "shopping", name: "Shopping", color: "category-shopping", icon: "🛍️" },
  { id: "health", name: "Health", color: "category-health", icon: "⚕️" },
  { id: "bills", name: "Bills & Utilities", color: "category-bills", icon: "💡" },
  { id: "other", name: "Other", color: "category-other", icon: "📦" },
];

export const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "expenses" | "categories" | "budget">("dashboard");
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenseTracker_expenses");
    const savedCategories = localStorage.getItem("expenseTracker_categories");
    const savedBudget = localStorage.getItem("expenseTracker_budget");

    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    if (savedBudget) {
      setBudget(JSON.parse(savedBudget));
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("expenseTracker_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("expenseTracker_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (budget) {
      localStorage.setItem("expenseTracker_budget", JSON.stringify(budget));
    }
  }, [budget]);

  const addExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };
    setExpenses([newExpense, ...expenses]);
    setShowExpenseForm(false);
    
    toast({
      title: "Expense Added",
      description: `${expenseData.title} - $${expenseData.amount}`,
    });

    // Check budget warnings
    if (budget) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      });
      
      const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0) + expenseData.amount;
      const monthlyBudget = budget.totalAmount / (budget.duration / 30);
      
      if (monthlyTotal > monthlyBudget * 0.9) {
        toast({
          title: "Budget Warning",
          description: "You're approaching your monthly budget limit!",
          variant: "destructive",
        });
      }
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentBalance = budget ? budget.totalAmount - totalExpenses : 0;

  const getDashboardStats = () => {
    const today = new Date();
    const thisMonth = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === today.getMonth() && 
             expenseDate.getFullYear() === today.getFullYear();
    });
    
    const thisWeek = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= weekAgo;
    });

    return {
      monthlyTotal: thisMonth.reduce((sum, expense) => sum + expense.amount, 0),
      weeklyTotal: thisWeek.reduce((sum, expense) => sum + expense.amount, 0),
      monthlyCount: thisMonth.length,
      weeklyCount: thisWeek.length,
    };
  };

  const stats = getDashboardStats();

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Balance Overview */}
      <Card className="bg-gradient-primary p-6 border-0 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">Current Balance</p>
            <p className="text-3xl font-bold text-primary-foreground">
              ${currentBalance.toFixed(2)}
            </p>
          </div>
          <Wallet className="h-8 w-8 text-primary-foreground/80" />
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-card p-4 border-border/50">
          <div className="flex items-center space-x-3">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-semibold">${stats.monthlyTotal.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.monthlyCount} expenses</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card p-4 border-border/50">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-lg font-semibold">${stats.weeklyTotal.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.weeklyCount} expenses</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <Button 
          onClick={() => setShowExpenseForm(true)}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Expense
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView("expenses")}
            className="border-border/50"
          >
            View All Expenses
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView("budget")}
            className="border-border/50"
          >
            <Target className="mr-2 h-4 w-4" />
            Manage Budget
          </Button>
        </div>
      </div>

      {/* Recent Chart */}
      {expenses.length > 0 && (
        <Card className="bg-gradient-card p-4 border-border/50">
          <h3 className="text-lg font-semibold mb-4">Spending Overview</h3>
          <ExpenseChart expenses={expenses} categories={categories} />
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ExpenseTracker
          </h1>
          <div className="flex space-x-2">
            <Button
              variant={currentView === "dashboard" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("dashboard")}
            >
              Dashboard
            </Button>
            <Button
              variant={currentView === "expenses" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("expenses")}
            >
              Expenses
            </Button>
          </div>
        </div>

        {/* Content */}
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "expenses" && (
          <ExpenseChart expenses={expenses} categories={categories} showDetails />
        )}
        {currentView === "categories" && (
          <CategoryList 
            categories={categories} 
            onUpdateCategories={setCategories}
            expenses={expenses}
          />
        )}
        {currentView === "budget" && (
          <BudgetManager 
            budget={budget} 
            onUpdateBudget={setBudget}
            totalExpenses={totalExpenses}
          />
        )}

        {/* Expense Form Modal */}
        {showExpenseForm && (
          <ExpenseForm
            categories={categories}
            onSubmit={addExpense}
            onClose={() => setShowExpenseForm(false)}
          />
        )}
      </div>
    </div>
  );
};