import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Camera, Upload, Sparkles, MessageSquare, Barcode, ChevronDown, ChevronUp, Check, Save, Info, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { addMealToDailyNutrition, getTodayMeals, updateUserFareScoreOnLog, updateUserStreak, addBarcodeToHistory, getBarcodeHistory, getDateInEasternTimezone, analyzeMealImage} from '../userService';
import { getAuth } from 'firebase/auth';
import { useEffect } from "react";
import { BarcodeScannerCamera } from './BarcodeScannerCamera';
import { NutritionLabelCamera } from './NutritionLabelCamera';
import { fetchProductByBarcode, isValidBarcode } from '../services/barcodeScannerService';
import { getGeminiService } from '../services/geminiService';
import { analyzeMealDescription } from '../services/mealParsingService';

interface FoodItem {
  id: string;
  name: string;
  servingSize: string;          // e.g., "1 cup (150g)"
  amountConsumed: number;        // e.g., 0.75 servings
  baseCalories: number;          // Calories per serving
  baseProtein: number;           // Protein per serving
  baseCarbs: number;             // Carbs per serving
  baseFat: number;               // Fat per serving
  baseFiber: number;             // Fiber per serving
  calories: number;              // Calculated: baseCalories * amountConsumed
  protein: number;               // Calculated
  carbs: number;                 // Calculated
  fat: number;                   // Calculated
  fiber: number;                 // Calculated
  isExpanded: boolean;
  isFavorite?: boolean;
  brandName: string;
}

interface MealLoggingPageProps {
  onBack: () => void;
  onMealLogged: (meal: any) => void;
}

