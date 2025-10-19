import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { WorkoutData } from './WorkoutDetailPage';

interface WorkoutCardProps {
  onCoachAIClick?: () => void;
  onViewWorkout?: () => void;
  workoutData?: WorkoutData | null;
}

export function WorkoutCard({ onCoachAIClick, onViewWorkout, workoutData }: WorkoutCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState(`Push Day - 1h 45m

Bench Press
- Set 1: 135 lbs x 12 reps
- Set 2: 185 lbs x 10 reps
- Set 3: 205 lbs x 8 reps

Triceps Extension
- Set 1: 60 lbs x 15 reps
- Set 2: 70 lbs x 12 reps
- Set 3: 70 lbs x 10 reps

Cardio
- Treadmill: 20 minutes
- Incline: 5%
- Speed: 6.5 mph`);

  // Calculate totals from workout data - these should always match the detail page
  const totalSets = workoutData?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) || 0;
  const totalVolume = workoutData?.exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((setSum, set) => setSum + set.volume, 0), 0) || 0;
  
  // Display values from workout data (no defaults - data should always be provided)
  const displayCalories = workoutData?.caloriesBurned || 0;
  const displayWorkoutType = workoutData?.workoutType || 'No workout logged';
  const displayDuration = workoutData?.duration || 0;
  
  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const handleSave = () => {
    toast.success('Workout saved!');
  };

  const handleLog = () => {
    toast.success('Sending to Coach AI to estimate calories burned...');
    setTimeout(() => {
      toast.success('Estimated 517 calories burned!');
      setIsEditorOpen(false);
    }, 1500);
  };

  return (
    <>
      <div 
        className="rounded-lg p-6 sm:p-8 transition-colors duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--farefit-primary) 0%, var(--farefit-primary) 100%)'
        }}
      >
        <h3 className="text-white mb-6">Workout Overview</h3>
        
        {!workoutData ? (
          <div className="text-center py-12">
            <div className="mb-4 text-5xl">💪</div>
            <p className="text-white mb-2 text-lg">
              No workout logged today
            </p>
            <p className="text-white opacity-70 text-sm mb-6">
              Get started by logging your first workout
            </p>
            <button 
              onClick={onViewWorkout}
              className="px-6 py-3 rounded-md text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 bg-white/20 hover:bg-white/30"
            >
              Log Workout
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-white opacity-90 text-sm mb-1">Calories Burned</p>
                <p className="text-white text-3xl">{displayCalories} kcal</p>
              </div>
              <div>
                <p className="text-white opacity-90 text-sm mb-1">Workout</p>
                <p className="text-white text-xl">{displayWorkoutType}</p>
              </div>
              <div>
                <p className="text-white opacity-90 text-sm mb-1">Duration</p>
                <p className="text-white text-xl">{formatDuration(displayDuration)}</p>
              </div>
              <div>
                <p className="text-white opacity-90 text-sm mb-1">Total Volume</p>
                <p className="text-white text-xl">{totalVolume.toLocaleString()} lb</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={onViewWorkout || (() => setIsEditorOpen(true))}
                className="px-6 py-3 rounded-md text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)' }}
              >
                View Workout
              </button>
              <button 
                onClick={onCoachAIClick}
                className="px-6 py-3 rounded-md text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md"
                style={{ backgroundColor: 'var(--farefit-accent)' }}
              >
                Ask Coach AI
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--farefit-text)' }}>Workout Editor</DialogTitle>
            <DialogDescription style={{ color: 'var(--farefit-subtext)' }}>
              Edit your workout details below. Click "Log" to send to Coach AI for calorie estimation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                className="min-h-[400px] font-mono"
                style={{ borderColor: 'var(--farefit-border)' }}
                placeholder="Enter your workout details..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--farefit-primary)' }}
              >
                Save
              </button>
              <button
                onClick={handleLog}
                className="px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--farefit-accent)' }}
              >
                Log & Estimate Calories
              </button>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-6 py-3 rounded-md border transition-all hover:opacity-70"
                style={{ borderColor: 'var(--farefit-border)', color: 'var(--farefit-text)' }}
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}