import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, MessageCircle, Plus, Trash2, GripVertical, Save, TrendingUp, Target, Flame, Award, Clock, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { Footer } from './Footer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getWorkoutExercises, setWorkoutExercises, checkAndClearDailyWorkout, updateUserFareScoreOnLog, getDateInEasternTimezone, getWorkoutHistory } from '../userService';
import { getAuth } from 'firebase/auth';

// Individual set data
interface SetData {
  id: string;
  reps: number;
  weight: number;
  volume: number;
}

interface Exercise {
  id: string;
  name: string;
  sets: SetData[]; // Now an array of sets
  notes: string;
  startTime?: string;
  endTime?: string;
  isExpanded: boolean; // For UI state
}

export interface WorkoutData {
  workoutType: string;
  duration: number;
  caloriesBurned: number;
  exercises: Exercise[];
  date: string;
  workoutStartTime?: string;
  workoutEndTime?: string;
}

interface WorkoutDetailPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
  onCoachAIClick: () => void;
  workoutData: WorkoutData | null;
  onSaveWorkout: (workout: WorkoutData) => void;
}

export function WorkoutDetailPage({ onBack, onCoachAIClick, workoutData, onSaveWorkout }: WorkoutDetailPageProps) {
  const [workoutType, setWorkoutType] = useState(workoutData?.workoutType || 'Push Day 💪');
  const [duration, setDuration] = useState(workoutData?.duration || 0);
  const [caloriesBurned, setCaloriesBurned] = useState(workoutData?.caloriesBurned || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState<{id: string, type: 'start' | 'end'} | null>(null);

  const auth = getAuth();
  
  // Calculate totals across all sets
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalReps = exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((setSum, set) => setSum + set.reps, 0), 0
  );
  const totalVolume = exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((setSum, set) => setSum + set.volume, 0), 0
  );

  useEffect(() => {
    loadTodayWorkout();
    checkAndClearDailyWorkout();
  }, []);

  const loadTodayWorkout = async () => {
    try {
      setIsLoading(true);
      const workoutData = await getWorkoutExercises();
      
      if (workoutData.workout.length > 0) {
        const todayWorkout = workoutData.workout[0];
        setWorkoutType(todayWorkout.day_type || 'Push Day 💪');
        setDuration(todayWorkout.duration || 0);
        setCaloriesBurned(todayWorkout.calories_burned || 0);
        
        // Transform exercises - check if sets is array or number
        const transformedExercises: Exercise[] = todayWorkout.exercises.map((ex: any, index: number) => {
          let setsArray: SetData[];
          
          // Handle both old format (single set data) and new format (array of sets)
          if (Array.isArray(ex.sets)) {
            setsArray = ex.sets;
          } else {
            // Convert old format to new format
            setsArray = [{
              id: `${index}-1`,
              reps: ex.reps || 0,
              weight: ex.weight || 0,
              volume: ex.volume || 0
            }];
          }
          
          return {
            id: ex.id || `exercise-${Date.now()}-${index}`,
            name: ex.name || 'New Exercise',
            sets: setsArray,
            notes: ex.notes || '',
            startTime: ex.startTime || undefined,
            endTime: ex.endTime || undefined,
            isExpanded: false
          };
        });
        
        setExercises(transformedExercises);
      } else {
        setExercises([]);
        setDuration(0);
        setCaloriesBurned(0);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      toast.error('Failed to load workout data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreviousWorkout = async (workoutTypeKeyword: string) => {
    try {
      console.log(`🔍 Looking for previous ${workoutTypeKeyword} workout...`);
      const history = await getWorkoutHistory();
      console.log('📚 Workout history:', history);
      
      // Find the most recent workout matching the type
      const previousWorkout = history.find(workout => {
        const matchFound = workout.day_type?.toLowerCase().includes(workoutTypeKeyword.toLowerCase());
        console.log(`Checking workout: ${workout.day_type} - Match: ${matchFound}`);
        return matchFound;
      });
      
      if (!previousWorkout) {
        toast.error(`No previous ${workoutTypeKeyword} Day workout found`);
        console.log(`❌ No ${workoutTypeKeyword} workout found in history`);
        return;
      }

      console.log('✅ Found previous workout:', previousWorkout);

      // Transform the exercises
      const transformedExercises: Exercise[] = previousWorkout.exercises.map((ex: any, index: number) => {
        let setsArray: SetData[];
        
        if (Array.isArray(ex.sets)) {
          setsArray = ex.sets.map((set: any, setIndex: number) => ({
            id: `${Date.now()}-${index}-${setIndex}`,
            reps: set.reps || 0,
            weight: set.weight || 0,
            volume: set.volume || 0
          }));
        } else {
          setsArray = [{
            id: `${Date.now()}-${index}-1`,
            reps: ex.reps || 0,
            weight: ex.weight || 0,
            volume: ex.volume || 0
          }];
        }
        
        return {
          id: `exercise-${Date.now()}-${index}`,
          name: ex.name || 'New Exercise',
          sets: setsArray,
          notes: ex.notes || '',
          startTime: undefined, // Reset times for new workout
          endTime: undefined,
          isExpanded: false
        };
      });

      setExercises(transformedExercises);
      setWorkoutType(previousWorkout.day_type || `${workoutTypeKeyword} Day`);
      setDuration(0); // Reset duration
      setCaloriesBurned(0); // Reset calories
      setIsEditing(true);
      
      toast.success(`Loaded previous ${workoutTypeKeyword} Day workout! 💪`);
    } catch (error) {
      console.error('Error loading previous workout:', error);
      toast.error('Failed to load previous workout');
    }
  };

  const progressData = [
    { name: 'Mon', volume: 8500 },
    { name: 'Tue', volume: 0 },
    { name: 'Wed', volume: 9200 },
    { name: 'Thu', volume: 0 },
    { name: 'Fri', volume: 9550 },
    { name: 'Sat', volume: 0 },
    { name: 'Today', volume: totalVolume }
  ];

  const muscleData = [
    { name: 'Chest', value: 45, color: '#1C7C54' },
    { name: 'Shoulders', value: 30, color: '#A8E6CF' },
    { name: 'Triceps', value: 25, color: '#FFB6B9' }
  ];

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: 'New Exercise',
      sets: [{ id: `${Date.now()}-1`, reps: 10, weight: 0, volume: 0 }],
      notes: '',
      startTime: undefined,
      endTime: undefined,
      isExpanded: true
    };
    setExercises([...exercises, newExercise]);
    setIsEditing(true);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
    toast.success('Exercise removed');
  };

  const handleUpdateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, name } : ex));
  };

  const handleUpdateExerciseNotes = (id: string, notes: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, notes } : ex));
  };

  const handleUpdateExerciseTime = (id: string, field: 'startTime' | 'endTime', value: string | undefined) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const toggleExpand = (id: string) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, isExpanded: !ex.isExpanded } : ex
    ));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: SetData = {
          id: `${exerciseId}-${Date.now()}`,
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 0,
          volume: (lastSet?.reps || 10) * (lastSet?.weight || 0)
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId && ex.sets.length > 1) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              const updated = { ...set, [field]: value };
              updated.volume = updated.reps * updated.weight;
              return updated;
            }
            return set;
          })
        };
      }
      return ex;
    }));
  };

  const getExerciseTotals = (exercise: Exercise) => {
    const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
    const totalVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
    return { totalReps, totalVolume };
  };

  const handleSaveWorkout = async () => {
    try {
      setIsEditing(false);
      
      // Transform to database format - flatten sets for storage
      const workoutToSave: any = {
        day_type: workoutType,
        duration: duration || 0,
        calories_burned: caloriesBurned || 0,
        total_sets: totalSets,
        total_reps: totalReps,
        volume: totalVolume,
        exercises: exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets, // Store the full sets array
          notes: ex.notes,
          startTime: ex.startTime || null,
          endTime: ex.endTime || null
        })),
        date: getTodayEST()
      };
      
      console.log('💾 Saving workout:', JSON.stringify(workoutToSave, null, 2));
      
      await setWorkoutExercises(workoutToSave);
      
      const userId = auth.currentUser?.uid;
      if (userId) {
        await updateUserFareScoreOnLog(userId, 'logged_workout');
      }
      
      toast.success('Workout saved successfully! 💪');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    }
  };

  const handleSetCurrentTime = (id: string, field: 'startTime' | 'endTime') => {
    const currentTime = new Date().toISOString();
    handleUpdateExerciseTime(id, field, currentTime);
    toast.success(`${field === 'startTime' ? 'Start' : 'End'} time set!`);
  };

  const handleCustomTime = (id: string, type: 'startTime' | 'endTime', timeString: string) => {
    if (!timeString) {
      handleUpdateExerciseTime(id, type, undefined);
      return;
    }

    const today = new Date();
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period) {
      if (period.toLowerCase() === 'pm' && hours < 12) hours += 12;
      else if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
    }

    const customDate = new Date(today);
    customDate.setHours(hours, minutes, 0, 0);

    const currentHour = today.getHours();
    if (currentHour < 6 && hours >= 20) {
      customDate.setDate(customDate.getDate() - 1);
    }

    handleUpdateExerciseTime(id, type, customDate.toISOString());
    setShowTimePicker(null);
    toast.success(`${type === 'startTime' ? 'Start' : 'End'} time set!`);
  };

  const formatTime = (isoString: string | undefined) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTimeForInput = (isoString: string | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleCalculateCalories = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      let calculatedDuration = 0;
      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;

      for (const ex of exercises) {
        if (ex.startTime) {
          const start = new Date(ex.startTime);
          if (!isNaN(start.getTime())) {
            if (!earliestStart || start.getTime() < earliestStart.getTime()) {
              earliestStart = start;
            }
          }
        }

        if (ex.endTime) {
          const end = new Date(ex.endTime);
          if (!isNaN(end.getTime())) {
            if (!latestEnd || end.getTime() > latestEnd.getTime()) {
              latestEnd = end;
            }
          }
        }
      }

      if (earliestStart && latestEnd) {
        calculatedDuration = Math.round((latestEnd.getTime() - earliestStart.getTime()) / 60000);
      }
      
      const compoundExercises = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row', 'pull-up'];
      const compoundCount = exercises.filter(ex => 
        compoundExercises.some(compound => ex.name.toLowerCase().includes(compound))
      ).length;
      
      let baseCals = calculatedDuration * 6.5;
      const volumeBonus = Math.min(totalVolume / 100, 200);
      const compoundBonus = baseCals * (compoundCount * 0.15);
      
      const estimatedCalories = Math.round(baseCals + volumeBonus + compoundBonus);
      
      setDuration(calculatedDuration);
      setCaloriesBurned(estimatedCalories);
      setIsCalculating(false);
      
      toast.success(`Calculated: ${estimatedCalories} calories in ${calculatedDuration} minutes! 🔥`);
      
      if (exercises.length > 0) {
        handleSaveWorkout();
      }
    }, 1500);
  };

  const getTodayEST = (): string => {
    return getDateInEasternTimezone();
  };

  const TimePicker = ({ exerciseId, type, currentTime }: { exerciseId: string, type: 'start' | 'end', currentTime: string }) => {
    const [timeValue, setTimeValue] = useState(currentTime || '');

    return (
      <div className="absolute z-10 mt-2 p-4 rounded-lg shadow-lg border transition-colors duration-300"
           style={{ backgroundColor: 'var(--farefit-card)', borderColor: 'var(--farefit-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4" style={{ color: 'var(--farefit-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--farefit-text)' }}>
            Set {type === 'start' ? 'Start' : 'End'} Time
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => handleSetCurrentTime(exerciseId, type === 'start' ? 'startTime' : 'endTime')}
            size="sm"
            style={{ backgroundColor: 'var(--farefit-primary)', color: 'white' }}
          >
            Now
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleCustomTime(exerciseId, type === 'start' ? 'startTime' : 'endTime', timeValue)}
            size="sm"
            className="flex-1"
            style={{ backgroundColor: 'var(--farefit-accent)', color: 'white' }}
          >
            Set Time
          </Button>
          <Button
            onClick={() => setShowTimePicker(null)}
            size="sm"
            variant="outline"
            style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--farefit-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--farefit-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--farefit-text)' }}>Loading your workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 sm:px-6 lg:px-8 py-4 transition-colors duration-300"
        style={{ backgroundColor: 'var(--farefit-primary)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-white border border-white/30 hover:bg-white/10 transition-all"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit Workout'}</span>
              </button>
              {isEditing && (
                <>
                  <button
                    onClick={handleCalculateCalories}
                    disabled={isCalculating}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-white transition-all disabled:opacity-50"
                    style={{ backgroundColor: 'var(--farefit-accent)' }}
                  >
                    <Calculator className="w-4 h-4" />
                    <span className="hidden sm:inline">{isCalculating ? 'Calculating...' : 'Calculate Calories'}</span>
                  </button>
                  <button
                    onClick={handleSaveWorkout}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-white hover:opacity-90 transition-all"
                    style={{ backgroundColor: 'var(--farefit-primary)' }}
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-16">
        
        {/* Workout Summary Card */}
        <div className="rounded-lg p-6 mb-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              {isEditing ? (
                <Input
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="text-2xl border-2 mb-2"
                  style={{ borderColor: 'var(--farefit-primary)', color: 'var(--farefit-text)' }}
                />
              ) : (
                <h1 className="mb-2" style={{ color: 'var(--farefit-text)' }}>{workoutType}</h1>
              )}
              <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <button
              onClick={onCoachAIClick}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--farefit-accent)' }}
            >
              <MessageCircle className="w-4 h-4" />
              Ask Coach AI
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Duration</p>
              <p className="text-2xl" style={{ color: duration > 0 ? 'var(--farefit-primary)' : 'var(--farefit-text)' }}>
                {duration > 0 ? duration : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                {duration > 0 ? 'minutes' : 'not calculated'}
              </p>
            </div>
            
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Calories</p>
              <p className="text-2xl" style={{ color: caloriesBurned > 0 ? 'var(--farefit-primary)' : 'var(--farefit-text)' }}>
                {caloriesBurned > 0 ? caloriesBurned : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                {caloriesBurned > 0 ? 'burned' : 'not calculated'}
              </p>
            </div>
            
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Total Sets</p>
              <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{totalSets}</p>
              <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>sets</p>
            </div>
            
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Total Reps</p>
              <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{totalReps}</p>
              <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>reps</p>
            </div>
            
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Volume</p>
              <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{totalVolume.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>lb</p>
            </div>
          </div>
        </div>

        {/* Exercise Log Section */}
        <div className="rounded-lg p-6 mb-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="m-0" style={{ color: 'var(--farefit-text)' }}>Exercise Log</h2>
            {isEditing && (
              <Button
                onClick={handleAddExercise}
                className="flex items-center gap-2"
                style={{ backgroundColor: 'var(--farefit-primary)', color: 'white' }}
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </Button>
            )}
          </div>

          {/* Info Box */}
          {isEditing && (
            <div className="mb-4 p-4 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)', border: '1px solid var(--farefit-secondary)' }}>
              <p className="text-sm m-0" style={{ color: 'var(--farefit-text)' }}>
                <strong>⏱️ How it works:</strong> Click an exercise to expand and add multiple sets with different reps/weights. Set start and end times for each exercise. Click <strong>"Calculate Calories"</strong> to automatically estimate calories and duration. All totals are summed automatically!
              </p>
            </div>
          )}

          {/* Exercise Cards */}
          <div className="space-y-4">
            {exercises.map((exercise) => {
              const { totalReps: exReps, totalVolume: exVolume } = getExerciseTotals(exercise);
              
              return (
                <div key={exercise.id} className="border rounded-lg overflow-hidden transition-colors duration-300" style={{ borderColor: 'var(--farefit-secondary)', backgroundColor: 'var(--farefit-card)' }}>
                  {/* Exercise Header */}
                  <div className="p-4" style={{ backgroundColor: 'var(--farefit-bg)' }}>
                    <div className="flex items-center gap-3">
                      {isEditing && <GripVertical className="w-5 h-5 cursor-move" style={{ color: 'var(--farefit-subtext)' }} />}
                      
                      <div className="flex-1">
                        {isEditing ? (
                          <Input
                            value={exercise.name}
                            onChange={(e) => handleUpdateExerciseName(exercise.id, e.target.value)}
                            className="font-semibold mb-2"
                            style={{ color: 'var(--farefit-text)' }}
                          />
                        ) : (
                          <h3 className="m-0 mb-2" style={{ color: 'var(--farefit-text)' }}>{exercise.name}</h3>
                        )}
                        
                        <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: 'var(--farefit-subtext)' }}>
                          <span>{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{exReps} total reps</span>
                          <span>•</span>
                          <span className="font-medium" style={{ color: 'var(--farefit-primary)' }}>{exVolume.toLocaleString()} lb</span>
                          
                          {(exercise.startTime || exercise.endTime) && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(exercise.startTime)} - {formatTime(exercise.endTime)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(exercise.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--farefit-text)' }}
                      >
                        {exercise.isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {isEditing && (
                        <button
                          onClick={() => handleRemoveExercise(exercise.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--farefit-accent)' }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Sets View */}
                  {exercise.isExpanded && (
                    <div className="p-4 space-y-3">
                      {exercise.sets.map((set, index) => (
                        <div key={set.id} className="flex items-center gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--farefit-secondary)' }}>
                          <span className="text-sm font-medium w-16" style={{ color: 'var(--farefit-subtext)' }}>
                            Set {index + 1}
                          </span>

                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs block mb-1" style={{ color: 'var(--farefit-subtext)' }}>Reps</label>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                                  className="w-full"
                                />
                              ) : (
                                <div className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}>
                                  {set.reps}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-xs block mb-1" style={{ color: 'var(--farefit-subtext)' }}>Weight (lb)</label>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseInt(e.target.value) || 0)}
                                  className="w-full"
                                />
                              ) : (
                                <div className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}>
                                  {set.weight}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-xs block mb-1" style={{ color: 'var(--farefit-subtext)' }}>Volume</label>
                              <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--farefit-bg)', color: 'var(--farefit-primary)' }}>
                                {set.volume.toLocaleString()} lb
                              </div>
                            </div>
                          </div>

                          {isEditing && exercise.sets.length > 1 && (
                            <button
                              onClick={() => removeSet(exercise.id, set.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: 'var(--farefit-accent)' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <button
                          onClick={() => addSet(exercise.id)}
                          className="w-full py-2 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors"
                          style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-subtext)' }}
                        >
                          <Plus className="w-4 h-4" />
                          Add Set
                        </button>
                      )}

                      {/* Time and Notes Section */}
                      <div className="pt-3 mt-3 space-y-3" style={{ borderTop: '1px solid var(--farefit-secondary)' }}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <label className="text-xs block mb-1" style={{ color: 'var(--farefit-subtext)' }}>Start Time</label>
                            {isEditing ? (
                              <div className="relative">
                                <button
                                  onClick={() => setShowTimePicker(showTimePicker?.id === exercise.id && showTimePicker.type === 'start' ? null : { id: exercise.id, type: 'start' })}
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm w-full border transition-colors"
                                  style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-primary)' }}
                                >
                                  <Clock className="w-3 h-3" />
                                  {formatTime(exercise.startTime)}
                                </button>
                                {showTimePicker?.id === exercise.id && showTimePicker.type === 'start' && (
                                  <TimePicker 
                                    exerciseId={exercise.id} 
                                    type="start" 
                                    currentTime={getTimeForInput(exercise.startTime)} 
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}>
                                {formatTime(exercise.startTime)}
                              </div>
                            )}
                          </div>
                          
                          <div className="relative">
                            <label className="text-xs block mb-1" style={{ color: 'var(--farefit-subtext)' }}>End Time</label>
                            {isEditing ? (
                              <div className="relative">
                                <button
                                  onClick={() => setShowTimePicker(showTimePicker?.id === exercise.id && showTimePicker.type === 'end' ? null : { id: exercise.id, type: 'end' })}
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm w-full border transition-colors"
                                  style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-accent)' }}
                                >
                                  <Clock className="w-3 h-3" />
                                  {formatTime(exercise.endTime)}
                                </button>
                                {showTimePicker?.id === exercise.id && showTimePicker.type === 'end' && (
                                  <TimePicker 
                                    exerciseId={exercise.id} 
                                    type="end" 
                                    currentTime={getTimeForInput(exercise.endTime)} 
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}>
                                {formatTime(exercise.endTime)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs block mb-1" style={{ color: 'var(--farefit-subtext)' }}>Notes</label>
                          {isEditing ? (
                            <Textarea
                              value={exercise.notes}
                              onChange={(e) => handleUpdateExerciseNotes(exercise.id, e.target.value)}
                              placeholder="Add notes about this exercise..."
                              rows={2}
                            />
                          ) : (
                            <div className="px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}>
                              {exercise.notes || '—'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {exercises.length === 0 && (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: 'var(--farefit-subtext)' }}>No exercises yet. Start by adding one!</p>
              <Button
                onClick={handleAddExercise}
                className="inline-flex items-center gap-2"
                style={{ backgroundColor: 'var(--farefit-primary)', color: 'white' }}
              >
                <Plus className="w-5 h-5" />
                Add Your First Exercise
              </Button>
            </div>
          )}

          {/* Total Summary */}
          {exercises.length > 0 && (
            <div 
              className="mt-6 pt-4 flex justify-end gap-8 transition-colors duration-300"
              style={{ borderTop: '2px solid var(--farefit-primary)' }}
            >
              <div>
                <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>Total Volume</p>
                <p className="text-xl" style={{ color: 'var(--farefit-primary)' }}>{totalVolume.toLocaleString()} lb</p>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Volume Progress Chart */}
          <div className="rounded-lg p-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
              <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>Volume Progress</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--farefit-border)" />
                <XAxis dataKey="name" stroke="var(--farefit-subtext)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--farefit-subtext)" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--farefit-card)', border: '1px solid var(--farefit-secondary)', borderRadius: '8px', color: 'var(--farefit-text)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="var(--farefit-primary)" 
                  strokeWidth={3}
                  dot={{ fill: 'var(--farefit-primary)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-center mt-2" style={{ color: 'var(--farefit-subtext)' }}>
              Last 7 Push Days
            </p>
          </div>

          {/* Muscle Group Distribution */}
          <div className="rounded-lg p-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
              <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>Muscle Focus</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={muscleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {muscleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-sm text-center mt-2" style={{ color: 'var(--farefit-subtext)' }}>
              Today's workout distribution
            </p>
          </div>
        </div>

        {/* Workout Streak */}
        <div className="rounded-lg p-6 mb-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5" style={{ color: 'var(--farefit-accent)' }} />
            <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>Weekly Progress</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: '80%', backgroundColor: 'var(--farefit-primary)' }}
                />
              </div>
            </div>
            <p className="text-xl" style={{ color: 'var(--farefit-primary)' }}>4/5</p>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--farefit-subtext)' }}>
            🔥 4 workouts this week — Keep the streak alive!
          </p>
        </div>

        {/* Load Previous Workout */}
        {exercises.length === 0 && (
          <div className="rounded-lg p-6 mb-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
              <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>Load Previous Workout</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--farefit-subtext)' }}>
              Quickly load your last workout to save time logging
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleLoadPreviousWorkout('Push')}
                className="p-4 border-2 rounded-lg hover:shadow-md transition-all text-center"
                style={{ borderColor: 'var(--farefit-secondary)', backgroundColor: 'var(--farefit-bg)' }}
              >
                <div className="text-3xl mb-2">💪</div>
                <h4 className="mb-1" style={{ color: 'var(--farefit-text)' }}>Load Push Day</h4>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                  Load your most recent push workout
                </p>
              </button>

              <button
                onClick={() => handleLoadPreviousWorkout('Pull')}
                className="p-4 border-2 rounded-lg hover:shadow-md transition-all text-center"
                style={{ borderColor: 'var(--farefit-secondary)', backgroundColor: 'var(--farefit-bg)' }}
              >
                <div className="text-3xl mb-2">🏋️</div>
                <h4 className="mb-1" style={{ color: 'var(--farefit-text)' }}>Load Pull Day</h4>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                  Load your most recent pull workout
                </p>
              </button>

              <button
                onClick={() => handleLoadPreviousWorkout('Leg')}
                className="p-4 border-2 rounded-lg hover:shadow-md transition-all text-center"
                style={{ borderColor: 'var(--farefit-secondary)', backgroundColor: 'var(--farefit-bg)' }}
              >
                <div className="text-3xl mb-2">🦵</div>
                <h4 className="mb-1" style={{ color: 'var(--farefit-text)' }}>Load Leg Day</h4>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                  Load your most recent leg workout
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={() => {}} onFeedbackClick={() => {}} />
    </div>
  );
}