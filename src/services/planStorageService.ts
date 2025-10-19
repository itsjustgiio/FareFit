/**
 * Plan Storage Service
 * Handles all Firestore operations for user plans
 * Manages plan versioning, activation, and retrieval
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import type { 
  UserPlan, 
  PlanSummary, 
  PlanContent,
  MacroTargets,
  GoalType 
} from '../types/planTypes';

// Collection name
const PLANS_COLLECTION = 'User_Plans';

/**
 * Save a new user plan to Firestore
 * Automatically deactivates previous plans and increments version
 */
export async function saveUserPlan(
  userId: string,
  goalType: GoalType,
  tdee: number,
  targetCalories: number,
  macros: MacroTargets,
  planContent: PlanContent
): Promise<UserPlan> {
  try {
    // Get the next version number
    const nextVersion = await getNextPlanVersion(userId);
    
    // Create the plan document
    const planId = `${userId}_v${nextVersion}`;
    const planData: Omit<UserPlan, 'id'> = {
      userId,
      goalType,
      tdee,
      targetCalories,
      macros,
      planContent,
      generatedAt: new Date(),
      isActive: true,
      version: nextVersion
    };

    // Use batch write to ensure consistency
    const batch = writeBatch(db);
    
    // 1. Deactivate all existing plans for this user
    const existingPlans = await getActiveUserPlans(userId);
    existingPlans.forEach(plan => {
      const planRef = doc(db, PLANS_COLLECTION, plan.id);
      batch.update(planRef, { isActive: false });
    });
    
    // 2. Create the new plan
    const newPlanRef = doc(db, PLANS_COLLECTION, planId);
    batch.set(newPlanRef, {
      ...planData,
      generatedAt: Timestamp.fromDate(planData.generatedAt)
    });
    
    // Execute batch
    await batch.commit();
    
    console.log(`✅ Successfully saved plan ${planId} for user ${userId}`);
    
    return {
      id: planId,
      ...planData
    };
    
  } catch (error) {
    console.error('❌ Error saving user plan:', error);
    throw new Error(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the active plan for a user
 * Returns null if no active plan exists
 */
export async function getActiveUserPlan(userId: string): Promise<UserPlan | null> {
  try {
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('version', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No active plan found for user ${userId}`);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      userId: data.userId,
      goalType: data.goalType,
      tdee: data.tdee,
      targetCalories: data.targetCalories,
      macros: data.macros,
      planContent: data.planContent,
      generatedAt: data.generatedAt.toDate(),
      isActive: data.isActive,
      version: data.version
    };
    
  } catch (error) {
    console.error('❌ Error getting active user plan:', error);
    
    // If it's a Firestore index error, return null instead of throwing
    if (error instanceof Error && error.message.includes('requires an index')) {
      console.log('⚠️ Firestore index not ready, returning null for now');
      return null;
    }
    
    throw new Error(`Failed to get active plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get plan summary for dashboard display (performance optimized)
 * Only fetches essential data needed for UI
 */
export async function getUserPlanSummary(userId: string): Promise<PlanSummary | null> {
  try {
    const activePlan = await getActiveUserPlan(userId);
    
    if (!activePlan) {
      return null;
    }
    
    // Calculate current week (assumes plan started when generated)
    const daysSinceGeneration = Math.floor(
      (Date.now() - activePlan.generatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentWeek = Math.min(Math.floor(daysSinceGeneration / 7) + 1, 4);
    
    // Get current week's focus
    const currentWeekPlan = activePlan.planContent.weeks.find(w => w.week === currentWeek);
    const currentFocus = currentWeekPlan?.focus || 'Getting Started';
    
    return {
      goalType: activePlan.goalType,
      targetCalories: activePlan.targetCalories,
      macros: activePlan.macros,
      currentWeek,
      currentFocus,
      generatedAt: activePlan.generatedAt,
      version: activePlan.version
    };
    
  } catch (error) {
    console.error('❌ Error getting user plan summary:', error);
    return null;
  }
}

/**
 * Get all plans for a user (for history/comparison)
 */
export async function getUserPlanHistory(userId: string, limitCount: number = 10): Promise<UserPlan[]> {
  try {
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('userId', '==', userId),
      orderBy('version', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        goalType: data.goalType,
        tdee: data.tdee,
        targetCalories: data.targetCalories,
        macros: data.macros,
        planContent: data.planContent,
        generatedAt: data.generatedAt.toDate(),
        isActive: data.isActive,
        version: data.version
      };
    });
    
  } catch (error) {
    console.error('❌ Error getting user plan history:', error);
    throw new Error(`Failed to get plan history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update plan activation status
 */
export async function updatePlanActivation(planId: string, isActive: boolean): Promise<void> {
  try {
    const planRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(planRef, { isActive });
    
    console.log(`✅ Updated plan ${planId} activation to ${isActive}`);
    
  } catch (error) {
    console.error('❌ Error updating plan activation:', error);
    throw new Error(`Failed to update plan activation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a user plan (soft delete by deactivating)
 */
export async function deactivateUserPlan(planId: string): Promise<void> {
  await updatePlanActivation(planId, false);
}

/**
 * Check if user has generated a plan today (rate limiting)
 */
export async function hasGeneratedPlanToday(userId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('userId', '==', userId),
      where('generatedAt', '>=', Timestamp.fromDate(today))
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
    
  } catch (error) {
    console.error('❌ Error checking daily plan generation:', error);
    return false; // Fail open to allow plan generation
  }
}

/**
 * Get user's plan generation count for today
 */
export async function getTodaysPlanCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('userId', '==', userId),
      where('generatedAt', '>=', Timestamp.fromDate(today))
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
    
  } catch (error) {
    console.error('❌ Error getting today\'s plan count:', error);
    return 0;
  }
}

// Helper functions

/**
 * Get the next version number for a user's plans
 */
async function getNextPlanVersion(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('userId', '==', userId),
      orderBy('version', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 1; // First plan
    }
    
    const latestPlan = querySnapshot.docs[0].data();
    return latestPlan.version + 1;
    
  } catch (error) {
    console.error('❌ Error getting next plan version:', error);
    return 1; // Default to version 1
  }
}

/**
 * Get all active plans for a user (for deactivation)
 */
async function getActiveUserPlans(userId: string): Promise<UserPlan[]> {
  try {
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        goalType: data.goalType,
        tdee: data.tdee,
        targetCalories: data.targetCalories,
        macros: data.macros,
        planContent: data.planContent,
        generatedAt: data.generatedAt.toDate(),
        isActive: data.isActive,
        version: data.version
      };
    });
    
  } catch (error) {
    console.error('❌ Error getting active user plans:', error);
    return [];
  }
}