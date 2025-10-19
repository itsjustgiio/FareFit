import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AITipBanner } from './components/AITipBanner';
import { GreetingSection } from './components/GreetingSection';
import { CaloriesCard } from './components/CaloriesCard';
import { MealsCard } from './components/MealsCard';
import { WorkoutCard } from './components/WorkoutCard';
import { GoalSetupBlock } from './components/GoalSetupBlock';
import { ProgressCard } from './components/ProgressCard';
import { BottomCards } from './components/BottomCards';
import { ProgressPage } from './components/ProgressPage';
import { HelpPage } from './components/HelpPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { SimpleFitnessGoalPage } from './components/SimpleFitnessGoalPage';
import { GoalData } from './components/FitnessGoalPage';
import { CoachAIPage } from './components/CoachAIPage';
import { FoodAssistantPage } from './components/FoodAssistantPage';
import { WorkoutDetailPage, WorkoutData } from './components/WorkoutDetailPage';
import { DailyTimelinePage } from './components/DailyTimelinePage';
import { FitnessScoreModal } from './components/FitnessScoreModal';
import { Footer } from './components/Footer';
import { FeedbackModal } from './components/FeedbackModal';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { WelcomeBanner } from './components/WelcomeBanner';
import { MealLoggingPage } from './components/MealLoggingPage';
import { AccountPage } from './components/AccountPage';
import { ScoreCards } from './components/ScoreCards';
import DevToolsPage from './components/DevToolsPage';
import { calculateDailyScore, DailyScoreBreakdown } from './utils/dailyScoreCalculator';
import { logInUser, logInWithGoogle, signupUser, createUserRecords, getOnboardingStatus, setOnboardingComplete, migrateOnboardingStatus, getUserActivePlanSummary, getUserProfile } from './userService';

