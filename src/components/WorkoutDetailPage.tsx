import { useState } from 'react';
import { ArrowLeft, Edit, MessageCircle, Plus, Trash2, GripVertical, Save, TrendingUp, Target, Flame, Award, Clock, Calculator } from 'lucide-react';
import { Footer } from './Footer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  volume: number;
  notes: string;
  startTime?: string; // ISO timestamp when exercise started
  endTime?: string;   // ISO timestamp when exercise ended
}

export interface WorkoutData {
  workoutType: string;
  duration: number; // Auto-calculated from timestamps
  caloriesBurned: number; // Auto-calculated
  exercises: Exercise[];
  date: string;
  workoutStartTime?: string; // When workout started
  workoutEndTime?: string;   // When workout ended
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
  const [duration, setDuration] = useState(workoutData?.duration.toString() || '45');
  const [caloriesBurned, setCaloriesBurned] = useState(workoutData?.caloriesBurned.toString() || '517');
  const [isEditing, setIsEditing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>(workoutData?.exercises || []);
  
  // Calculate totals
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalReps = exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0);
  const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);

  // Progress data for chart
  const progressData = [
    { name: 'Mon', volume: 8500 },
    { name: 'Tue', volume: 0 },
    { name: 'Wed', volume: 9200 },
    { name: 'Thu', volume: 0 },
    { name: 'Fri', volume: 9550 },
    { name: 'Sat', volume: 0 },
    { name: 'Today', volume: totalVolume }
  ];

  // Muscle group distribution
  const muscleData = [
    { name: 'Chest', value: 45, color: '#1C7C54' },
    { name: 'Shoulders', value: 30, color: '#A8E6CF' },
    { name: 'Triceps', value: 25, color: '#FFB6B9' }
  ];

  // Preset workouts
  const presets = [
    { name: 'Push Day', exercises: ['Bench Press', 'Incline DB Press', 'Lateral Raises', 'Tricep Pushdowns'] },
    { name: 'Pull Day', exercises: ['Pull-ups', 'Barbell Rows', 'Lat Pulldown', 'Bicep Curls'] },
    { name: 'Leg Day', exercises: ['Squats', 'Romanian Deadlifts', 'Leg Press', 'Leg Curls'] }
  ];

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: 'New Exercise',
      sets: 3,
      reps: 10,
      weight: 0,
      volume: 0,
      notes: '',
      startTime: new Date().toISOString(),
      endTime: undefined
    };
    setExercises([...exercises, newExercise]);
    setIsEditing(true);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
    toast.success('Exercise removed');
  };

  const handleUpdateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => {
      if (ex.id === id) {
        const updated = { ...ex, [field]: value };
        // Recalculate volume if sets, reps, or weight changed
        if (field === 'sets' || field === 'reps' || field === 'weight') {
          updated.volume = updated.sets * updated.reps * updated.weight;
        }
        return updated;
      }
      return ex;
    }));
  };

  const handleSaveWorkout = () => {
    setIsEditing(false);
    
    const updatedWorkout: WorkoutData = {
      workoutType,
      duration: parseInt(duration) || 0,
      caloriesBurned: parseInt(caloriesBurned) || 0,
      exercises,
      date: new Date().toISOString()
    };
    
    onSaveWorkout(updatedWorkout);
    toast.success('Workout saved successfully! 💪');
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      const baseTime = new Date();
      const newExercises = preset.exercises.map((name, index) => ({
        id: Date.now().toString() + index,
        name,
        sets: 3,
        reps: 10,
        weight: 0,
        volume: 0,
        notes: '',
        startTime: new Date(baseTime.getTime() + index * 10 * 60000).toISOString(), // 10 min intervals
        endTime: new Date(baseTime.getTime() + (index + 1) * 10 * 60000).toISOString()
      }));
      setExercises(newExercises);
      setWorkoutType(presetName);
      setIsEditing(true);
      toast.success(`${presetName} preset loaded!`);
    }
  };

  // Calculate calories burned based on exercises and timestamps
  const handleCalculateCalories = () => {
    setIsCalculating(true);
    
    // Simulate AI calculation
    setTimeout(() => {
      // Calculate total duration from timestamps
      let calculatedDuration = 0;
      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;
      
      exercises.forEach(ex => {
        if (ex.startTime) {
          const start = new Date(ex.startTime);
          if (!earliestStart || start < earliestStart) {
            earliestStart = start;
          }
        }
        if (ex.endTime) {
          const end = new Date(ex.endTime);
          if (!latestEnd || end > latestEnd) {
            latestEnd = end;
          }
        }
      });
      
      if (earliestStart && latestEnd) {
        calculatedDuration = Math.round((latestEnd.getTime() - earliestStart.getTime()) / 60000); // minutes
      }
      
      // Calculate calories based on:
      // 1. Total volume lifted
      // 2. Exercise type (compound vs isolation)
      // 3. Duration
      // 4. Estimated intensity
      
      const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);
      const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
      
      // Compound exercises burn more calories
      const compoundExercises = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row', 'pull-up'];
      const compoundCount = exercises.filter(ex => 
        compoundExercises.some(compound => ex.name.toLowerCase().includes(compound))
      ).length;
      
      // Base calculation: ~5-8 calories per minute of strength training
      let baseCals = calculatedDuration * 6.5;
      
      // Bonus for volume (higher volume = more work)
      const volumeBonus = Math.min(totalVolume / 100, 200); // Cap at 200 bonus calories
      
      // Bonus for compound exercises (15% more per compound exercise)
      const compoundBonus = baseCals * (compoundCount * 0.15);
      
      const estimatedCalories = Math.round(baseCals + volumeBonus + compoundBonus);
      
      setDuration(calculatedDuration);
      setCaloriesBurned(estimatedCalories);
      setIsCalculating(false);
      
      toast.success(`Calculated: ${estimatedCalories} calories burned in ${calculatedDuration} minutes! 🔥`);
    }, 1500); // Simulate processing time
  };

  // Format time for display
  const formatTime = (isoString: string | undefined) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Set current time for exercise
  const handleSetTime = (id: string, field: 'startTime' | 'endTime') => {
    const currentTime = new Date().toISOString();
    handleUpdateExercise(id, field, currentTime);
    toast.success(`${field === 'startTime' ? 'Start' : 'End'} time set!`);
  };

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
        
        {/* 1. Workout Summary Card */}
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
                Thursday, October 16, 2025
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
                {duration > 0 ? 'minutes (calculated)' : 'not calculated'}
              </p>
            </div>
            
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Calories</p>
              <p className="text-2xl" style={{ color: caloriesBurned > 0 ? 'var(--farefit-primary)' : 'var(--farefit-text)' }}>
                {caloriesBurned > 0 ? caloriesBurned : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                {caloriesBurned > 0 ? 'burned (calculated)' : 'not calculated'}
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

        {/* 2. Exercise Log Section */}
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
                <strong>⏱️ How it works:</strong> Log your exercises with sets, reps, and weights. Click the clock icons to timestamp when you start and finish each exercise. When done, click <strong>"Calculate Calories"</strong> to automatically estimate calories burned and total duration based on your workout data!
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--farefit-secondary)' }}>
                  {isEditing && <th className="text-left p-3"></th>}
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Exercise</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Sets</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Reps</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Weight (lb)</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Volume (lb)</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Start Time</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>End Time</th>
                  <th className="text-left p-3" style={{ color: 'var(--farefit-text)' }}>Notes</th>
                  {isEditing && <th className="text-left p-3"></th>}
                </tr>
              </thead>
              <tbody>
                {exercises.map((exercise) => (
                  <tr key={exercise.id} style={{ borderBottom: '1px solid var(--farefit-border)' }}>
                    {isEditing && (
                      <td className="p-3">
                        <GripVertical className="w-4 h-4 cursor-move" style={{ color: 'var(--farefit-subtext)' }} />
                      </td>
                    )}
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          value={exercise.name}
                          onChange={(e) => handleUpdateExercise(exercise.id, 'name', e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <span style={{ color: 'var(--farefit-text)' }}>{exercise.name}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleUpdateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      ) : (
                        <span style={{ color: 'var(--farefit-text)' }}>{exercise.sets}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => handleUpdateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      ) : (
                        <span style={{ color: 'var(--farefit-text)' }}>{exercise.reps}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={exercise.weight}
                          onChange={(e) => handleUpdateExercise(exercise.id, 'weight', parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                      ) : (
                        <span style={{ color: 'var(--farefit-text)' }}>{exercise.weight}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span style={{ color: 'var(--farefit-primary)' }}>{(exercise.volume || 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <button
                          onClick={() => handleSetTime(exercise.id, 'startTime')}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                          style={{ color: 'var(--farefit-primary)' }}
                        >
                          <Clock className="w-3 h-3" />
                          {formatTime(exercise.startTime)}
                        </button>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--farefit-text)' }}>
                          {formatTime(exercise.startTime)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <button
                          onClick={() => handleSetTime(exercise.id, 'endTime')}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                          style={{ color: 'var(--farefit-accent)' }}
                        >
                          <Clock className="w-3 h-3" />
                          {formatTime(exercise.endTime)}
                        </button>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--farefit-text)' }}>
                          {formatTime(exercise.endTime)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          value={exercise.notes}
                          onChange={(e) => handleUpdateExercise(exercise.id, 'notes', e.target.value)}
                          placeholder="Add notes..."
                          className="w-full"
                        />
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>
                          {exercise.notes || '—'}
                        </span>
                      )}
                    </td>
                    {isEditing && (
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveExercise(exercise.id)}
                          className="p-2 rounded transition-colors"
                          style={{ color: 'var(--farefit-accent)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="border rounded-lg p-4 transition-colors duration-300"
                style={{ borderColor: 'var(--farefit-secondary)', backgroundColor: 'var(--farefit-card)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  {isEditing ? (
                    <Input
                      value={exercise.name}
                      onChange={(e) => handleUpdateExercise(exercise.id, 'name', e.target.value)}
                      className="flex-1 mr-2"
                    />
                  ) : (
                    <h4 className="m-0" style={{ color: 'var(--farefit-text)' }}>{exercise.name}</h4>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveExercise(exercise.id)}
                      className="p-2 rounded transition-colors"
                      style={{ color: 'var(--farefit-accent)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>Sets</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => handleUpdateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--farefit-text)' }}>{exercise.sets}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>Reps</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => handleUpdateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--farefit-text)' }}>{exercise.reps}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>Weight</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => handleUpdateExercise(exercise.id, 'weight', parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--farefit-text)' }}>{exercise.weight} lb</p>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>Volume</p>
                  <p className="text-sm" style={{ color: 'var(--farefit-primary)' }}>{(exercise.volume || 0).toLocaleString()} lb</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>Start Time</p>
                    {isEditing ? (
                      <button
                        onClick={() => handleSetTime(exercise.id, 'startTime')}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                        style={{ color: 'var(--farefit-primary)' }}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(exercise.startTime)}
                      </button>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--farefit-text)' }}>{formatTime(exercise.startTime)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>End Time</p>
                    {isEditing ? (
                      <button
                        onClick={() => handleSetTime(exercise.id, 'endTime')}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                        style={{ color: 'var(--farefit-accent)' }}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(exercise.endTime)}
                      </button>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--farefit-text)' }}>{formatTime(exercise.endTime)}</p>
                    )}
                  </div>
                </div>

                {(isEditing || exercise.notes) && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--farefit-subtext)' }}>Notes</p>
                    {isEditing ? (
                      <Textarea
                        value={exercise.notes}
                        onChange={(e) => handleUpdateExercise(exercise.id, 'notes', e.target.value)}
                        placeholder="Add notes..."
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>
                        {exercise.notes || '—'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div 
            className="mt-6 pt-4 flex justify-end gap-8 transition-colors duration-300"
            style={{ borderTop: '2px solid var(--farefit-primary)' }}
          >
            <div>
              <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>Total Volume</p>
              <p className="text-xl" style={{ color: 'var(--farefit-primary)' }}>{totalVolume.toLocaleString()} lb</p>
            </div>
          </div>
        </div>

        {/* 3. Analytics Section */}
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

        {/* 4. Workout Presets */}
        <div className="rounded-lg p-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
            <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>Workout Presets</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--farefit-subtext)' }}>
            Quickly load a workout template to save time logging
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleLoadPreset(preset.name)}
                className="p-4 border-2 rounded-lg hover:shadow-md transition-all text-left"
                style={{ borderColor: 'var(--farefit-secondary)' }}
              >
                <h4 className="mb-2" style={{ color: 'var(--farefit-text)' }}>{preset.name}</h4>
                <ul className="text-sm space-y-1" style={{ color: 'var(--farefit-subtext)' }}>
                  {preset.exercises.slice(0, 3).map((ex, idx) => (
                    <li key={idx}>• {ex}</li>
                  ))}
                  {preset.exercises.length > 3 && (
                    <li>+ {preset.exercises.length - 3} more</li>
                  )}
                </ul>
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--farefit-text)' }}>
              💡 <strong>Tip:</strong> Create custom presets by saving your current workout as a template
            </p>
          </div>
        </div>
      </div>

      <Footer onNavigate={() => {}} onFeedbackClick={() => {}} />
    </div>
  );
}