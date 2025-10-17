import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Apple, Edit, Trash2, Copy, Save, Sparkles, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

interface MealEntry {
  id: string;
  type: 'meal' | 'workout';
  name: string;
  calories: number;
  time: string;
  timestamp: Date;
  status: string;
  foods?: Food[];
}

interface MealDetailModalProps {
  meal: MealEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onFoodAssistantClick: () => void;
  userGoal?: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export function MealDetailModal({ meal, isOpen, onClose, onFoodAssistantClick, userGoal }: MealDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFoods, setEditedFoods] = useState<Food[]>([]);

  if (!meal || meal.type !== 'meal') return null;

  const foods = isEditing ? editedFoods : (meal.foods || []);

  // Calculate totals
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
  const totalFat = foods.reduce((sum, f) => sum + f.fat, 0);

  // Calculate contribution to daily goals
  const proteinPercent = userGoal ? (totalProtein / userGoal.protein) * 100 : 0;
  const carbsPercent = userGoal ? (totalCarbs / userGoal.carbs) * 100 : 0;
  const fatPercent = userGoal ? (totalFat / userGoal.fat) * 100 : 0;

  // Generate AI insights
  const generateAIInsight = () => {
    if (!userGoal) return "Set your fitness goal to get personalized meal insights!";

    const insights = [];
    
    // Check protein
    if (totalProtein < (userGoal.protein / 3) * 0.7) {
      insights.push(`⚠️ This meal is low on protein. Add Greek yogurt (+17g) or chicken breast (+25g) to boost it.`);
    } else if (totalProtein >= (userGoal.protein / 3)) {
      insights.push(`✅ Excellent protein content! You're ${Math.round(proteinPercent)}% toward your daily goal from this meal alone.`);
    }

    // Check balance
    const isBalanced = totalProtein >= 15 && totalCarbs >= 20 && totalFat >= 10;
    if (!isBalanced && totalCalories > 200) {
      insights.push(`💡 Consider balancing this meal with all three macros for sustained energy.`);
    }

    // Check calories for meal type
    if (meal.name === 'Breakfast' && totalCalories < 300) {
      insights.push(`🌅 Breakfast is a bit light. Consider adding oatmeal (+150 kcal) or a banana (+105 kcal) for more energy.`);
    }

    if (insights.length === 0) {
      insights.push(`🎯 This meal looks well-balanced and fits your ${userGoal.goalType === 'cut' ? 'cutting' : userGoal.goalType === 'bulk' ? 'bulking' : 'maintenance'} goals!`);
    }

    return insights[0];
  };

