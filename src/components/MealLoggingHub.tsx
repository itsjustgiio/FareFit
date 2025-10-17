import { useState } from 'react';
import { X, Utensils, Camera, MessageSquare, Plus, Upload, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

interface MealLoggingHubProps {
  isOpen: boolean;
  onClose: () => void;
  onMealLogged: (meal: MealData) => void;
}

interface MealData {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  portion?: string;
  timestamp: Date;
}

export function MealLoggingHub({ isOpen, onClose, onMealLogged }: MealLoggingHubProps) {
  const [activeTab, setActiveTab] = useState('manual');
  
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8F4F2' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#A8E6CF' }}
            >
              <Utensils className="w-5 h-5" style={{ color: '#1C7C54' }} />
            </div>
            <div>
              <h2 className="text-xl" style={{ color: '#102A43' }}>Log Your Meal</h2>
              <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                Choose your preferred logging method
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-gray-100"
            style={{ color: '#102A43' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Manual Entry</span>
                <span className="sm:hidden">Manual</span>
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Photo Scan</span>
                <span className="sm:hidden">Scan</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Ask Food AI</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <ManualEntryTab onMealLogged={onMealLogged} onClose={onClose} />
            </TabsContent>

            <TabsContent value="scan">
              <PhotoScanTab onMealLogged={onMealLogged} onClose={onClose} />
            </TabsContent>

            <TabsContent value="ai">
              <AskFoodAITab onMealLogged={onMealLogged} onClose={onClose} />
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Manual Entry Tab
function ManualEntryTab({ onMealLogged, onClose }: { onMealLogged: (meal: MealData) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    portion: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.calories) {
      toast.error('Please fill in at least the food name and calories');
      return;
    }

    const meal: MealData = {
      id: Date.now().toString(),
      name: formData.name,
      mealType: formData.mealType,
      calories: parseFloat(formData.calories) || 0,
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fat: parseFloat(formData.fat) || 0,
      fiber: parseFloat(formData.fiber) || 0,
      portion: formData.portion,
      timestamp: new Date(),
    };

    onMealLogged(meal);
    toast.success(`✅ Meal logged successfully! ${meal.calories} kcal added.`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">Food Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Grilled Chicken Breast"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1.5"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mealType">Meal Type</Label>
          <Select value={formData.mealType} onValueChange={(value: any) => setFormData({ ...formData, mealType: value })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
              <SelectItem value="lunch">☀️ Lunch</SelectItem>
              <SelectItem value="dinner">🌙 Dinner</SelectItem>
              <SelectItem value="snack">🍪 Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="portion">Portion Size</Label>
          <Input
            id="portion"
            placeholder="e.g., 150g, 1 cup"
            value={formData.portion}
            onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="calories">Calories (kcal) *</Label>
          <Input
            id="calories"
            type="number"
            step="0.1"
            placeholder="420"
            value={formData.calories}
            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            className="mt-1.5"
            required
          />
        </div>

        <div>
          <Label htmlFor="protein">Protein (g)</Label>
          <Input
            id="protein"
            type="number"
            step="0.1"
            placeholder="35"
            value={formData.protein}
            onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="carbs">Carbs (g)</Label>
          <Input
            id="carbs"
            type="number"
            step="0.1"
            placeholder="45"
            value={formData.carbs}
            onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="fat">Fat (g)</Label>
          <Input
            id="fat"
            type="number"
            step="0.1"
            placeholder="12"
            value={formData.fat}
            onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="fiber">Fiber (g)</Label>
          <Input
            id="fiber"
            type="number"
            step="0.1"
            placeholder="5"
            value={formData.fiber}
            onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-lg border-2 transition-all hover:bg-gray-50"
          style={{ borderColor: '#A8E6CF', color: '#102A43' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1C7C54' }}
        >
          <Check className="w-5 h-5" />
          Save Meal
        </button>
      </div>
    </form>
  );
}

// Photo Scan Tab
function PhotoScanTab({ onMealLogged, onClose }: { onMealLogged: (meal: MealData) => void; onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<MealData> | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        // Simulate AI analysis
        simulateAIAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAIAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate AI processing delay
    setTimeout(() => {
      setAnalyzedData({
        name: 'Grilled Chicken Salad',
        mealType: 'lunch',
        calories: 420,
        protein: 35,
        carbs: 28,
        fat: 18,
        fiber: 6,
        portion: '1 bowl (~300g)',
      });
      setIsAnalyzing(false);
      toast.success('AI detected your meal! Review and confirm below.');
    }, 2000);
  };

  const handleConfirmMeal = () => {
    if (!analyzedData) return;

    const meal: MealData = {
      id: Date.now().toString(),
      name: analyzedData.name || 'Scanned Meal',
      mealType: analyzedData.mealType || 'lunch',
      calories: analyzedData.calories || 0,
      protein: analyzedData.protein || 0,
      carbs: analyzedData.carbs || 0,
      fat: analyzedData.fat || 0,
      fiber: analyzedData.fiber || 0,
      portion: analyzedData.portion,
      timestamp: new Date(),
    };

    onMealLogged(meal);
    toast.success(`✅ Meal logged successfully! ${meal.calories} kcal added.`);
    onClose();
  };

  return (
    <div className="space-y-5">
      {!selectedImage ? (
        <div>
          <label
            htmlFor="photo-upload"
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50"
            style={{ borderColor: '#A8E6CF' }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#E8F4F2' }}
            >
              <Upload className="w-8 h-8" style={{ color: '#1C7C54' }} />
            </div>
            <p className="mb-2" style={{ color: '#102A43' }}>
              Drag & drop or click to upload
            </p>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
              Take a photo of your meal or food packaging
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
            <p className="text-sm mb-2" style={{ color: '#102A43' }}>
              <strong>📸 Photo Tips:</strong>
            </p>
            <ul className="text-sm space-y-1" style={{ color: '#102A43', opacity: 0.8 }}>
              <li>• Good lighting helps AI detect foods better</li>
              <li>• Capture the entire plate or packaging label</li>
              <li>• Multiple items? The AI will identify each one</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <img 
            src={selectedImage} 
            alt="Uploaded meal" 
            className="w-full h-64 object-cover rounded-xl mb-4"
          />

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
                Analyzing your meal...
              </p>
              <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                AI is detecting foods and calculating nutrition
              </p>
            </div>
          ) : analyzedData ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
                <p className="text-sm mb-3" style={{ color: '#1C7C54' }}>
                  ✨ <strong>AI Detected:</strong>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: '#102A43' }}>Meal:</span>
                    <strong style={{ color: '#102A43' }}>{analyzedData.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#102A43' }}>Portion:</span>
                    <span style={{ color: '#102A43' }}>{analyzedData.portion}</span>
                  </div>
                  <div className="h-px" style={{ backgroundColor: '#A8E6CF' }}></div>
                  <div className="flex justify-between">
                    <span style={{ color: '#102A43' }}>Calories:</span>
                    <strong style={{ color: '#102A43' }}>{analyzedData.calories} kcal</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                      <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Protein</p>
                      <p style={{ color: '#102A43' }}>{analyzedData.protein}g</p>
                    </div>
                    <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                      <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Carbs</p>
                      <p style={{ color: '#102A43' }}>{analyzedData.carbs}g</p>
                    </div>
                    <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                      <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Fat</p>
                      <p style={{ color: '#102A43' }}>{analyzedData.fat}g</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalyzedData(null);
                  }}
                  className="flex-1 py-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                  style={{ borderColor: '#A8E6CF', color: '#102A43' }}
                >
                  Retake Photo
                </button>
                <button
                  onClick={handleConfirmMeal}
                  className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1C7C54' }}
                >
                  <Check className="w-5 h-5" />
                  Confirm & Save
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
function AskFoodAITab({ onMealLogged, onClose }: { onMealLogged: (meal: MealData) => void; onClose: () => void }) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<Partial<MealData> | null>(null);

  const handleAskAI = () => {
    if (!userInput.trim()) {
      toast.error('Please describe your meal');
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI parsing delay
    setTimeout(() => {
      // Mock AI response based on user input
      setParsedMeal({
        name: 'Eggs, Banana & Toast with Peanut Butter',
        mealType: 'breakfast',
        calories: 485,
        protein: 22,
        carbs: 52,
        fat: 18,
        fiber: 8,
        portion: '2 eggs, 1 banana, 2 toast slices, 2 tbsp peanut butter',
      });
      setIsProcessing(false);
      toast.success('AI parsed your meal! Review below.');
    }, 1500);
  };

  const handleEditAndSave = () => {
    if (!parsedMeal) return;

    const meal: MealData = {
      id: Date.now().toString(),
      name: parsedMeal.name || 'AI Parsed Meal',
      mealType: parsedMeal.mealType || 'lunch',
      calories: parsedMeal.calories || 0,
      protein: parsedMeal.protein || 0,
      carbs: parsedMeal.carbs || 0,
      fat: parsedMeal.fat || 0,
      fiber: parsedMeal.fiber || 0,
      portion: parsedMeal.portion,
      timestamp: new Date(),
    };

    onMealLogged(meal);
    toast.success(`✅ Meal logged successfully! ${meal.calories} kcal added.`);
    onClose();
  };

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="ai-input">Describe what you ate</Label>
        <Textarea
          id="ai-input"
          placeholder="e.g., I had 2 eggs, a banana, and toast with peanut butter"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={4}
          className="mt-1.5"
          disabled={isProcessing}
        />
      </div>

      <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
        <p className="text-sm mb-2" style={{ color: '#102A43' }}>
          <strong>💡 Examples:</strong>
        </p>
        <ul className="text-sm space-y-1" style={{ color: '#102A43', opacity: 0.8 }}>
          <li>• "Large chicken burrito with rice, beans, cheese"</li>
          <li>• "Greek yogurt with granola and blueberries"</li>
          <li>• "Protein shake with 1 scoop whey and almond milk"</li>
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
              🤖 <strong>AI Parsed Your Meal:</strong>
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>
                  Detected Items:
                </p>
                <p style={{ color: '#102A43' }}>{parsedMeal.portion}</p>
              </div>
              <div className="h-px" style={{ backgroundColor: '#A8E6CF' }}></div>
              <div className="flex justify-between">
                <span style={{ color: '#102A43' }}>Total Calories:</span>
                <strong style={{ color: '#102A43' }}>{parsedMeal.calories} kcal</strong>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2">
                <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Protein</p>
                  <p className="text-sm" style={{ color: '#102A43' }}>{parsedMeal.protein}g</p>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Carbs</p>
                  <p className="text-sm" style={{ color: '#102A43' }}>{parsedMeal.carbs}g</p>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Fat</p>
                  <p className="text-sm" style={{ color: '#102A43' }}>{parsedMeal.fat}g</p>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: 'white' }}>
                  <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>Fiber</p>
                  <p className="text-sm" style={{ color: '#102A43' }}>{parsedMeal.fiber}g</p>
                </div>
              </div>
            </div>
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
              onClick={handleEditAndSave}
              className="flex-1 py-3 rounded-lg text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1C7C54' }}
            >
              <Check className="w-5 h-5" />
              Save to Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
