/**
 * Validation utilities for user input
 */

/**
 * Validates a birth date string
 * @param birthDate - Date string in YYYY-MM-DD format
 * @returns Error message if invalid, null if valid
 */
export const validateBirthDate = (birthDate: string): string | null => {
  if (!birthDate) {
    return "Please select your birth date";
  }

  const selectedDate = new Date(birthDate);
  const today = new Date();
  const minDate = new Date();
  const maxDate = new Date();
  
  // Set minimum date (13 years ago from today)
  minDate.setFullYear(today.getFullYear() - 13);
  
  // Set maximum date (120 years ago from today - reasonable max age)
  maxDate.setFullYear(today.getFullYear() - 120);
  
  // Check if date is in the future
  if (selectedDate > today) {
    return "Birth date cannot be in the future";
  }
  
  // Check if user is too young (under 13)
  if (selectedDate > minDate) {
    return "You must be at least 13 years old to use this app";
  }
  
  // Check if date is unreasonably old (over 120 years)
  if (selectedDate < maxDate) {
    return "Please enter a valid birth date";
  }
  
  return null; // Valid date
};

/**
 * Get the maximum allowed date (today)
 */
export const getMaxBirthDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get the minimum allowed date (120 years ago)
 */
export const getMinBirthDate = (): string => {
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  return minDate.toISOString().split('T')[0];
};