  const handleStartEdit = () => {
    setEditedFoods([...(meal.foods || [])]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFoods([]);
  };

  const handleSaveEdit = () => {
    toast.success('Meal updated successfully!');
    setIsEditing(false);
    // In real app: save to backend
  };

  const handleDeleteMeal = () => {
    toast.success('Meal deleted');
    onClose();
    // In real app: delete from backend
  };

  const handleDuplicateMeal = () => {
    toast.success('Meal duplicated for tomorrow!');
    // In real app: create duplicate entry
  };

  const handleSaveAsPreset = () => {
    toast.success(`"${meal.name}" saved as preset!`);
    // In real app: save to user_meal_presets table
  };

  const handleRecreate = () => {
    toast.success('Meal added to today!');
    // In real app: create new entry with same foods
  };

  const handleRemoveFood = (index: number) => {
    const newFoods = [...editedFoods];
    newFoods.splice(index, 1);
    setEditedFoods(newFoods);
  };

  const handleAddFood = () => {
    setEditedFoods([
      ...editedFoods,
      {
        name: 'New Food',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        serving: '1 serving'
      }
    ]);
  };

  const handleFoodChange = (index: number, field: keyof Food, value: string | number) => {
    const newFoods = [...editedFoods];
    newFoods[index] = {
      ...newFoods[index],
      [field]: value
    };
    setEditedFoods(newFoods);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F4F2' }}>
                <Apple className="w-5 h-5" style={{ color: '#1C7C54' }} />
              </div>
              <div>
                <DialogTitle style={{ color: '#102A43' }}>{meal.name}</DialogTitle>
                <DialogDescription style={{ color: '#102A43', opacity: 0.6 }}>{meal.time}</DialogDescription>
              </div>
            </div>
            
            {!isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Macro Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
          <div>
            <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Calories</p>
            <p className="text-xl" style={{ color: '#102A43' }}>{totalCalories}</p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Protein</p>
            <p className="text-xl" style={{ color: '#102A43' }}>{totalProtein}g</p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Carbs</p>
            <p className="text-xl" style={{ color: '#102A43' }}>{totalCarbs}g</p>
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Fat</p>
            <p className="text-xl" style={{ color: '#102A43' }}>{totalFat}g</p>
          </div>
        </div>

        {/* Compare to Goal */}
        {userGoal && (
          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#A8E6CF' }}>
            <p className="text-sm mb-3" style={{ color: '#102A43', opacity: 0.7 }}>Contribution to Daily Goal</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#102A43' }}>Protein</span>
                <span style={{ color: '#1C7C54' }}>{Math.round(proteinPercent)}% of daily target</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#102A43' }}>Carbs</span>
                <span style={{ color: '#1C7C54' }}>{Math.round(carbsPercent)}% of daily target</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#102A43' }}>Fat</span>
                <span style={{ color: '#1C7C54' }}>{Math.round(fatPercent)}% of daily target</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #1C7C54 0%, #A8E6CF 100%)' }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm mb-1" style={{ fontWeight: 600 }}>AI Insight</p>
              <p className="text-white text-sm opacity-95">{generateAIInsight()}</p>
            </div>
          </div>
        </motion.div>

        {/* Foods List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 style={{ color: '#102A43' }}>Foods in this meal</h4>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddFood}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Food
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {foods.map((food, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-lg border"
                  style={{ borderColor: '#E8F4F2' }}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={food.name}
                          onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                          className="flex-1"
                          placeholder="Food name"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFood(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <Input
                          type="number"
                          value={food.calories}
                          onChange={(e) => handleFoodChange(index, 'calories', parseInt(e.target.value) || 0)}
                          placeholder="Cal"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          value={food.protein}
                          onChange={(e) => handleFoodChange(index, 'protein', parseInt(e.target.value) || 0)}
                          placeholder="Protein"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          value={food.carbs}
                          onChange={(e) => handleFoodChange(index, 'carbs', parseInt(e.target.value) || 0)}
                          placeholder="Carbs"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          value={food.fat}
                          onChange={(e) => handleFoodChange(index, 'fat', parseInt(e.target.value) || 0)}
                          placeholder="Fat"
                          className="text-sm"
                        />
                        <Input
                          value={food.serving}
                          onChange={(e) => handleFoodChange(index, 'serving', e.target.value)}
                          placeholder="Serving"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ color: '#102A43' }}>{food.name}</p>
                        <p style={{ color: '#102A43' }}>{food.calories} kcal</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>F: {food.fat}g</span>
                        <span className="ml-auto">{food.serving}</span>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: '#E8F4F2' }}>
          {isEditing ? (
            <>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 gap-2"
                style={{ backgroundColor: '#1C7C54', color: 'white' }}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleRecreate}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Copy className="w-4 h-4" />
                Recreate This Meal
              </Button>
              <Button
                onClick={handleSaveAsPreset}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Preset
              </Button>
              <Button
                onClick={onFoodAssistantClick}
                className="flex-1 gap-2"
                style={{ backgroundColor: '#FFB6B9', color: 'white' }}
              >
                <Sparkles className="w-4 h-4" />
                Ask Food AI
              </Button>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-3">
            <Button
              onClick={handleDuplicateMeal}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </Button>
            <Button
              onClick={handleDeleteMeal}
              variant="outline"
              size="sm"
              className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete Meal
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}