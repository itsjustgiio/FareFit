/**
 * Workout Analysis Service
 * Analyzes user workout history to provide insights and recommendations
 */

interface Exercise {
  name: string;
  sets: Array<{
    reps: number;
    weight: number;
    volume?: number;
  }>;
  notes?: string;
  startTime?: string;
  endTime?: string;
}

interface Workout {
  day_type: string;
  duration: number;
  calories_burned: number;
  exercises: Exercise[];
  date: string;
}

interface WorkoutAnalysis {
  totalWorkouts: number;
  totalExercises: number;
  totalVolume: number;
  averageDuration: number;
  exerciseFrequency: { [exercise: string]: number };
  strengthProgress: { [exercise: string]: StrengthProgress };
  plateaus: PlateauDetection[];
  recommendations: string[];
  lastWorkoutDate: string | null;
  daysSinceLastWorkout: number;
}

interface StrengthProgress {
  exercise: string;
  firstWorkout: {
    date: string;
    maxWeight: number;
    totalVolume: number;
  };
  lastWorkout: {
    date: string;
    maxWeight: number;
    totalVolume: number;
  };
  weightProgress: number; // percentage change
  volumeProgress: number; // percentage change
  estimatedOneRepMax: number;
}

interface PlateauDetection {
  exercise: string;
  workoutsStuck: number;
  currentWeight: number;
  suggestion: string;
}

/**
 * Calculate estimated One Rep Max using Epley formula
 * 1RM = weight × (1 + reps / 30)
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Analyze complete workout history
 */
