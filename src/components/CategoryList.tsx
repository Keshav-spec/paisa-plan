import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, DollarSign } from "lucide-react";
import { Category, Expense } from "./ExpenseTracker";

interface CategoryListProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  expenses: Expense[];
}

export const CategoryList = ({ categories, onUpdateCategories, expenses }: CategoryListProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  const getCategoryExpenses = (categoryId: string) => {
    return expenses.filter(expense => expense.category === categoryId);
  };

  const getCategoryTotal = (categoryId: string) => {
    return getCategoryExpenses(categoryId).reduce((sum, expense) => sum + expense.amount, 0);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      color: "category-other",
      icon: newCategoryIcon || "📦"
    };

    onUpdateCategories([...categories, newCategory]);
    setNewCategoryName("");
    setNewCategoryIcon("");
    setShowAddForm(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryExpenses = getCategoryExpenses(categoryId);
    if (categoryExpenses.length > 0) {
      alert("Cannot delete category with existing expenses");
      return;
    }
    
    onUpdateCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const handleEditCategory = (categoryId: string, newName: string) => {
    onUpdateCategories(
      categories.map(cat => 
        cat.id === categoryId ? { ...cat, name: newName } : cat
      )
    );
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expense Categories</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-gradient-card p-4 border-border/50 animate-slide-up">
          <h3 className="font-medium mb-3">Add New Category</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="categoryName">Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Utilities"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div>
              <Label htmlFor="categoryIcon">Icon (Emoji)</Label>
              <Input
                id="categoryIcon"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="e.g., ⚡"
                className="bg-background/50 border-border/50"
                maxLength={2}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleAddCategory}
                size="sm"
                className="bg-gradient-primary hover:opacity-90"
              >
                Add
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)}
                variant="outline"
                size="sm"
                className="border-border/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {categories.map((category) => {
          const categoryExpenses = getCategoryExpenses(category.id);
          const total = getCategoryTotal(category.id);
          
          return (
            <Card key={category.id} className="bg-gradient-card p-4 border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    {editingCategory === category.id ? (
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onBlur={() => {
                          if (newCategoryName.trim()) {
                            handleEditCategory(category.id, newCategoryName);
                          } else {
                            setEditingCategory(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditCategory(category.id, newCategoryName);
                          } else if (e.key === 'Escape') {
                            setEditingCategory(null);
                          }
                        }}
                        className="bg-background/50 border-border/50"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${total.toFixed(2)}</span>
                          </span>
                          <span>{categoryExpenses.length} expenses</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category.id);
                      setNewCategoryName(category.name);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    disabled={categoryExpenses.length > 0}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {total > 0 && (
                <div className="mt-3 bg-background/30 rounded-lg p-2">
                  <div className="flex justify-between text-sm">
                    <span>Category Total</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div 
                    className="h-2 bg-primary/20 rounded-full mt-2"
                  >
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (total / Math.max(...categories.map(c => getCategoryTotal(c.id)))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};