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
import { FitnessGoalPage, GoalData } from './components/FitnessGoalPage';
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
import { logInUser, logInWithGoogle, signupUser, createUserRecords, getOnboardingStatus, setOnboardingComplete, migrateOnboardingStatus } from './userService';
import { log } from 'node:util';
import { signOut } from 'firebase/auth';
import { auth } from './firebase'; // your Firebase setup

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
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'app'>('landing');

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai' | 'food-assistant' | 'workout-detail' | 'daily-timeline' | 'meal-logging' | 'account' | 'dev-tools'>('dashboard');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFitnessScoreOpen, setIsFitnessScoreOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
        setAuthView(userData.onboardingComplete ? 'app' : 'onboarding');
      }
    };
    
    checkUserSession();
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

  // FareScore state (300-850 range)
  const [fareScore, setFareScore] = useState(() => {
    const saved = localStorage.getItem('fareScore');
    return saved ? parseInt(saved) : 615; // Default demo score
  });

  const [fareScoreChange, setFareScoreChange] = useState(8); // Weekly change

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
      goalType: 'cut', // 👈 Changed from 'lose-weight' to match type
      targetWeight: 70,
      weeklyGoal: 0.5,
      activityLevel: 'moderately-active',
      height: 175,
      weight: 75,
      age: 34,
      sex: 'male',
      tdee: 2450,
      targetCalories: 1950,
      proteinTarget: 150,
      carbsTarget: 195,
      fatTarget: 54,
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

  const handleSaveGoal = (goalData: GoalData) => {
    setUserGoal(goalData);
    // Here you would also save to localStorage or backend
    localStorage.setItem('fitnessGoal', JSON.stringify(goalData));
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
        <FitnessGoalPage 
          onBack={() => setCurrentPage('dashboard')} 
          onSaveGoal={handleSaveGoal}
          onNavigate={setCurrentPage}
          onFeedbackClick={() => setIsFeedbackOpen(true)}
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
  if (currentPage === 'dev-tools' && import.meta.env.DEV) {
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
        />
      </div>
      
      {/* Dev Tools Button (development only) */}
      {import.meta.env.DEV && (
        <div className="px-4 py-2">
          <button 
            onClick={() => setCurrentPage('dev-tools')}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            🛠️ Dev Tools (Check Meals)
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

    </div>
  );
}