/**
 * Unit conversion utilities for imperial/metric units
 */

export type UnitSystem = 'imperial' | 'metric';

// Weight conversions
export function lbsToKg(pounds: number): number {
  return pounds / 2.20462;
}

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

// Height conversions
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

// Formatting functions
export function formatWeight(kg: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const lbs = Math.round(kgToLbs(kg));
    return `${lbs} lbs`;
  } else {
    return `${kg} kg`;
  }
}

export function formatHeight(cm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  } else {
    return `${cm} cm`;
  }
}

export function formatWeightWithBoth(kg: number): string {
  const lbs = Math.round(kgToLbs(kg));
  return `${lbs} lbs (${kg} kg)`;
}

export function formatHeightWithBoth(cm: number): string {
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}" (${cm} cm)`;
}

// Get unit preference from localStorage
export function getUnitPreference(): UnitSystem {
  const saved = localStorage.getItem('farefit_units');
  return (saved as UnitSystem) || 'imperial'; // Default to imperial
}

// Save unit preference to localStorage
export function setUnitPreference(units: UnitSystem): void {
  localStorage.setItem('farefit_units', units);
}