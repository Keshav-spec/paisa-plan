import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Expense, Category } from "./ExpenseTracker";
import { PieChartIcon, BarChart3 } from "lucide-react";

interface ExpenseChartProps {
  expenses: Expense[];
  categories: Category[];
  showDetails?: boolean;
}

export const ExpenseChart = ({ expenses, categories, showDetails = false }: ExpenseChartProps) => {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Process data for charts
  const categoryData = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category.id);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      name: category.name,
      value: total,
      count: categoryExpenses.length,
      color: `hsl(var(--${category.color}))`,
      icon: category.icon
    };
  }).filter(item => item.value > 0);

  // Monthly data for bar chart
  const monthlyData = () => {
    const months = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthName, total: 0 };
      }
      months[monthKey].total += expense.amount;
    });
    
    return Object.values(months).slice(-6); // Last 6 months
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border/50 rounded-lg p-3 shadow-elevated">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Amount: ₹{payload[0].value.toFixed(2)}
          </p>
          {payload[0].payload.count && (
            <p className="text-muted-foreground text-sm">
              {payload[0].payload.count} transactions
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <Card className="bg-gradient-card p-8 text-center border-border/50">
        <div className="text-muted-foreground">
          <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Expenses Yet</h3>
          <p className="text-sm">Add your first expense to see spending insights</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showDetails && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Expense Analytics</h2>
          <div className="flex space-x-2">
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("pie")}
            >
              <PieChartIcon className="h-4 w-4 mr-1" />
              Pie
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Bar
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-gradient-card p-6 border-border/50">
        <h3 className="text-lg font-medium mb-4">
          {chartType === "pie" ? "Spending by Category" : "Monthly Spending Trend"}
        </h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ₹${value.toFixed(0)}`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={monthlyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {showDetails && (
        <Card className="bg-gradient-card p-4 border-border/50">
          <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {categoryData.map((category) => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{category.value.toFixed(2)}</p>
                  <div 
                    className="w-3 h-3 rounded-full ml-auto mt-1"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showDetails && (
        <Card className="bg-gradient-card p-4 border-border/50">
          <h3 className="text-lg font-medium mb-4">Recent Expenses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenses.slice(0, 10).map((expense) => {
              const category = categories.find(cat => cat.id === expense.category);
              return (
                <div key={expense.id} className="flex items-center justify-between p-2 bg-background/20 rounded">
                  <div className="flex items-center space-x-3">
                    <span>{category?.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">₹{expense.amount.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};