import { log } from 'node:util';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // your Firebase setup
import { onSnapshot, doc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { checkAndClearDailyWorkout } from './userService';
import type { PlanSummary, UserPlan } from './types/planTypes';
import { PlanGeneratedModal } from './components/PlanGeneratedModal';

interface User {
  email: string;
  name: string;
  onboardingComplete: boolean;
  onboardingData?: any;
}

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('farefit_dark_mode');
    return saved === 'true';
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('farefit_dark_mode', String(newMode));
  };

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'app'>('landing');

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai' | 'food-assistant' | 'workout-detail' | 'daily-timeline' | 'meal-logging' | 'account' | 'dev-tools'>('dashboard');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFitnessScoreOpen, setIsFitnessScoreOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch complete user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log('🔍 Profile fetch effect triggered - isAuthenticated:', isAuthenticated, 'currentUser:', auth.currentUser?.uid);
      if (isAuthenticated && auth.currentUser) {
        console.log('🔍 Fetching complete user profile for user:', auth.currentUser.uid);
        try {
          const profile = await getUserProfile(auth.currentUser.uid);
          console.log('👤 Complete user profile received:', profile);
          setUserProfile(profile);
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
        }
      } else {
        console.log('⏸️ Skipping profile fetch - not authenticated or no user');
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, auth.currentUser]);

  // Check for existing session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      const savedUser = localStorage.getItem('farefit_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // 🆕 If user is authenticated, verify onboarding status from Firestore
        try {
          const auth = await import('./firebase').then(m => m.auth);
          const currentUser = auth.currentUser;
          
          if (currentUser) {
            const realOnboardingStatus = await getOnboardingStatus(currentUser.uid);
            
            // Update user data if Firestore differs from localStorage
            if (userData.onboardingComplete !== realOnboardingStatus) {
              console.log(`🔄 Syncing onboarding status: localStorage=${userData.onboardingComplete}, Firestore=${realOnboardingStatus}`);
              userData.onboardingComplete = realOnboardingStatus;
              localStorage.setItem('farefit_user', JSON.stringify(userData));
            }
          }
        } catch (error) {
          console.warn("⚠️ Could not verify onboarding status from Firestore:", error);
          // Fallback to localStorage data
        }
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Load user's plan if authenticated and onboarding complete
        if (userData.onboardingComplete && currentUser) {
          await loadUserPlan(currentUser.uid);
        }
        
        setAuthView(userData.onboardingComplete ? 'app' : 'onboarding');
      }
    };
    
    checkUserSession();
  }, []);

  // In your main App component or a layout component
  useEffect(() => {
    // Check for midnight clearance on app start
    checkAndClearDailyWorkout();
    
    // Set up interval to check every minute (for midnight detection)
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        checkAndClearDailyWorkout();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Authentication handlers
  const handleLogin = async (email: string, password: string) => {
    try {
      // Call Firebase login
      const firebaseUser = await logInUser(email, password);

      if (!firebaseUser) {
        alert("Login failed. Please check your credentials.");
        return;
      }

      // 🆕 Check real onboarding status from Firestore
      const onboardingComplete = await getOnboardingStatus(firebaseUser.uid);
      
      // 🆕 Migrate existing users who might not have onboarding status set
      await migrateOnboardingStatus(firebaseUser.uid);

      // Build your app's User object
      const loggedInUser: User = {
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split("@")[0],
        onboardingComplete: onboardingComplete, // 👈 Now uses real Firestore data
      };

      // Update state
      setUser(loggedInUser);
      setIsAuthenticated(true);

      // Load user's plan if onboarding is complete
      if (loggedInUser.onboardingComplete) {
        await loadUserPlan(firebaseUser.uid);
      }

      // Decide whether to go to onboarding or app
      setAuthView(loggedInUser.onboardingComplete ? "app" : "onboarding");

    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "Failed to login. Please try again.");
    }
  };


  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      // 1. Create Firebase Auth user
      const firebaseUser = await signupUser(email, password, name);

      // 2. Create Firestore records (includes onboardingComplete: false)
      await createUserRecords(firebaseUser.uid, name, email);

      // 3. Build app's local User object
      const newUser: User = {
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || name,
        onboardingComplete: false, // 👈 New users always need onboarding
      };

      // 4. Save locally
      localStorage.setItem(`farefit_user_${email}`, JSON.stringify(newUser));
      localStorage.setItem('farefit_user', JSON.stringify(newUser));

      // 5. Update app state
      setUser(newUser);
      setIsAuthenticated(true);
      setAuthView('onboarding'); // 👈 New users always go to onboarding

    } catch (error: any) {
      console.error("Signup error:", error);
      alert(error.message || "Failed to signup.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 1. Perform Google login via Firebase
      const firebaseUser = await logInWithGoogle();

      if (!firebaseUser) {
        alert("Google login failed. Please try again.");
        return;
      }

      // 🆕 Check real onboarding status from Firestore
      const onboardingComplete = await getOnboardingStatus(firebaseUser.uid);
      
      // 🆕 Migrate existing users who might not have onboarding status set
      await migrateOnboardingStatus(firebaseUser.uid);

      // 2. Build your app's User object
      const loggedInUser: User = {
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
        onboardingComplete: onboardingComplete, // 👈 Now uses real Firestore data
      };

      // 3. Update app state
      setUser(loggedInUser);
      setIsAuthenticated(true);
      
      // Load user's plan if onboarding is complete
      if (loggedInUser.onboardingComplete) {
        await loadUserPlan(firebaseUser.uid);
      }
      
      setAuthView(loggedInUser.onboardingComplete ? 'app' : 'onboarding');

    } catch (error: any) {
      console.error("Google login failed:", error.message);
      alert(error.message || "Google login failed. Please try again.");
    }
  };

  const handleOnboardingComplete = async (onboardingData: any) => {
    if (!user) return;

    try {
      // 🆕 Mark onboarding as complete in Firestore
      // We need the Firebase user ID - get current authenticated user
      const auth = await import('./firebase').then(m => m.auth);
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await setOnboardingComplete(currentUser.uid);
        console.log("✅ Onboarding marked complete in Firestore");
      }

      const updatedUser: User = {
        ...user,
        onboardingComplete: true,
        onboardingData,
      };

      // Save updated user data locally too
      localStorage.setItem(`farefit_user_${user.email}`, JSON.stringify(updatedUser));
      localStorage.setItem('farefit_user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      setAuthView('app');
      setShowWelcomeBanner(true);

    } catch (error) {
      console.error("❌ Error completing onboarding:", error);
      // Still proceed with local update as fallback
      const updatedUser: User = {
        ...user,
        onboardingComplete: true,
        onboardingData,
      };
      localStorage.setItem(`farefit_user_${user.email}`, JSON.stringify(updatedUser));
      localStorage.setItem('farefit_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAuthView('app');
      setShowWelcomeBanner(true);
    }
  };

  // Load user's AI plan summary
  const loadUserPlan = async (userId: string) => {
    if (!userId) return;
    
    try {
      setIsLoadingPlan(true);
      console.log('📋 Loading user plan summary...');
      
      const planSummary = await getUserActivePlanSummary(userId);
      setPlanSummary(planSummary);
      
      if (planSummary) {
        console.log('✅ Plan summary loaded:', planSummary);
      } else {
        console.log('📭 No active plan found for user');
      }
    } catch (error) {
      console.error('❌ Error loading user plan:', error);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Handle plan generation completion
  const handlePlanGenerated = async (plan: UserPlan) => {
    console.log('🎯 Plan generated successfully:', plan.id);
    console.log('🎯 Plan details received:', {
      goalType: plan.goalType,
      targetCalories: plan.targetCalories,
      tdee: plan.tdee,
      macros: plan.macros
    });
    console.log('🔍 Debug - hasSeenPlanModal:', hasSeenPlanModal);
    console.log('🔍 Debug - localStorage hasSeenPlanModal:', localStorage.getItem('hasSeenPlanModal'));
    
    // Only show modal for first-time users
    if (!hasSeenPlanModal) {
      console.log('📋 Setting up modal for first-time user with plan data:', plan);
      setGeneratedPlan(plan);
      setShowPlanModal(true);
      console.log('📋 Modal state set - generatedPlan set, showPlanModal:', true);
    } else {
      console.log('📋 Skipping plan modal - user has seen it before');
    }
    
    // Fitness goals are automatically updated during plan generation
    // Just reload the plan summary to reflect the changes
    if (user) {
      try {
        const auth = await import('./firebase').then(m => m.auth);
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Reload plan summary to reflect the updated data
          await loadUserPlan(currentUser.uid);
          console.log('✅ Plan summary reloaded');
        }
      } catch (error) {
        console.error('❌ Error reloading plan:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // sign out from Firebase
    } catch (error) {
      console.error("Error signing out from Firebase:", error);
    }
    
    localStorage.removeItem('farefit_user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthView('landing');
    setCurrentPage('dashboard');
    setShowWelcomeBanner(false);
    setIsDemoMode(false);
  };

  const handleUpdateProfile = (name: string, email: string, avatar: string) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      name,
      email,
    };

    // Save updated user data
    localStorage.setItem(`farefit_user_${email}`, JSON.stringify(updatedUser));
    localStorage.setItem('farefit_user', JSON.stringify(updatedUser));
    
    setUser(updatedUser);
  };
  
  // Load saved goal from localStorage
  const [userGoal, setUserGoal] = useState<GoalData | null>(() => {
    const saved = localStorage.getItem('fitnessGoal');
    return saved ? JSON.parse(saved) : null;
  });

  // AI Plan state management
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  
  // Plan Generated Modal state (for dashboard)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<UserPlan | null>(null);
  
  // Track if user has seen plan explanation modal before
  const [hasSeenPlanModal, setHasSeenPlanModal] = useState(() => {
    return localStorage.getItem('hasSeenPlanModal') === 'true';
  });

  // Load workout data from localStorage
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(() => {
    const saved = localStorage.getItem('workoutData');
    if (!saved) return null;
    
    try {
      const data = JSON.parse(saved);
      
      // Migrate old format to new format if needed
      if (data.exercises && data.exercises.length > 0) {
        const firstExercise = data.exercises[0];
        
        // Check if this is the old format (has sets array with {weight, reps} objects)
        if (firstExercise.sets && Array.isArray(firstExercise.sets) && typeof firstExercise.sets[0] === 'object') {
          console.log('Migrating workout data from old format to new format');
          
          // Convert old format to new format
          const migratedExercises = data.exercises.map((ex: any, index: number) => {
            // Calculate averages from the sets array
            const totalSets = ex.sets.length;
            const avgWeight = ex.sets.reduce((sum: number, set: any) => sum + set.weight, 0) / totalSets;
            const avgReps = Math.round(ex.sets.reduce((sum: number, set: any) => sum + set.reps, 0) / totalSets);
            const volume = totalSets * avgReps * avgWeight;
            
            return {
              id: (Date.now() + index).toString(),
              name: ex.name,
              sets: totalSets,
              reps: avgReps,
              weight: avgWeight,
              volume: volume,
              notes: '',
              startTime: new Date(Date.now() - (data.exercises.length - index) * 10 * 60000).toISOString(),
              endTime: new Date(Date.now() - (data.exercises.length - index - 1) * 10 * 60000).toISOString(),
            };
          });
          
          const migratedData: WorkoutData = {
            workoutType: data.type || data.workoutType || 'Workout',
            duration: data.duration || 45,
            caloriesBurned: data.caloriesBurned || 0,
            exercises: migratedExercises,
            date: data.date || new Date().toISOString(),
          };
          
          // Save migrated data back to localStorage
          localStorage.setItem('workoutData', JSON.stringify(migratedData));
          return migratedData;
        }
      }
      
      return data;
    } catch (e) {
      console.error('Error loading workout data:', e);
      return null;
    }
  });

  // Load logged macros from localStorage (temporary tracking)
  const [loggedMacros, setLoggedMacros] = useState(() => {
    const saved = localStorage.getItem('loggedMacros');
    return saved ? JSON.parse(saved) : {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };
  });

  // Update logged macros and save to localStorage
  const updateLoggedMacros = (macros: typeof loggedMacros) => {
    setLoggedMacros(macros);
    localStorage.setItem('loggedMacros', JSON.stringify(macros));
  };

  // FareScore state (300-850 range) - now real-time from Firestore
  const [fareScore, setFareScore] = useState(350); // Starting score for new users
  const [fareScoreChange, setFareScoreChange] = useState(0); // Weekly change

  // Track authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Listen for auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      console.log("🔐 Auth state changed:", user ? `User: ${user.uid}` : "No user");
    });
    
    return () => unsubscribe();
  }, []);

  // 🔥 Real-time FareScore listener
  useEffect(() => {
    // Only set up real-time listener for authenticated users (not demo mode)
    if (!currentUser || isDemoMode) {
      console.log("🔥 Skipping FareScore listener:", { currentUser: !!currentUser, isDemoMode });
      return;
    }

    const db = getFirestore();
    const fareScoreDocRef = doc(db, "FareScore", currentUser.uid);
    
    console.log("🔥 Setting up real-time FareScore listener for:", currentUser.uid);
    
    const unsubscribe = onSnapshot(fareScoreDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📊 Real-time FareScore update:", data);
        
        setFareScore(data.score || 350);
        setFareScoreChange(data.weeklyChange || 0); // Optional field for weekly tracking
      } else {
        console.log("❌ No FareScore document found, using default values");
        setFareScore(350); // New user default
        setFareScoreChange(0);
      }
    }, (error) => {
      console.error("❌ Error listening to FareScore changes:", error);
      // Fallback to default values on error
      setFareScore(350);
      setFareScoreChange(0);
    });

    // Cleanup listener on unmount or user change
    return () => {
      console.log("🔥 Cleaning up FareScore listener");
      unsubscribe();
    };
  }, [isDemoMode, currentUser]); // Re-run when demo mode or user changes

  // Calculate Daily Score (0-100) - represents today's progress toward max points
  const getDailyScoreBreakdown = (): DailyScoreBreakdown => {
    if (!userGoal) {
      return {
        total: 0,
        mealsLogged: { earned: 0, max: 30 },
        workoutCompleted: { earned: 0, max: 30 },
        macrosHit: { earned: 0, max: 25 },
        consistencyBonus: { earned: 0, max: 15 },
      };
    }

    return calculateDailyScore({
      mealsLoggedCount: 0, // We'll estimate based on calories
      workoutCompleted: workoutData !== null,
      loggedCalories: loggedMacros.calories,
      targetCalories: userGoal.targetCalories,
      loggedProtein: loggedMacros.protein,
      targetProtein: userGoal.protein,
      loggedCarbs: loggedMacros.carbs,
      targetCarbs: userGoal.carbs,
      loggedFat: loggedMacros.fat,
      targetFat: userGoal.fat,
    });
  };

  const dailyScoreBreakdown = getDailyScoreBreakdown();
  const dailyScore = dailyScoreBreakdown.total;

  // Demo mode - quick access for testing (remove in production)
  const handleDemoLogin = () => {
    const demoUser: User = {
      email: 'demo@farefit.com',
      name: 'Alex',
      onboardingComplete: true,
      onboardingData: {
        sex: 'male',
        birthday: new Date('1990-01-01'),
        height: 175,
        heightUnit: 'cm',
        weight: 75,
        weightUnit: 'kg',
        activityLevel: 'moderately-active',
        goal: 'lose-weight',
        notificationsEnabled: true,
      }
    };
    
    // Set demo fitness goal
    const demoGoal: GoalData = {
      goalType: 'cut',
      age: 34,
      weight: 75, // Current weight
      height: 175,
      gender: 'male', // 👈 Fixed: 'sex' -> 'gender'
      activityLevel: 'moderately-active',
      tdee: 2450,
      targetCalories: 1950,
      protein: 150, // 👈 Fixed: 'proteinTarget' -> 'protein'
      carbs: 195,   // 👈 Fixed: 'carbsTarget' -> 'carbs' 
      fat: 54,      // 👈 Fixed: 'fatTarget' -> 'fat'
      fiber: 27,    // 👈 Added missing fiber property
      // Removed: targetWeight, weeklyGoal (not in GoalData interface)
    };
    
    // Set demo logged macros (as if user has logged some meals today)
    const demoMacros = {
      calories: 1247,
      protein: 98,
      carbs: 112,
      fat: 38,
      fiber: 18,
    };
    
    // Set demo workout data
    const demoWorkout: WorkoutData = {
      workoutType: 'Push Day 💪',
      duration: 45,
      caloriesBurned: 517,
      exercises: [
        {
          id: '1',
          name: 'Bench Press',
          sets: 3,
          reps: 10,
          weight: 135,
          volume: 4050, // 3 * 10 * 135
          notes: 'Felt strong today',
          startTime: new Date(Date.now() - 45 * 60000).toISOString(),
          endTime: new Date(Date.now() - 35 * 60000).toISOString(),
        },
        {
          id: '2',
          name: 'Incline DB Press',
          sets: 3,
          reps: 12,
          weight: 55,
          volume: 1980, // 3 * 12 * 55
          notes: '',
          startTime: new Date(Date.now() - 30 * 60000).toISOString(),
          endTime: new Date(Date.now() - 20 * 60000).toISOString(),
        },
        {
          id: '3',
          name: 'Lateral Raises',
          sets: 4,
          reps: 15,
          weight: 20,
          volume: 1200, // 4 * 15 * 20
          notes: 'Good pump',
          startTime: new Date(Date.now() - 15 * 60000).toISOString(),
          endTime: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ],
      date: new Date().toISOString(),
    };
    
    // Save all demo data to localStorage
    localStorage.setItem('farefit_user', JSON.stringify(demoUser));
    localStorage.setItem('fitnessGoal', JSON.stringify(demoGoal));
    localStorage.setItem('loggedMacros', JSON.stringify(demoMacros));
    localStorage.setItem('workoutData', JSON.stringify(demoWorkout));
    localStorage.setItem('fareScore', '615');
    
    // Set all state with demo data
    setUser(demoUser);
    setUserGoal(demoGoal);
    setLoggedMacros(demoMacros);
    setWorkoutData(demoWorkout);
    setFareScore(615);
    setFareScoreChange(8);
    setIsAuthenticated(true);
    setAuthView('app');
    setShowWelcomeBanner(true);
    setIsDemoMode(true);
  };

  // Handle meal logging
  const handleMealLogged = (meal: any) => {
    const updatedMacros = {
      calories: loggedMacros.calories + meal.calories,
      protein: loggedMacros.protein + meal.protein,
      carbs: loggedMacros.carbs + meal.carbs,
      fat: loggedMacros.fat + meal.fat,
      fiber: loggedMacros.fiber + meal.fiber,
    };
    updateLoggedMacros(updatedMacros);
    // TODO: Save meal to database/backend
  };

  const getPageName = () => {
    if (currentPage === 'progress') return 'Progress';
    if (currentPage === 'help') return 'Help';
    if (currentPage === 'privacy') return 'Privacy';
    if (currentPage === 'terms') return 'Terms';
    if (currentPage === 'fitness-goal') return 'Fitness Goal';
    if (currentPage === 'coach-ai') return 'Coach AI';
    if (currentPage === 'food-assistant') return 'Food Assistant';
    if (currentPage === 'workout-detail') return 'Workout Detail';
    if (currentPage === 'daily-timeline') return 'Daily Timeline';
    return 'Dashboard';
  };

  const handleSaveGoal = async (goalData: GoalData) => {
    console.log('💾 Saving goal data to Fitness_Goals collection:', goalData);
    setUserGoal(goalData);
    
    try {
      // Save to localStorage for immediate use
      localStorage.setItem('fitnessGoal', JSON.stringify(goalData));
      
      // Save to Firestore Fitness_Goals collection using exact field names
      if (auth.currentUser) {
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        
        const fitnessGoalRef = doc(db, "Fitness_Goals", auth.currentUser.uid);
        await updateDoc(fitnessGoalRef, {
          age: goalData.age,
          gender: goalData.gender,
          height: goalData.height,
          weight: goalData.weight,
          activity_level: goalData.activityLevel,
          goal_type: goalData.goalType,
          tdee: goalData.tdee,
          target_calories: goalData.targetCalories,
          protein_target: goalData.protein,
          carbs_target: goalData.carbs,
          fats_target: goalData.fat,
          fiber_target: goalData.fiber,
          updated_at: Timestamp.now(),
          is_active: true
        });
        console.log('✅ Goal data saved to Fitness_Goals collection with correct field names');
        
        // Add a small delay to ensure Firestore has processed the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh user profile to reflect changes
        console.log('🔄 Refreshing user profile after goal save...');
        const updatedProfile = await getUserProfile(auth.currentUser.uid);
        console.log('👤 Updated profile after goal save:', updatedProfile);
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('❌ Error saving goal data:', error);
    }
  };

  const handleSaveWorkout = (workout: WorkoutData) => {
    setWorkoutData(workout);
    localStorage.setItem('workoutData', JSON.stringify(workout));
  };

  // Show Landing Page
  if (authView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setAuthView('signup')}
        onLogin={() => setAuthView('login')}
        onDemoLogin={handleDemoLogin}
      />
    );
  }

  // Show Auth Page (Login)
  if (authView === 'login') {
    return (
      <AuthPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        onBack={() => setAuthView('landing')}
        initialMode="login"
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  // Show Auth Page (Signup)
  if (authView === 'signup') {
    return (
      <AuthPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        onBack={() => setAuthView('landing')}
        initialMode="signup"
      />
    );
  }

  // Show Onboarding Flow
  if (authView === 'onboarding') {
    return (
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    );
  }

  // Main App (authenticated and onboarded users)
  if (currentPage === 'progress') {
    return (
      <>
        <ProgressPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Progress"
        />
      </>
    );
  }

  if (currentPage === 'help') {
    return (
      <>
        <HelpPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Help"
        />
      </>
    );
  }

  if (currentPage === 'privacy') {
    return (
      <>
        <PrivacyPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Privacy"
        />
      </>
    );
  }

  if (currentPage === 'terms') {
    return (
      <>
        <TermsPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Terms"
        />
      </>
    );
  }

  if (currentPage === 'fitness-goal') {
    return (
      <>
        <SimpleFitnessGoalPage 
          onBack={() => setCurrentPage('dashboard')} 
          onSaveGoal={handleSaveGoal}
          onNavigate={(page: string) => setCurrentPage(page as typeof currentPage)}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
          onPlanGenerated={handlePlanGenerated}
          userId={auth.currentUser?.uid}
          userProfile={userProfile ? {
            age: userProfile.age,
            weight: userProfile.weight,
            height: userProfile.height, 
            gender: userProfile.gender,
            activityLevel: userProfile.activityLevel,
            goalType: userProfile.goalType
          } : undefined}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Fitness Goal"
        />
      </>
    );
  }

  if (currentPage === 'coach-ai') {
    return (
      <>
        <CoachAIPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Coach AI"
        />
      </>
    );
  }

  if (currentPage === 'meal-logging') {
    return (
      <MealLoggingPage
        onBack={() => setCurrentPage('dashboard')}
        onMealLogged={handleMealLogged}
      />
    );
  }

  if (currentPage === 'food-assistant') {
    return (
      <>
        <FoodAssistantPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
          userGoal={userGoal}
          loggedMacros={loggedMacros}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Food Assistant"
        />
      </>
    );
  }

  if (currentPage === 'workout-detail') {
    return (
      <>
        <WorkoutDetailPage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
          onCoachAIClick={() => setCurrentPage('coach-ai')}
          workoutData={workoutData}
          onSaveWorkout={handleSaveWorkout}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Workout Detail"
        />
      </>
    );
  }

  if (currentPage === 'daily-timeline') {
    return (
      <>
        <DailyTimelinePage 
          onBack={() => setCurrentPage('dashboard')} 
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
          userGoal={userGoal}
          loggedMacros={loggedMacros}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          currentPage="Daily Timeline"
        />
      </>
    );
  }

  if (currentPage === 'account') {
    return (
      <AccountPage
        onBack={() => setCurrentPage('dashboard')}
        userName={user?.name || 'User'}
        userEmail={user?.email || ''}
        isDemoMode={isDemoMode}
        onUpdateProfile={handleUpdateProfile}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Dev tools page (development only)
  if (currentPage === 'dev-tools' && (import.meta as any).env.DEV) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--farefit-bg)' }}>
        <Header 
          userName={user?.name} 
          onLogout={handleLogout}
          onAccountClick={() => setCurrentPage('account')}
          isDarkMode={isDarkMode}
        />
        <DevToolsPage />
        <button 
          onClick={() => setCurrentPage('dashboard')}
          className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--farefit-bg)' }}>
      <Header 
        userName={user?.name} 
        onLogout={handleLogout}
        onAccountClick={() => setCurrentPage('account')}
        isDarkMode={isDarkMode}
      />
      
      {showWelcomeBanner && (
        <WelcomeBanner 
          userName={user?.name || 'there'} 
          onClose={() => setShowWelcomeBanner(false)} 
        />
      )}
      
      <AITipBanner 
        onCoachAIClick={() => setCurrentPage('coach-ai')} 
        userName={user?.name || user?.email?.split('@')[0]}
        hasLoggedMeals={loggedMacros.calories > 0}
        hasLoggedWorkout={workoutData !== null}
        goalType={userGoal?.goalType}
        macroProgress={userGoal ? {
          calories: loggedMacros.calories,
          targetCalories: userGoal.targetCalories,
          protein: loggedMacros.protein,
          targetProtein: userGoal.protein,
          carbs: loggedMacros.carbs,
          targetCarbs: userGoal.carbs,
          fat: loggedMacros.fat,
          targetFat: userGoal.fat
        } : undefined}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
        <GreetingSection 
          onFitnessScoreClick={() => setIsFitnessScoreOpen(true)}
          userName={user?.name || user?.email?.split('@')[0]}
        />
        
        {/* Score Cards - FareScore & Daily Score */}
        <ScoreCards
          fareScore={fareScore}
          fareScoreChange={fareScoreChange}
          dailyScore={dailyScore}
          dailyBreakdown={dailyScoreBreakdown}
          onFareScoreClick={() => setCurrentPage('account')}
          isDemoMode={isDemoMode}
        />
        
        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CaloriesCard
            onFoodAIClick={() => setCurrentPage('food-assistant')}
            onLogMealClick={() => setCurrentPage('meal-logging')}
            userGoal={userGoal}
            planSummary={planSummary}
          />
          <MealsCard 
            onViewTimeline={() => setCurrentPage('daily-timeline')}
            onLogMealClick={() => setCurrentPage('meal-logging')}
          />
        </div>
        
        {/* Workout Overview + Progress Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <WorkoutCard 
            onCoachAIClick={() => setCurrentPage('coach-ai')}
            onViewWorkout={() => setCurrentPage('workout-detail')}
            workoutData={workoutData}
          />
          <ProgressCard onClick={() => setCurrentPage('progress')} />
        </div>
        
        {/* Bottom Cards */}
        <BottomCards 
          onGoalSetupClick={() => setCurrentPage('fitness-goal')}
          onCoachAIClick={() => setCurrentPage('coach-ai')}
          onFoodAssistantClick={() => setCurrentPage('food-assistant')}
          userGoal={userGoal}
          planSummary={planSummary}
        />
      </div>
      

      
      {/* Dev Tools Button (development only) */}
      {(import.meta as any).env.DEV && (
        <div className="px-4 py-2 space-y-2">
          <button 
            onClick={() => setCurrentPage('dev-tools')}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            🛠️ Dev Tools (Check Meals)
          </button>
          <button 
            onClick={() => {
              // Clear localStorage
              localStorage.removeItem('hasSeenPlanModal');
              
              // Reset state
              setHasSeenPlanModal(false);
              
              // Clear any existing modal state
              setShowPlanModal(false);
              setGeneratedPlan(null);
              
              // Force a re-render
              console.log('🔄 Reset first-time user status');
              console.log('🔍 localStorage after reset:', localStorage.getItem('hasSeenPlanModal'));
              console.log('🔍 hasSeenPlanModal state after reset:', false);
              
              alert('✅ Reset complete! Generate a new plan to see the modal.');
            }}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            🔄 Reset First-Time Modal
          </button>
          <button 
            onClick={async () => {
              console.log('🧪 Testing AI plan generation manually...');
              
              // Simulate the plan generation with your data
              const testUserData = {
                age: 20,
                weight: 72.57, // 160 lbs to kg
                height: 178, // 5'10" to cm
                gender: 'male' as const,
                activityLevel: '1.4', // moderately active (lowered from 1.55)
                goalType: 'maintain' as const
              };
              
              console.log('🧪 Test user data:', testUserData);
              
              // Get current user
              const auth = await import('./firebase').then(m => m.auth);
              const currentUser = auth.currentUser;
              
              if (!currentUser) {
                console.error('❌ No user logged in');
                return;
              }
              
              console.log('🧪 Current user:', currentUser.uid);
              
              // Try to generate plan
              try {
                const { generateUserPlan } = await import('./services/aiPlanGenerator');
                console.log('🧪 Calling generateUserPlan...');
                
                const response = await generateUserPlan(
                  currentUser.uid, 
                  testUserData, 
                  { updateFitnessGoals: true } // Automatically update fitness goals
                );
                console.log('🧪 AI Response:', response);
                
                if (response.success && response.plan) {
                  console.log('✅ Plan generated successfully!');
                  console.log('📊 Plan data:', {
                    goalType: response.plan.goalType,
                    tdee: response.plan.tdee,
                    targetCalories: response.plan.targetCalories,
                    macros: response.plan.macros
                  });
                  
                  // Show the extracted macro data in the format for updateFitnessGoalsBatch
                  if (response.macroData) {
                    console.log('🎯 Extracted macro data for fitness goals:', response.macroData);
                  }
                  
                  // Set this plan in state for testing
                  setGeneratedPlan(response.plan);
                  setShowPlanModal(true);
                } else {
                  console.error('❌ Plan generation failed:', response);
                }
              } catch (error) {
                console.error('❌ Error generating plan:', error);
              }
            }}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            🧪 Test AI Plan Generation
          </button>
          <button 
            onClick={() => {
              setGeneratedPlan(null);
              setShowPlanModal(false);
              console.log('🧪 Cleared test data - try generating plan again');
            }}
            className="w-full bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
          >
            🗑️ Clear Test Data
          </button>
        </div>
      )}
      
      <Footer 
        onNavigate={setCurrentPage}
        onFeedbackClick={() => setIsFeedbackOpen(true)}
      />
      
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)}
        currentPage={getPageName()}
      />
      
      <FitnessScoreModal
        isOpen={isFitnessScoreOpen}
        onClose={() => setIsFitnessScoreOpen(false)}
      />

      {/* Plan Generated Modal (global - shows after first plan generation) */}
      {/* Debug: showPlanModal={showPlanModal}, generatedPlan={!!generatedPlan} */}
      <PlanGeneratedModal
        isOpen={showPlanModal}
        onClose={() => {
          console.log('📋 Closing plan modal via X button');
          setShowPlanModal(false);
          setHasSeenPlanModal(true);
          localStorage.setItem('hasSeenPlanModal', 'true');
        }}
        status={generatedPlan ? 'ready' : 'loading'}
        plan={generatedPlan}
        onContinueToDashboard={() => {
          console.log('📋 Closing plan modal via button');
          setShowPlanModal(false);
          setHasSeenPlanModal(true);
          localStorage.setItem('hasSeenPlanModal', 'true');
        }}
      />

    </div>
  );
}