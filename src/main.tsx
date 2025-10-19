
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  // Dev tools - expose meal checking functions globally for console access
  if (import.meta.env.DEV) {
    // Load meal dev tools
    import('./devTools/checkMeals').then((module) => {
      (window as any).showUserMeals = module.showUserMeals;
      (window as any).meals = module.meals;
      (window as any).mealSummary = module.mealSummary;
    });
    
    // Load user profile dev tools
    import('./utils/viewUserProfileWeb').then((module) => {
      (window as any).viewUserProfile = module.viewUserProfile;
      (window as any).viewMyProfile = module.viewMyProfile;
    });

    console.log('🛠️ Dev tools loaded! Available commands:');
    console.log('  📊 Meal Data:');
    console.log('    • showUserMeals() - Detailed meal log');
    console.log('    • meals() - Same as showUserMeals()');
    console.log('    • mealSummary() - Quick overview');
    console.log('  👤 User Profile:');
    console.log('    • viewMyProfile() - Current user\'s profile');
    console.log('    • viewUserProfile("userId") - Any user\'s profile');
  }
  