/**
 * Test script to verify Firestore data sanitization
 * Run this to test if the meal saving bug is fixed
 */

// Test the sanitization function
function sanitizeMealData(meal: any) {
  const clean = { ...meal };
  ['calories', 'protein', 'carbs', 'fats', 'fiber', 'serving_size'].forEach((key) => {
    const value = clean[key];
    if (value === '' || isNaN(value) || value === undefined || value === null) {
      clean[key] = 0;
    } else {
      clean[key] = Number(value);
    }
  });
  return clean;
}

// Test cases that would have broken Firestore
const testCases = [
  {
    name: "Empty strings (typical error case)",
    input: {
      meal_type: "breakfast",
      food_name: "Test Food",
      brand: "Test Brand",
      serving_size: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      fiber: ''
    }
  },
  {
    name: "Mixed valid/invalid values",
    input: {
      meal_type: "lunch", 
      food_name: "Another Food",
      brand: "Brand",
      serving_size: 1.5,
      calories: 250,
      protein: '',
      carbs: undefined,
      fats: null,
      fiber: 'invalid'
    }
  },
  {
    name: "NaN values",
    input: {
      meal_type: "dinner",
      food_name: "Problem Food", 
      brand: "",
      serving_size: NaN,
      calories: NaN,
      protein: NaN,
      carbs: NaN,
      fats: NaN,
      fiber: NaN
    }
  }
];

console.log('🧪 Testing Firestore Data Sanitization\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('Input:', JSON.stringify(testCase.input, null, 2));
  
  const sanitized = sanitizeMealData(testCase.input);
  console.log('Sanitized:', JSON.stringify(sanitized, null, 2));
  
  // Check if all numeric fields are now valid numbers
  const numericFields = ['calories', 'protein', 'carbs', 'fats', 'fiber', 'serving_size'];
  const allValid = numericFields.every(field => 
    typeof sanitized[field] === 'number' && !isNaN(sanitized[field])
  );
  
  console.log(`✅ All fields valid: ${allValid ? 'YES' : 'NO'}`);
  console.log('─'.repeat(50));
});

console.log('\n💡 Summary:');
console.log('• Empty strings → 0');
console.log('• undefined/null → 0'); 
console.log('• NaN → 0');
console.log('• Invalid strings → 0');
console.log('• Valid numbers → preserved');
console.log('\n🎯 This should fix the INVALID_ARGUMENT error!');