export function MealLoggingPage({ onBack, onMealLogged }: MealLoggingPageProps) {
  const [activeTab, setActiveTab] = useState('manual');
  const [mealName, setMealName] = useState('');
  const [usePredefinedMeal, setUsePredefinedMeal] = useState(true);
  const [predefinedMeal, setPredefinedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: '1',
      name: '',
      servingSize: '',
      amountConsumed: 1,
      baseCalories: 0,
      baseProtein: 0,
      baseCarbs: 0,
      baseFat: 0,
      baseFiber: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      isExpanded: true,
      isFavorite: false,
      brandName: ''
    },
  ]);
  
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);

  // Calculate totals
  const totals = foodItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
      fiber: acc.fiber + (item.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const addFoodItem = () => {
    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: '',
      servingSize: '',
      amountConsumed: 1,
      baseCalories: 0,
      baseProtein: 0,
      baseCarbs: 0,
      baseFat: 0,
      baseFiber: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      isExpanded: true,
      brandName: '', // 👈 Added missing brandName property
    };
    setFoodItems([...foodItems, newItem]);
  };

  const removeFoodItem = (id: string) => {
    if (foodItems.length > 1) {
      setFoodItems(foodItems.filter((item) => item.id !== id));
    } else {
      toast.error('You must have at least one food item');
    }
  };

  const updateFoodItem = (id: string, updates: Partial<FoodItem>) => {
    setFoodItems(foodItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate actual values if amount or base values changed
        if ('amountConsumed' in updates || 'baseCalories' in updates || 'baseProtein' in updates || 
            'baseCarbs' in updates || 'baseFat' in updates || 'baseFiber' in updates) {
          const amount = updatedItem.amountConsumed;
          updatedItem.calories = Math.round(updatedItem.baseCalories * amount);
          updatedItem.protein = Math.round(updatedItem.baseProtein * amount * 10) / 10;
          updatedItem.carbs = Math.round(updatedItem.baseCarbs * amount * 10) / 10;
          updatedItem.fat = Math.round(updatedItem.baseFat * amount * 10) / 10;
          updatedItem.fiber = Math.round(updatedItem.baseFiber * amount * 10) / 10;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleBarcodeScanned = (itemId: string, barcodeData: any) => {
    updateFoodItem(itemId, {
      name: barcodeData.name,
      servingSize: barcodeData.servingSize,
      baseCalories: barcodeData.calories,
      baseProtein: barcodeData.protein,
      baseCarbs: barcodeData.carbs,
      baseFat: barcodeData.fat,
      baseFiber: barcodeData.fiber,
      amountConsumed: 1,
    });
    setScanningItemId(null);
    toast.success('Barcode scanned! Values auto-filled.');
  };

  const toggleItemExpanded = (id: string) => {
    setFoodItems(
      foodItems.map((item) => (item.id === id ? { ...item, isExpanded: !item.isExpanded } : item))
    );
  };

  const handleSaveMeal = async () => {
    const hasValidItems = foodItems.some((item) => item.name && item.name.trim().length > 0);
    if (!hasValidItems) {
      toast.error("Please add at least one food item with a name");
      return;
    }

    const finalMealName = usePredefinedMeal
      ? predefinedMeal.charAt(0).toUpperCase() + predefinedMeal.slice(1)
      : mealName || "Custom Meal";

      /*
    const meal = {
      id: Date.now().toString(),
      name: finalMealName,
      mealType: usePredefinedMeal ? predefinedMeal : "snack",
      items: foodItems.filter((item) => item.name && item.calories > 0),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      fiber: totals.fiber,
      timestamp: new Date(),
      brandName: foodItems.filter((item) => item.brandName ),
    }; */

    const meal = {
      id: Date.now().toString(),
      name: finalMealName,
      mealType: usePredefinedMeal ? predefinedMeal : "snack",
      items: foodItems
        .filter((item) => item.name && item.name.trim().length > 0) // Allow 0-calorie items
        .map((item) => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          servingSize: item.servingSize,
          amountConsumed: item.amountConsumed,
          brandName: item.brandName || "", // optional brand
        })),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      fiber: totals.fiber,
      timestamp: new Date(),
    };


    try {
      // 🔹 Save to Firestore
      const auth = getAuth();
      const user = auth.currentUser;
      const userId = user?.uid;

      if (!user) {
        toast.error("User not logged in");
        return;
      }
      if (!userId) {return;}

      console.log('🔑 Current User ID:', user.uid);
      console.log('📍 Firebase path: Daily_Nutrition_Summary/' + user.uid);
      
      /*
      await addMealToDailyNutrition(user.uid, {
        meal_type: meal.mealType,
        food_name: meal.name,
        serving_size: 1, // or however you calculate it
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fat,
        fiber: meal.fiber,
        brand: meal.brandName
      });
      */

      const todayMeals = await getTodayMeals(userId);
      if (todayMeals.length === meal.items.length) {
        // First log of the day
        await updateUserStreak(userId);
        console.log("✅ Streak updated for first meal of the day");
      }

     for (const item of meal.items) {
      console.log('💾 Saving meal item to Firebase:', {
        meal_type: meal.mealType,
        food_name: item.name,
        brand: item.brandName,
        calories: item.calories,
      });

      await addMealToDailyNutrition(user.uid, {
        meal_type: meal.mealType,
        food_name: item.name,
        serving_size: item.amountConsumed || 1,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fat,
        fiber: item.fiber,
        brand: item.brandName,
        meal_time: new Date(),
        meal_date: getDateInEasternTimezone() // 👈 Use Eastern timezone
      });
      await updateUserFareScoreOnLog(userId, "logged_food");
    }

    console.log(` ${meal.items.length} item(s) saved to Firebase successfully!`);

      // 🔹 Update local app state/UI
      onMealLogged(meal);
      toast.success(
        ` ${finalMealName} logged successfully! ${totals.calories} kcal added.`
      );
      onBack();
    } catch (err) {
      console.error(" Error saving meal:", err);
      toast.error("Error saving meal to Firestore");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F9FA' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10" style={{ borderColor: '#E8F4F2' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
            style={{ color: '#102A43' }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl" style={{ color: '#102A43' }}>
              Log Your Meal
            </h1>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
              Add food items and track your nutrition
            </p>
          </div>
          <button
            onClick={handleSaveMeal}
            className="p-2 rounded-full hover:bg-green-50 transition-colors flex items-center justify-center"
            style={{ color: '#1C7C54' }}
          >
            <Save className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="barcode" className="flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Barcode</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Photo</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <ManualEntryTab
              mealName={mealName}
              setMealName={setMealName}
              usePredefinedMeal={usePredefinedMeal}
              setUsePredefinedMeal={setUsePredefinedMeal}
              predefinedMeal={predefinedMeal}
              setPredefinedMeal={setPredefinedMeal}
              foodItems={foodItems}
              totals={totals}
              addFoodItem={addFoodItem}
              removeFoodItem={removeFoodItem}
              updateFoodItem={updateFoodItem}
              toggleItemExpanded={toggleItemExpanded}
              scanningItemId={scanningItemId}
              setScanningItemId={setScanningItemId}
              onBarcodeScanned={handleBarcodeScanned}
            />
          </TabsContent>

          <TabsContent value="barcode">
            <BarcodeScanTab
              onFoodDetected={(foodData: any) => { // 👈 Added type annotation
                const newItem: FoodItem = {
                  id: Date.now().toString(),
                  ...foodData,
                  isExpanded: true,
                };
                setFoodItems([...foodItems, newItem]);
                setActiveTab('manual');
              }}
            />
          </TabsContent>

          <TabsContent value="scan">
            <PhotoScanTab
              onMealDetected={(mealData: any) => { // 👈 Added type annotation
                setFoodItems(mealData.items);
                setMealName(mealData.name);
                setUsePredefinedMeal(false);
                setActiveTab('manual');
              }}
            />
          </TabsContent>

          <TabsContent value="ai">
            <AskFoodAITab
              onMealParsed={(mealData: any) => { // 👈 Added type annotation
                setFoodItems(mealData.items);
                setMealName(mealData.name);
                setUsePredefinedMeal(false);
                setActiveTab('manual');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg"
        style={{ borderColor: '#E8F4F2' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
              style={{ borderColor: '#A8E6CF', color: '#102A43' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMeal}
              className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1C7C54' }}
            >
              <Check className="w-5 h-5" />
              Save Meal • {totals.calories} kcal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manual Entry Tab
function ManualEntryTab({
  mealName,
  setMealName,
  usePredefinedMeal,
  setUsePredefinedMeal,
  predefinedMeal,
  setPredefinedMeal,
  foodItems,
  totals,
  addFoodItem,
  removeFoodItem,
  updateFoodItem,
  toggleItemExpanded,
  scanningItemId,
  setScanningItemId,
  onBarcodeScanned,
}: any) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [todayTotals, setTodayTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    food_name: ""
  });

  useEffect(() => {
    const fetchTodayMeals = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const todayMeals = await getTodayMeals(user.uid);

        if (todayMeals && todayMeals.length > 0) {
          const total = todayMeals.reduce(
            (acc: any, meal: any) => ({ // 👈 Added type annotations
              calories: acc.calories + (meal.calories || 0),
              protein: acc.protein + (meal.protein || 0),
              carbs: acc.carbs + (meal.carbs || 0),
              fats: acc.fats + (meal.fats || 0),
              fiber: acc.fiber + (meal.fiber || 0),
              food_name: acc.food_name
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
          );

          setTodayTotals(total);
        }
      } catch (error) {
        console.error("Error fetching today’s meals:", error);
      }
    };

    fetchTodayMeals();
  }, []);

  return (
    <div className="space-y-6">
      {/* Meal Name Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="mb-4" style={{ color: '#102A43' }}>
          Meal Type
        </h3>
        
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setUsePredefinedMeal(true)}
            className="px-4 py-2 rounded-lg transition-all flex items-center justify-center"
            style={{
              backgroundColor: usePredefinedMeal ? '#A8E6CF' : '#E8F4F2',
              color: '#102A43',
            }}
          >
            Preset
          </button>
          <button
            onClick={() => setUsePredefinedMeal(false)}
            className="px-4 py-2 rounded-lg transition-all flex items-center justify-center"
            style={{
              backgroundColor: !usePredefinedMeal ? '#A8E6CF' : '#E8F4F2',
              color: '#102A43',
            }}
          >
            Custom
          </button>
        </div>

        {usePredefinedMeal ? (
          <Select value={predefinedMeal} onValueChange={setPredefinedMeal}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
              <SelectItem value="lunch">☀️ Lunch</SelectItem>
              <SelectItem value="dinner">🌙 Dinner</SelectItem>
              <SelectItem value="snack">🍪 Snack</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="e.g., Shake, Post-Workout, Late-Night Bowl"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
          />
        )}
      </div>

      {/* Total Nutrition Summary */}
      <div className="bg-white rounded-xl p-6 shadow-md border-2" style={{ borderColor: '#A8E6CF' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: '#102A43' }}>Total Nutrition</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                  style={{ color: '#102A43', opacity: 0.6 }}
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View per-item breakdown</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <motion.span
              key={todayTotals.calories}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl"
              style={{ color: '#1C7C54' }}
            >
              {todayTotals.calories}
            </motion.span>
            <span className="text-lg" style={{ color: '#102A43', opacity: 0.7 }}>
              kcal
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                Protein
              </p>
              <motion.p
                key={todayTotals.protein}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ color: '#F5A623' }}
              >
                {Math.round(todayTotals.protein)}g
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                Carbs
              </p>
              <motion.p
                key={todayTotals.carbs}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ color: '#4DD4AC' }}
              >
                {Math.round(todayTotals.carbs)}g
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                Fat
              </p>
              <motion.p
                key={todayTotals.fats}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ color: '#6B47DC' }}
              >
                {Math.round(todayTotals.fats)}g
              </motion.p>
            </div>
            <div className="text-center">
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>
                Fiber
              </p>
              <motion.p
                key={todayTotals.fiber}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ color: '#1C7C54' }}
              >
                {Math.round(todayTotals.fiber)}g
              </motion.p>
            </div>
          </div>

        </div>

        <p className="text-xs text-center" style={{ color: '#102A43', opacity: 0.6 }}>
          Your total nutrition updates automatically as you add or edit items.
        </p>

        {/* Per-Item Breakdown */}
        <AnimatePresence>
          {showBreakdown && foodItems.some((item: FoodItem) => item.name && item.calories > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t space-y-2"
              style={{ borderColor: '#A8E6CF' }}
            >
              <p className="text-xs mb-2" style={{ color: '#102A43', opacity: 0.7 }}>
                <strong>Per-item breakdown:</strong>
              </p>
              {foodItems.filter((item: FoodItem) => item.name && item.calories > 0).map((item: FoodItem) => (
                <div key={item.id} className="text-xs flex justify-between" style={{ color: '#102A43', opacity: 0.8 }}>
                  <span>{item.name}</span>
                  <span>{item.calories} kcal</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Item Button */}
      <button
        onClick={addFoodItem}
        className="w-full py-3 rounded-lg border-2 border-dashed transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
        style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
      >
        <Plus className="w-5 h-5" />
        Add Item
      </button>

      {/* Food Items */}
      <div className="space-y-4">
        <h3 style={{ color: '#102A43' }}>Food Items ({foodItems.length})</h3>

        {foodItems.map((item: FoodItem, index: number) => (
          <FoodItemCard
            key={item.id}
            item={item}
            index={index}
            onUpdate={updateFoodItem}
            onRemove={removeFoodItem}
            onToggleExpand={toggleItemExpanded}
            canRemove={foodItems.length > 1}
            scanningItemId={scanningItemId}
            setScanningItemId={setScanningItemId}
            onBarcodeScanned={onBarcodeScanned}
          />
        ))}
      </div>
    </div>
  );
}

// Food Item Card Component
function FoodItemCard({
  item,
  index,
  onUpdate,
  onRemove,
  onToggleExpand,
  canRemove,
  scanningItemId,
  setScanningItemId,
  onBarcodeScanned,
}: {
  item: FoodItem;
  index: number;
  onUpdate: (id: string, updates: Partial<FoodItem>) => void;
  onRemove: (id: string) => void;
  onToggleExpand: (id: string) => void;
  canRemove: boolean;
  scanningItemId: string | null;
  setScanningItemId: (id: string | null) => void;
  onBarcodeScanned: (itemId: string, data: any) => void;
}) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScanBarcode = () => {
    setScanningItemId(item.id);
    setIsScanning(true);
    
    // Simulate barcode scan
    setTimeout(() => {
      const mockBarcodeData = {
        name: 'Optimum Nutrition Whey Protein',
        servingSize: '1 scoop (30g)',
        calories: 120,
        protein: 24,
        carbs: 3,
        fat: 1,
        fiber: 1,
      };
      onBarcodeScanned(item.id, mockBarcodeData);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border-2" style={{ borderColor: '#E8F4F2' }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onToggleExpand(item.id)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ backgroundColor: '#A8E6CF', color: '#1C7C54' }}
          >
            {index + 1}
          </div>
          <div className="flex-1">
            <p style={{ color: '#102A43' }}>{item.name || 'Untitled Item'}</p>
            {!item.isExpanded && item.calories > 0 && (
              <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                {item.amountConsumed !== 1 && `${item.amountConsumed}x servings • `}{item.calories} kcal
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
              style={{ color: '#E53E3E' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {item.isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: '#102A43', opacity: 0.5 }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: '#102A43', opacity: 0.5 }} />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {item.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t"
            style={{ borderColor: '#E8F4F2' }}
          >
            <div className="p-4 space-y-4">
              {/* Food Name with Barcode Button */}
              <div>
                <Label>Food Name *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder="e.g., Grilled Chicken Breast"
                    value={item.name}
                    onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    onClick={handleScanBarcode}
                    disabled={isScanning}
                    className="px-4 py-2 rounded-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: '#A8E6CF', color: '#1C7C54' }}
                  >
                    {isScanning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Barcode className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline text-sm">Scan</span>
                  </button>
                </div>
              </div>

              {/* Optional brand name */}
              <div>
                <Label>Brand Name (optional)</Label>
                <Input
                  placeholder="e.g., Tyson, Nestle"
                  value={item.brandName || ''}
                  onChange={(e) => onUpdate(item.id, { brandName: e.target.value })}
                  className="mt-1.5"
                />
                <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.5 }}>
                  You can leave this empty if not applicable
                </p>
              </div>


              {/* Serving Size and Amount Consumed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Serving Size</Label>
                  <Input
                    placeholder="e.g., 1 cup (150g)"
                    value={item.servingSize}
                    onChange={(e) => onUpdate(item.id, { servingSize: e.target.value })}
                    className="mt-1.5"
                  />
                  <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.5 }}>
                    From barcode or manual entry
                  </p>
                </div>
                <div>
                  <Label>Amount Consumed (servings)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="1.0" // 👈 Fixed typo: plxaceholder → placeholder
                    value={item.amountConsumed.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numValue = val === '' ? 0 : Math.max(0, parseFloat(val) || 0);
                      onUpdate(item.id, { amountConsumed: numValue });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        onUpdate(item.id, { amountConsumed: 1 });
                      }
                    }}
                    className="mt-1.5"
                  />
                  <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.5 }}>
                    e.g., 0.5, 1.2, 2.0
                  </p>
                </div>
              </div>

              {/* Base Nutrition (per serving) */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
                <p className="text-xs mb-2" style={{ color: '#102A43', opacity: 0.7 }}>
                  <strong>Nutrition per serving:</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Calories (kcal) *</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={item.baseCalories.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : Math.max(0, parseFloat(val) || 0);
                        onUpdate(item.id, { baseCalories: numValue });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onUpdate(item.id, { baseCalories: 0 });
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={item.baseProtein.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : Math.max(0, parseFloat(val) || 0);
                        onUpdate(item.id, { baseProtein: numValue });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onUpdate(item.id, { baseProtein: 0 });
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carbs (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={item.baseCarbs.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : Math.max(0, parseFloat(val) || 0);
                        onUpdate(item.id, { baseCarbs: numValue });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onUpdate(item.id, { baseCarbs: 0 });
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fat (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={item.baseFat.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : Math.max(0, parseFloat(val) || 0);
                        onUpdate(item.id, { baseFat: numValue });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onUpdate(item.id, { baseFat: 0 });
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fiber (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={item.baseFiber.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numValue = val === '' ? 0 : Math.max(0, parseFloat(val) || 0);
                        onUpdate(item.id, { baseFiber: numValue });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          onUpdate(item.id, { baseFiber: 0 });
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Totals for This Item */}
              {item.amountConsumed > 0 && item.baseCalories > 0 && (
                <div className="p-3 rounded-lg border-2" style={{ borderColor: '#A8E6CF', backgroundColor: 'white' }}>
                  <p className="text-xs mb-2" style={{ color: '#1C7C54' }}>
                    <strong>📊 Calculated for {item.amountConsumed} serving(s):</strong>
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <p className="text-xs opacity-60" style={{ color: '#102A43' }}>Calories</p>
                      <p className="text-sm" style={{ color: '#1C7C54' }}>{item.calories}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60" style={{ color: '#102A43' }}>Protein</p>
                      <p className="text-sm" style={{ color: '#F5A623' }}>{Math.round(item.protein || 0)}g</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60" style={{ color: '#102A43' }}>Carbs</p>
                      <p className="text-sm" style={{ color: '#4DD4AC' }}>{Math.round(item.carbs || 0)}g</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60" style={{ color: '#102A43' }}>Fat</p>
                      <p className="text-sm" style={{ color: '#6B47DC' }}>{Math.round(item.fat || 0)}g</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60" style={{ color: '#102A43' }}>Fiber</p>
                      <p className="text-sm" style={{ color: '#1C7C54' }}>{Math.round(item.fiber || 0)}g</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent toggling expand
                  onUpdate(item.id, { isFavorite: !item.isFavorite });
                  toast.success(
                    !item.isFavorite ? 'Added to favorites!' : 'Removed from favorites!'
                  );
                }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  item.isFavorite ? 'bg-yellow-300 text-yellow' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {item.isFavorite ? '★ Favorite' : '☆ Favorite'}
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Barcode Scan Tab
function BarcodeScanTab({ onFoodDetected }: any) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [recentlyScanned, setRecentlyScanned] = useState<any[]>([]);
  const [showNutritionScanner, setShowNutritionScanner] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Fetch barcode history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const auth = getAuth();
      if (auth.currentUser) {
        const history = await getBarcodeHistory(auth.currentUser.uid);
        setRecentlyScanned(history);
        console.log('📜 Loaded barcode history:', history.length, 'products');
      }
    };
    fetchHistory();
  }, []);

  const handleStartScan = () => {
    setIsScanning(true);
    setScannedData(null);
  };

  const handleBarcodeDetected = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    setIsScanning(false);
    setIsFetching(true);

    try {
      const productData = await fetchProductByBarcode(barcode);

      if (productData) {
        // Convert to the expected format
        const formattedData = {
          name: productData.name,
          brandName: productData.brandName,
          servingSize: productData.servingSize,
          amountConsumed: productData.amountConsumed,
          baseCalories: productData.baseCalories,
          baseProtein: productData.baseProtein,
          baseCarbs: productData.baseCarbs,
          baseFat: productData.baseFat,
          baseFiber: productData.baseFiber,
          calories: productData.calories,
          protein: productData.protein,
          carbs: productData.carbs,
          fat: productData.fat,
          fiber: productData.fiber,
        };

        setScannedData(formattedData);
        toast.success(`✓ Found: ${productData.name}!`);

        // Save to barcode history
        const auth = getAuth();
        if (auth.currentUser) {
          await addBarcodeToHistory(auth.currentUser.uid, {
            barcode: barcode,
            product_name: productData.name,
            brand_name: productData.brandName,
            calories: productData.calories,
            protein: productData.protein,
            carbs: productData.carbs,
            fats: productData.fat,
            fiber: productData.fiber,
            serving_size: productData.servingSize,
          });
          // Refresh history
          const updatedHistory = await getBarcodeHistory(auth.currentUser.uid);
          setRecentlyScanned(updatedHistory);
          console.log('💾 Saved to barcode history');
        }
      } else {
        toast.error(`Product not found or missing nutrition data. Use manual entry.`, {
          duration: 4000,
          description: `Barcode: ${barcode}`,
        });
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product data. Check your connection.');
      setIsScanning(false);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCloseScan = () => {
    setIsScanning(false);
    setScannedData(null);
  };

  const handleAddItem = () => {
    if (scannedData) {
      onFoodDetected(scannedData);
      setScannedData(null);
      toast.success('Item added to your meal!');
    }
  };

  const handleManualLookup = async () => {
    if (!isValidBarcode(manualBarcode)) {
      toast.error('Invalid barcode format. Must be 8-14 digits.');
      return;
    }

    setIsFetching(true);
    try {
      await handleBarcodeDetected(manualBarcode);
      setManualBarcode('');
      setManualMode(false);
    } catch (error) {
      console.error('Manual lookup error:', error);
    }
  };

  const handleQuickAdd = (product: any) => {
    const formattedData = {
      name: product.product_name,
      brandName: product.brand_name,
      servingSize: product.serving_size,
      amountConsumed: 1,
      baseCalories: product.calories,
      baseProtein: product.protein,
      baseCarbs: product.carbs,
      baseFat: product.fats,
      baseFiber: product.fiber,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fats,
      fiber: product.fiber,
    };

    onFoodDetected(formattedData);
    toast.success(`✓ Added: ${product.product_name}!`);
  };

  const handleNutritionLabelPhoto = async (imageBase64: string) => {
    console.log('📸 Processing nutrition label photo...');
    setShowNutritionScanner(false);
    setIsProcessingImage(true);

    try {
      const gemini = getGeminiService();
      const nutritionData = await gemini.extractNutritionFromImage(imageBase64);

      console.log('✅ Extracted nutrition data:', nutritionData);

      const formattedData = {
        name: nutritionData.productName || 'Scanned Product',
        brandName: nutritionData.brandName,
        servingSize: nutritionData.servingSize,
        amountConsumed: 1,
        baseCalories: nutritionData.calories,
        baseProtein: nutritionData.protein,
        baseCarbs: nutritionData.carbs,
        baseFat: nutritionData.fat,
        baseFiber: nutritionData.fiber,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        carbs: nutritionData.carbs,
        fat: nutritionData.fat,
        fiber: nutritionData.fiber,
      };

      setScannedData(formattedData);
      toast.success('✓ Nutrition label scanned successfully!');
    } catch (error) {
      console.error('❌ Error processing nutrition label:', error);
      toast.error('Failed to read nutrition label. Please try again with better lighting.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <>
      {/* Barcode Scanner Camera Overlay */}
      <BarcodeScannerCamera
        isActive={isScanning}
        onBarcodeDetected={handleBarcodeDetected}
        onClose={handleCloseScan}
      />

      {/* Nutrition Label Camera Overlay */}
      <NutritionLabelCamera
        isActive={showNutritionScanner}
        onPhotoCapture={handleNutritionLabelPhoto}
        onClose={() => setShowNutritionScanner(false)}
      />

      {/* Main Content */}
      <div className="bg-white rounded-xl p-8 shadow-sm">
        {isProcessingImage ? (
          // Processing Nutrition Label State
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Sparkles className="w-16 h-16" style={{ color: '#1C7C54' }} />
            </motion.div>
            <h3 className="mb-2" style={{ color: '#102A43' }}>
              Reading Nutrition Label...
            </h3>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
              Analyzing your photo with AI
            </p>
          </div>
        ) : isFetching ? (
          // Fetching State
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Sparkles className="w-16 h-16" style={{ color: '#1C7C54' }} />
            </motion.div>
            <h3 className="mb-2" style={{ color: '#102A43' }}>
              Fetching Product Info...
            </h3>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
              Looking up nutrition data from our database
            </p>
          </div>
        ) : !scannedData ? (
          // Start Scan State
          <div className="space-y-6">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: '#E8F4F2' }}
              >
                <Barcode className="w-12 h-12" style={{ color: '#1C7C54' }} />
              </div>

              <h3 className="mb-2" style={{ color: '#102A43' }}>
                Scan Product Barcode
              </h3>
              <p className="mb-6 text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                Point your camera at the barcode on the package
              </p>

              <div className="flex gap-3 justify-center mb-6 flex-wrap">
                <button
                  onClick={handleStartScan}
                  className="px-8 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1C7C54' }}
                >
                  <Camera className="w-5 h-5" />
                  Scan Barcode
                </button>
                <button
                  onClick={() => setManualMode(!manualMode)}
                  className="px-6 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
                >
                  <Keyboard className="w-5 h-5" />
                  Type Barcode
                </button>
                <button
                  onClick={() => setShowNutritionScanner(true)}
                  className="px-6 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
                >
                  <Camera className="w-5 h-5" />
                  Scan Label
                </button>
              </div>

              {/* Manual Barcode Entry */}
              {manualMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-lg text-left"
                  style={{ backgroundColor: '#E8F4F2' }}
                >
                  <p className="text-sm mb-3" style={{ color: '#102A43' }}>
                    <strong>Enter Barcode Manually:</strong>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g., 012345678901"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualLookup();
                        }
                      }}
                      maxLength={14}
                      className="flex-1"
                    />
                    <button
                      onClick={handleManualLookup}
                      disabled={manualBarcode.length < 8}
                      className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#1C7C54' }}
                    >
                      Look Up
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#102A43', opacity: 0.6 }}>
                    Enter 8-14 digit barcode (UPC, EAN, etc.)
                  </p>
                </motion.div>
              )}

              <div className="mt-8 p-4 rounded-lg text-left" style={{ backgroundColor: '#E8F4F2' }}>
                <p className="text-sm mb-2" style={{ color: '#102A43' }}>
                  <strong>📱 Three ways to add products:</strong>
                </p>
                <ul className="text-sm space-y-1" style={{ color: '#102A43', opacity: 0.8 }}>
                  <li>• <strong>Scan Barcode:</strong> Point camera at UPC/EAN barcode (1.3M+ products)</li>
                  <li>• <strong>Type Barcode:</strong> Manually enter 8-14 digit barcode number</li>
                  <li>• <strong>Scan Label:</strong> Take a photo of nutrition facts (AI-powered)</li>
                  <li>• <strong>Recent Products:</strong> Quick-add from your scan history below</li>
                </ul>
              </div>
            </div>

            {/* Recently Scanned Products */}
            {recentlyScanned.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 style={{ color: '#102A43' }}>Recently Scanned</h4>
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E8F4F2', color: '#1C7C54' }}>
                    {recentlyScanned.length} products
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentlyScanned.map((product, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border-2 hover:bg-gray-50 transition-all"
                      style={{ borderColor: '#E8F4F2' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: '#102A43' }}>
                            {product.product_name}
                          </p>
                          {product.brand_name && (
                            <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                              {product.brand_name}
                            </p>
                          )}
                          <div className="flex gap-3 mt-1 text-xs" style={{ color: '#102A43', opacity: 0.7 }}>
                            <span>{Math.round(product.calories || 0)} kcal</span>
                            <span>P: {Math.round(product.protein || 0)}g</span>
                            <span>C: {Math.round(product.carbs || 0)}g</span>
                            <span>F: {Math.round(product.fats || 0)}g</span>
                          </div>
                          {product.scan_count > 1 && (
                            <p className="text-xs mt-1" style={{ color: '#1C7C54' }}>
                              Scanned {product.scan_count}x
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleQuickAdd(product)}
                          className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-1"
                          style={{ backgroundColor: '#1C7C54' }}
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Product Found State
          <div className="space-y-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
              <p className="text-sm mb-3" style={{ color: '#1C7C54' }}>
                ✅ <strong>Product Found:</strong>
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>
                    Product Name:
                  </p>
                  <p style={{ color: '#102A43' }}>{scannedData.name}</p>
                </div>
                {scannedData.brandName && (
                  <div>
                    <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>
                      Brand:
                    </p>
                    <p style={{ color: '#102A43' }}>{scannedData.brandName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>
                    Serving Size:
                  </p>
                  <p style={{ color: '#102A43' }}>{scannedData.servingSize}</p>
                </div>
                <div className="h-px" style={{ backgroundColor: '#A8E6CF' }}></div>
                <div className="flex justify-between">
                  <span style={{ color: '#102A43' }}>Calories:</span>
                  <strong style={{ color: '#102A43' }}>{Math.round(scannedData.calories || 0)} kcal</strong>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                    <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                      Protein
                    </p>
                    <p className="text-sm" style={{ color: '#F5A623' }}>
                      {Math.round(scannedData.protein || 0)}g
                    </p>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                    <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                      Carbs
                    </p>
                    <p className="text-sm" style={{ color: '#4DD4AC' }}>
                      {Math.round(scannedData.carbs || 0)}g
                    </p>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                    <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                      Fat
                    </p>
                    <p className="text-sm" style={{ color: '#6B47DC' }}>
                      {Math.round(scannedData.fat || 0)}g
                    </p>
                  </div>
                  <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                    <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                      Fiber
                    </p>
                    <p className="text-sm" style={{ color: '#1C7C54' }}>
                      {Math.round(scannedData.fiber || 0)}g
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setScannedData(null)}
                className="flex-1 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Scan Another
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1C7C54' }}
              >
                <Plus className="w-5 h-5" />
                Add to Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Photo Scan Tab
function PhotoScanTab({ onMealDetected }: any) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processImageFiles(files);
    }
  };

  const processImageFiles = (files: File[]) => {
    // Supported image formats
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ];

    // Filter and validate image files
    const validImageFiles = files.filter(file => {
      console.log(`📁 File: ${file.name}, Type: ${file.type}, Size: ${file.size}`);
      
      // Check if it's a supported image type
      const isImage = file.type.startsWith('image/') || supportedTypes.includes(file.type.toLowerCase());
      if (!isImage) {
        toast.error(`${file.name} is not a supported image format. Supported: JPEG, PNG, WebP, HEIC`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) return;

    // Limit to 5 photos max for better performance
    const maxPhotos = 5;
    const photosToProcess = validImageFiles.slice(0, maxPhotos);
    
    if (validImageFiles.length > maxPhotos) {
      toast.warning(`Only processing first ${maxPhotos} photos for optimal AI analysis`);
    }

    toast.success(`📸 ${photosToProcess.length} photo(s) uploaded! Processing...`);

    // Process all selected images
    const imagePromises = photosToProcess.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(imageDataArray => {
      setSelectedImages(imageDataArray);
      simulateAIAnalysis(imageDataArray);
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processImageFiles(files);
    }
  };

  const handleClick = () => {
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const simulateAIAnalysis = async (images: string[] = selectedImages) => {
    setIsAnalyzing(true);
    try {
      console.log(`🔬 Starting real AI analysis with ${images.length} image(s)...`);
      
      // For now, analyze the first (main) image, but in future we could:
      // 1. Analyze all images and combine results
      // 2. Let user pick the best angle
      // 3. Use multiple angles for better accuracy
      const mainImage = images[0];
      const result = await analyzeMealImage(mainImage, images.length);
      
      if (result.success) {
        // Check if AI detected meaningful items or seems uncertain
        const hasLowConfidenceItems = result.data.items.some((item: any) => 
          item.name.toLowerCase().includes('unknown') || 
          item.name.toLowerCase().includes('unidentified') ||
          item.name.toLowerCase().includes('unclear') ||
          item.calories === 0 ||
          item.confidence === 'low'
        );

        const overallLowConfidence = result.data.confidence === 'low' || hasLowConfidenceItems;

        if (overallLowConfidence || result.data.items.length === 0) {
          // AI had trouble - offer manual description option
          setAnalyzedData({
            ...result.data,
            totalImages: images.length,
            analysisNote: `AI had difficulty identifying some items from ${images.length} photo(s). Consider describing the meal manually.`,
            lowConfidence: true
          });
          toast.warning('AI had trouble identifying some items. Try describing your meal manually for better results!');
        } else {
          setAnalyzedData({
            ...result.data,
            totalImages: images.length,
            analysisNote: images.length > 1 ? 
              `Analyzed primary image from ${images.length} photos provided` :
              'Single image analysis'
          });
          toast.success(`✨ AI analyzed your meal from ${images.length} photo(s)! ${result.data.items.length} items detected.`);
        }
      } else {
        console.warn('⚠️ AI analysis failed, using fallback data:', result.error);
        setAnalyzedData({
          ...result.data,
          totalImages: images.length,
          analysisNote: `Analysis had issues with ${images.length} photo(s). Try describing your meal manually.`,
          lowConfidence: true
        });
        toast.warning('AI analysis had issues. Try describing your meal manually for better results!');
      }
    } catch (error) {
      console.error('❌ Image analysis completely failed:', error);
      // Fallback to original mock data
      setAnalyzedData({
        name: 'Mixed Meal (Analysis Failed)',
        totalImages: images.length,
        analysisNote: `Could not analyze ${images.length} photo(s). Please describe your meal manually.`,
        lowConfidence: true,
        items: [
          {
            id: '1',
            name: 'Food Item',
            servingSize: '1 portion',
            amountConsumed: 1,
            baseCalories: 300,
            baseProtein: 15,
            baseCarbs: 30,
            baseFat: 10,
            baseFiber: 3,
            calories: 300,
            protein: 15,
            carbs: 30,
            fat: 10,
            fiber: 3,
            isExpanded: false,
            brandName: ''
          },
        ],
      });
      toast.error('AI analysis failed. Please describe your meal manually for better results.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmMeal = () => {
    if (analyzedData) {
      onMealDetected(analyzedData);
      toast.success('Items added to your meal!');
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      {selectedImages.length === 0 ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50 ${
              isDragOver ? 'bg-green-50 border-green-400' : ''
            }`}
            style={{ borderColor: isDragOver ? '#1C7C54' : '#A8E6CF' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: isDragOver ? '#1C7C54' : '#E8F4F2' }}
            >
              <Upload className="w-10 h-10" style={{ color: isDragOver ? 'white' : '#1C7C54' }} />
            </div>
            <p className="mb-2" style={{ color: '#102A43' }}>
              {isDragOver ? 'Drop images here!' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-sm mb-4" style={{ color: '#102A43', opacity: 0.6 }}>
              Take multiple photos from different angles
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
              capture="environment"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
            <p className="text-sm mb-2" style={{ color: '#102A43' }}>
              <strong>📱 Multi-Angle Photo Tips:</strong>
            </p>
            <ul className="text-sm space-y-1" style={{ color: '#102A43', opacity: 0.8 }}>
              <li>• Upload 2-5 photos from different angles for better AI analysis</li>
              <li>• Include top-down view and side angles</li>
              <li>• Good lighting helps AI detect foods better</li>
              <li>• AI will analyze all photos for more accurate results</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          {/* Image Gallery */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative">
                <img 
                  src={image} 
                  alt={`Meal angle ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-lg border-2"
                  style={{ borderColor: index === 0 ? '#1C7C54' : '#E8F4F2' }}
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: '#1C7C54' }}>
                    Primary
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  {index + 1}/{selectedImages.length}
                </div>
              </div>
            ))}
          </div>

          {isAnalyzing ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 mx-auto mb-4"
              >
                <Sparkles className="w-12 h-12" style={{ color: '#1C7C54' }} />
              </motion.div>
              <p className="mb-1" style={{ color: '#102A43' }}>
                Analyzing your {selectedImages.length} photo(s)...
              </p>
              <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                AI is detecting foods from multiple angles
              </p>
            </div>
          ) : analyzedData ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
                <p className="text-sm mb-3" style={{ color: '#1C7C54' }}>
                  ✨ <strong>AI Detected {analyzedData.items.length} Items from {analyzedData.totalImages || selectedImages.length} photo(s):</strong>
                </p>
                {analyzedData.analysisNote && (
                  <p className="text-xs mb-3 italic" style={{ color: '#102A43', opacity: 0.7 }}>
                    {analyzedData.analysisNote}
                  </p>
                )}
                <ul className="space-y-1 text-sm" style={{ color: '#102A43' }}>
                  {analyzedData.items.map((item: any, idx: number) => (
                    <li key={idx}>
                      • {item.name} ({item.servingSize}) - {item.calories} kcal
                    </li>
                  ))}
                </ul>
              </div>

              {/* Low Confidence Helper */}
              {analyzedData.lowConfidence && (
                <div className="p-4 rounded-lg border-2" style={{ backgroundColor: '#FFF7ED', borderColor: '#F97316' }}>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">🤔</div>
                    <div className="flex-1">
                      <p className="text-sm mb-3" style={{ color: '#C2410C' }}>
                        <strong>Having trouble identifying your meal?</strong>
                      </p>
                      <p className="text-sm mb-3" style={{ color: '#102A43' }}>
                        Describe what you ate and let our AI chat help you get accurate nutrition data:
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs italic" style={{ color: '#102A43', opacity: 0.7 }}>
                          Example: "Grilled chicken breast with steamed broccoli and quinoa, about 6oz chicken, 1 cup broccoli, 1/2 cup quinoa"
                        </p>
                        <button
                          onClick={() => {
                            // Switch to AI tab and provide context
                            const aiTab = document.querySelector('[data-value="ai"]') as HTMLElement;
                            aiTab?.click();
                            toast.info('💬 Switched to AI Chat - describe your meal for better analysis!');
                          }}
                          className="w-full py-2 px-4 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#F97316' }}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Try AI Chat Instead
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedImages([]);
                    setAnalyzedData(null);
                  }}
                  className="flex-1 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#102A43' }}
                >
                  Take More Photos
                </button>
                <button
                  onClick={handleConfirmMeal}
                  className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1C7C54' }}
                >
                  <Check className="w-5 h-5" />
                  Use These Items
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Ask Food AI Tab
function AskFoodAITab({ onMealParsed }: any) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<any>(null);

  const handleAskAI = async () => {
    if (!userInput.trim()) {
      toast.error("Please describe your meal");
      return;
    }

    setIsProcessing(true);
    try {
      const aiResponse = await analyzeMealDescription(userInput);
      setParsedMeal(aiResponse);
      toast.success("AI parsed your meal into items!");
    } catch (err) {
      console.error("AI parsing error:", err);
      toast.error("AI couldn't understand your meal. Try again!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseItems = () => {
    if (parsedMeal) {
      onMealParsed(parsedMeal);
      toast.success('Items added to your meal!');
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <div className="space-y-5">
        <div>
          <Label htmlFor="ai-input">Describe what you ate</Label>
          <Textarea
            id="ai-input"
            placeholder="e.g., Protein shake with almond milk, 1 scoop whey, banana, and peanut butter"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskAI();
              }
            }}
            rows={4}
            className="mt-1.5"
            disabled={isProcessing}
          />
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
          <p className="text-sm mb-2" style={{ color: '#102A43' }}>
            <strong>💡 Describe your meal in detail:</strong>
          </p>
          <ul className="text-sm space-y-1" style={{ color: '#102A43', opacity: 0.8 }}>
            <li>• "6oz grilled chicken breast with 1 cup steamed broccoli and 1/2 cup quinoa"</li>
            <li>• "Large Caesar salad with romaine, croutons, parmesan, and 2 tbsp dressing"</li>
            <li>• "Protein shake: 1 cup almond milk, 1 scoop whey, 1 banana, 1 tbsp peanut butter"</li>
            <li>• "Homemade beef stir-fry with mixed vegetables and brown rice"</li>
            <li>• Include <strong>portion sizes</strong> and <strong>cooking methods</strong> for best results</li>
          </ul>
        </div>

        {!parsedMeal ? (
          <button
            onClick={handleAskAI}
            disabled={isProcessing}
            className="w-full py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: '#1C7C54' }}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Analyzing...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                Ask Food AI
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
              <p className="text-sm mb-3" style={{ color: '#1C7C54' }}>
                🤖 <strong>AI Parsed {parsedMeal.items.length} Items:</strong>
              </p>
              <ul className="space-y-2 text-sm" style={{ color: '#102A43' }}>
                {parsedMeal.items.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {item.name} ({item.portion})
                    </span>
                    <span className="opacity-70">{item.calories} kcal</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setParsedMeal(null);
                  setUserInput('');
                }}
                className="flex-1 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Try Again
              </button>
              <button
                onClick={handleUseItems}
                className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1C7C54' }}
              >
                <Check className="w-5 h-5" />
                Use These Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
