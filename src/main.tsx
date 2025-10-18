
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  // Dev tools - expose meal checking functions globally for console access
  if (import.meta.env.DEV) {
    import('./devTools/checkMeals').then((module) => {
      (window as any).showUserMeals = module.showUserMeals;
      (window as any).meals = module.meals;
      (window as any).mealSummary = module.mealSummary;
      console.log('🛠️ Dev tools loaded! Available commands:');
      console.log('  • showUserMeals() - Detailed meal log');
      console.log('  • meals() - Same as showUserMeals()');
      console.log('  • mealSummary() - Quick overview');
    });
  }
  