export function analyzeWorkoutHistory(workouts: Workout[]): WorkoutAnalysis {
  if (!workouts || workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalExercises: 0,
      totalVolume: 0,
      averageDuration: 0,
      exerciseFrequency: {},
      strengthProgress: {},
      plateaus: [],
      recommendations: ['Start logging workouts to get personalized insights!'],
      lastWorkoutDate: null,
      daysSinceLastWorkout: 0,
    };
  }

  // Sort workouts by date (oldest to newest)
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalWorkouts = workouts.length;
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const averageDuration = Math.round(totalDuration / totalWorkouts);

  // Track exercise frequency
  const exerciseFrequency: { [exercise: string]: number } = {};
  const exerciseHistory: { [exercise: string]: Array<{ date: string; workout: Workout; exercise: Exercise }> } = {};

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      // Skip exercises with invalid names
      if (!exercise.name || typeof exercise.name !== 'string') {
        console.warn('⚠️ Skipping exercise with invalid name:', exercise);
        return;
      }

      const exerciseName = exercise.name.toLowerCase();
      exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1;

      if (!exerciseHistory[exerciseName]) {
        exerciseHistory[exerciseName] = [];
      }
      exerciseHistory[exerciseName].push({
        date: workout.date,
        workout,
        exercise,
      });
    });
  });

  // Calculate total volume
  let totalVolume = 0;
  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      // Skip exercises with invalid data
      if (!exercise.sets || !Array.isArray(exercise.sets)) {
        return;
      }
      exercise.sets.forEach((set) => {
        totalVolume += (set.reps || 0) * (set.weight || 0);
      });
    });
  });

  // Analyze strength progress for each exercise
  const strengthProgress: { [exercise: string]: StrengthProgress } = {};
  Object.entries(exerciseHistory).forEach(([exerciseName, history]) => {
    if (history.length < 2) return; // Need at least 2 workouts to track progress

    const first = history[0];
    const last = history[history.length - 1];

    // Calculate max weight and volume for first workout
    const firstMaxWeight = Math.max(...first.exercise.sets.map((s) => s.weight || 0));
    const firstTotalVolume = first.exercise.sets.reduce(
      (sum, set) => sum + (set.reps || 0) * (set.weight || 0),
      0
    );

    // Calculate max weight and volume for last workout
    const lastMaxWeight = Math.max(...last.exercise.sets.map((s) => s.weight || 0));
    const lastTotalVolume = last.exercise.sets.reduce(
      (sum, set) => sum + (set.reps || 0) * (set.weight || 0),
      0
    );

    // Find best set (highest weight × reps) for 1RM estimate
    let bestWeight = 0;
    let bestReps = 0;
    last.exercise.sets.forEach((set) => {
      if ((set.weight || 0) * (set.reps || 0) > bestWeight * bestReps) {
        bestWeight = set.weight || 0;
        bestReps = set.reps || 0;
      }
    });

    const weightProgress = firstMaxWeight > 0
      ? ((lastMaxWeight - firstMaxWeight) / firstMaxWeight) * 100
      : 0;
    const volumeProgress = firstTotalVolume > 0
      ? ((lastTotalVolume - firstTotalVolume) / firstTotalVolume) * 100
      : 0;

    strengthProgress[exerciseName] = {
      exercise: exerciseName,
      firstWorkout: {
        date: first.date,
        maxWeight: firstMaxWeight,
        totalVolume: firstTotalVolume,
      },
      lastWorkout: {
        date: last.date,
        maxWeight: lastMaxWeight,
        totalVolume: lastTotalVolume,
      },
      weightProgress: Math.round(weightProgress),
      volumeProgress: Math.round(volumeProgress),
      estimatedOneRepMax: calculateOneRepMax(bestWeight, bestReps),
    };
  });

  // Detect plateaus (no progress in last 3+ workouts)
  const plateaus: PlateauDetection[] = [];
  Object.entries(exerciseHistory).forEach(([exerciseName, history]) => {
    if (history.length < 3) return;

    const recentWorkouts = history.slice(-3);
    const weights = recentWorkouts.map((h) =>
      Math.max(...h.exercise.sets.map((s) => s.weight || 0))
    );

    // Check if all weights are the same (no progress)
    const isPlateaued = weights.every((w) => w === weights[0]);

    if (isPlateaued) {
      const currentWeight = weights[0];
      const suggestedWeight = Math.round(currentWeight * 1.05); // 5% increase

      plateaus.push({
        exercise: exerciseName,
        workoutsStuck: 3,
        currentWeight,
        suggestion: `Try ${suggestedWeight}lbs or change rep range (currently stuck at ${currentWeight}lbs)`,
      });
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];

  // Check for volume overload
  const recentVolume = sortedWorkouts.slice(-7).reduce((sum, w) => {
    return (
      sum +
      w.exercises.reduce((exSum, ex) => {
        return (
          exSum +
          ex.sets.reduce((setSum, set) => setSum + (set.reps || 0) * (set.weight || 0), 0)
        );
      }, 0)
    );
  }, 0);

  if (recentVolume > 50000 && sortedWorkouts.length > 7) {
    recommendations.push('Consider a deload week - your training volume is very high');
  }

  // Check for exercise variety
  const uniqueExercises = Object.keys(exerciseFrequency).length;
  if (uniqueExercises < 5 && totalWorkouts > 5) {
    recommendations.push('Add more exercise variety to target different muscle groups');
  }

  // Check for imbalances (push vs pull)
  const pushExercises = ['bench press', 'overhead press', 'shoulder press', 'push up'];
  const pullExercises = ['pull up', 'chin up', 'row', 'lat pulldown', 'deadlift'];

  let pushCount = 0;
  let pullCount = 0;

  Object.entries(exerciseFrequency).forEach(([exercise, count]) => {
    if (pushExercises.some((p) => exercise.includes(p))) pushCount += count;
    if (pullExercises.some((p) => exercise.includes(p))) pullCount += count;
  });

  if (pushCount > pullCount * 1.5) {
    recommendations.push('You have push/pull imbalance - add more pulling exercises (rows, pull-ups)');
  }

  // Last workout date
  const lastWorkout = sortedWorkouts[sortedWorkouts.length - 1];
  const lastWorkoutDate = lastWorkout?.date || null;
  const daysSinceLastWorkout = lastWorkoutDate
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (daysSinceLastWorkout > 3) {
    recommendations.push(`It's been ${daysSinceLastWorkout} days since your last workout - time to get back to it!`);
  }

  return {
    totalWorkouts,
    totalExercises,
    totalVolume,
    averageDuration,
    exerciseFrequency,
    strengthProgress,
    plateaus,
    recommendations,
    lastWorkoutDate,
    daysSinceLastWorkout,
  };
}

/**
 * Build workout context string for AI
 */
export function buildWorkoutContext(workouts: Workout[], analysis: WorkoutAnalysis): string {
  let context = `## User's Workout History\n\n`;
  context += `**Overview:**\n`;
  context += `- Total workouts logged: ${analysis.totalWorkouts}\n`;
  context += `- Total exercises performed: ${analysis.totalExercises}\n`;
  context += `- Total training volume: ${analysis.totalVolume.toLocaleString()}lbs\n`;
  context += `- Average workout duration: ${analysis.averageDuration} minutes\n`;
  context += `- Days since last workout: ${analysis.daysSinceLastWorkout}\n\n`;

  // Most frequent exercises
  const topExercises = Object.entries(analysis.exerciseFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topExercises.length > 0) {
    context += `**Most Performed Exercises:**\n`;
    topExercises.forEach(([exercise, count]) => {
      context += `- ${exercise}: ${count} times\n`;
    });
    context += `\n`;
  }

  // Strength progress
  const progressEntries = Object.values(analysis.strengthProgress);
  if (progressEntries.length > 0) {
    context += `**Strength Progress:**\n`;
    progressEntries.slice(0, 5).forEach((progress) => {
      const direction = progress.weightProgress >= 0 ? '↑' : '↓';
      context += `- ${progress.exercise}: ${progress.firstWorkout.maxWeight}lbs → ${progress.lastWorkout.maxWeight}lbs (${direction} ${Math.abs(progress.weightProgress)}%) | Est 1RM: ${progress.estimatedOneRepMax}lbs\n`;
    });
    context += `\n`;
  }

  // Plateaus
  if (analysis.plateaus.length > 0) {
    context += `**⚠️ Plateaus Detected:**\n`;
    analysis.plateaus.forEach((plateau) => {
      context += `- ${plateau.exercise}: Stuck at ${plateau.currentWeight}lbs for ${plateau.workoutsStuck} workouts\n`;
      context += `  Suggestion: ${plateau.suggestion}\n`;
    });
    context += `\n`;
  }

  // Recent workouts (last 3)
  const recentWorkouts = workouts.slice(-3).reverse();
  if (recentWorkouts.length > 0) {
    context += `**Recent Workouts:**\n`;
    recentWorkouts.forEach((workout, idx) => {
      context += `\n${idx + 1}. ${new Date(workout.date).toLocaleDateString()} - ${workout.day_type || 'Workout'} (${workout.duration}min)\n`;
      workout.exercises.forEach((exercise) => {
        // Skip exercises with invalid data
        if (!exercise.name || !exercise.sets || !Array.isArray(exercise.sets)) {
          return;
        }
        const sets = exercise.sets
          .map((s) => `${s.reps}@${s.weight}lbs`)
          .join(', ');
        context += `   - ${exercise.name}: ${sets}\n`;
      });
    });
  }

  return context;
}

export type { WorkoutAnalysis, StrengthProgress, PlateauDetection, Exercise, Workout };
