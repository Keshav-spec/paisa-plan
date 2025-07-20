import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, TrendingUp, Wallet, Target, LogOut } from "lucide-react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CreditForm } from "@/components/CreditForm";
import { ExpenseChart } from "@/components/ExpenseChart";
import { CategoryList } from "@/components/CategoryList";
import { BudgetManager } from "@/components/BudgetManager";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  duration: number;
  startDate: string;
  weeklyLimit?: number;
  credits?: number;
}

export const ExpenseTrackerWithAuth = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "expenses" | "categories" | "budget">("dashboard");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Load data from Supabase
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at');

      if (categoriesError) throw categoriesError;

      const formattedCategories = categoriesData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon
      })) || [];

      setCategories(formattedCategories);

      // Load expenses with category names
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          title,
          amount,
          date,
          description,
          categories (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      const formattedExpenses = expensesData?.map(exp => ({
        id: exp.id,
        title: exp.title,
        amount: parseFloat(exp.amount.toString()),
        category: exp.categories?.name || 'Other',
        date: exp.date,
        description: exp.description
      })) || [];

      setExpenses(formattedExpenses);

      // Load budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (budgetError && budgetError.code !== 'PGRST116') {
        throw budgetError;
      }

      if (budgetData) {
        setBudget({
          totalAmount: parseFloat(budgetData.total_amount.toString()),
          duration: budgetData.duration,
          startDate: budgetData.start_date,
          weeklyLimit: budgetData.weekly_limit ? parseFloat(budgetData.weekly_limit.toString()) : undefined,
          credits: budgetData.credits ? parseFloat(budgetData.credits.toString()) : 0
        });
      }

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    if (!user) return;

    try {
      // Find category by name
      const category = categories.find(cat => cat.name === expenseData.category);
      if (!category) {
        toast({
          title: "Error",
          description: "Category not found",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          title: expenseData.title,
          amount: expenseData.amount,
          category_id: category.id,
          date: expenseData.date,
          description: expenseData.description
        })
        .select()
        .single();

      if (error) throw error;

      const newExpense: Expense = {
        id: data.id,
        title: expenseData.title,
        amount: expenseData.amount,
        category: expenseData.category,
        date: expenseData.date,
        description: expenseData.description
      };

      setExpenses([newExpense, ...expenses]);
      setShowExpenseForm(false);
      
      toast({
        title: "Expense Added",
        description: `${expenseData.title} - ₹${expenseData.amount}`,
      });

      // Check budget warnings
      if (budget) {
        const currentWeek = getWeeklyExpenses();
        const weeklyBudget = budget.totalAmount / (budget.duration / 7);
        
        if (currentWeek + expenseData.amount > weeklyBudget * 0.9) {
          toast({
            title: "Budget Warning",
            description: "You're approaching your weekly budget limit!",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error adding expense",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addCredit = async (amount: number, description: string) => {
    if (!user || !budget) return;

    try {
      const updatedBudget = {
        totalAmount: budget.totalAmount + amount,
        credits: (budget.credits || 0) + amount
      };

      const { error } = await supabase
        .from('budgets')
        .update({
          total_amount: updatedBudget.totalAmount,
          credits: updatedBudget.credits
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setBudget(prev => prev ? { ...prev, ...updatedBudget } : null);
      setShowCreditForm(false);
      
      toast({
        title: "Credit Added",
        description: `₹${amount} added to your budget`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding credit",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getWeeklyExpenses = () => {
    const today = new Date();
    const thisWeek = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= weekAgo;
    });
    return thisWeek.reduce((sum, expense) => sum + expense.amount, 0);
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

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  const stats = getDashboardStats();

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Balance Overview */}
      <Card className="bg-gradient-primary p-6 border-0 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">Current Balance</p>
            <p className="text-3xl font-bold text-primary-foreground">
              ₹{currentBalance.toFixed(2)}
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
              <p className="text-lg font-semibold">₹{stats.monthlyTotal.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.monthlyCount} expenses</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card p-4 border-border/50">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-lg font-semibold">₹{stats.weeklyTotal.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.weeklyCount} expenses</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => setShowExpenseForm(true)}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Expense
          </Button>
          <Button 
            onClick={() => setShowCreditForm(true)}
            variant="outline"
            className="border-border/50 text-success border-success/30 hover:bg-success/10"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Credit
          </Button>
        </div>
        
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
          <div className="flex items-center space-x-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-border/50"
            >
              <LogOut className="h-4 w-4" />
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

        {/* Credit Form Modal */}
        {showCreditForm && (
          <CreditForm
            onSubmit={addCredit}
            onClose={() => setShowCreditForm(false)}
          />
        )}
      </div>
    </div>
  );
};