import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { updateFitnessGoalsBatch } from '../userService';

interface MacroManagerProps {
  onMacrosUpdated?: () => void;
}

export function MacroManager({ onMacrosUpdated }: MacroManagerProps) {
  // Your target macros state
  const [targetMacros, setTargetMacros] = useState({
    target_calories: 2000,
    target_weight: 150,
    protein_target: 150,
    carbs_target: 200,
    fats_target: 50,
    fiber_target: 25,
  });

  // Loading state for UI feedback
  const [isUpdating, setIsUpdating] = useState(false);

  // Batch update function using Approach 2
  const updateUserFitnessGoalsBatch = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    setIsUpdating(true);
    try {
      // Update all fields in a single Firestore operation
      await updateFitnessGoalsBatch(user.uid, targetMacros);
      console.log("✅ All fitness goals updated in batch!");
      
      // Notify parent component if callback provided
      onMacrosUpdated?.();
    } catch (error) {
      console.error("❌ Error updating fitness goals:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // AI generates macros and updates them
  const handleAIGeneration = async () => {
    setIsUpdating(true);
    try {
      // Simulate AI generation (replace this with your actual AI call)
      console.log('🤖 Generating AI macros...');
      
      // Example AI generated macros
      const aiGeneratedMacros = {
        target_calories: 2200,
        target_weight: 160,
        protein_target: 165,
        carbs_target: 220,
        fats_target: 60,
        fiber_target: 30,
      };
      
      console.log('🎯 AI generated macros:', aiGeneratedMacros);
      
      // Update state with AI generated values
      setTargetMacros(aiGeneratedMacros);
      
      // Update Firestore with batch method
      await updateFitnessGoalsBatch(getAuth().currentUser!.uid, aiGeneratedMacros);
      console.log("✅ AI macros saved to Firestore!");
      
      // Notify parent component
      onMacrosUpdated?.();
    } catch (error) {
      console.error("❌ Error in AI macro generation:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Manual macro update (for testing)
  const handleManualUpdate = (field: string, value: number) => {
    setTargetMacros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Macro Manager</h3>
      
      {/* Display current macros */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(targetMacros).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              {key.replace('_', ' ').replace('target', '').trim()}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleManualUpdate(key, Number(e.target.value))}
              className="border rounded px-3 py-2"
              disabled={isUpdating}
            />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAIGeneration}
          disabled={isUpdating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isUpdating ? 'Generating...' : '🤖 Generate AI Macros'}
        </button>
        
        <button
          onClick={updateUserFitnessGoalsBatch}
          disabled={isUpdating}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : '💾 Save to Firestore'}
        </button>
      </div>

      {/* Status display */}
      {isUpdating && (
        <div className="mt-4 text-sm text-blue-600">
          ⏳ Updating fitness goals...
        </div>
      )}
    </div>
  );
}