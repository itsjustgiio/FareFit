/**
 * TypeScript type definitions for barcode scanning and nutrition APIs
 */

// OpenFoodFacts API Response Types
export interface OpenFoodFactsResponse {
  status: number; // 0 = not found, 1 = found
  code: string; // barcode number
  product?: OpenFoodFactsProduct;
  status_verbose?: string;
}

export interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OpenFoodFactsNutriments;
  image_url?: string;
  ingredients_text?: string;
  allergens?: string;
  categories?: string;
  labels?: string;
}

export interface OpenFoodFactsNutriments {
  'energy-kcal'?: number;
  'energy-kcal_100g'?: number;
  'energy-kcal_serving'?: number;
  proteins?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  carbohydrates?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  fat?: number;
  fat_100g?: number;
  fat_serving?: number;
  fiber?: number;
  fiber_100g?: number;
  fiber_serving?: number;
  sugars?: number;
  sodium?: number;
  salt?: number;
}

// Barcode Scan Result
export interface BarcodeScanResult {
  barcode: string;
  format: string; // e.g., "UPC-A", "EAN-13"
  timestamp: Date;
}

// Parsed Food Item from Barcode (matches your existing FoodItem interface)
export interface ParsedFoodItem {
  id: string;
  name: string;
  brandName: string;
  servingSize: string;
  amountConsumed: number;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseFiber: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isExpanded: boolean;
  isFavorite?: boolean;
}

// Scanner State
export interface ScannerState {
  isScanning: boolean;
  isFetching: boolean;
  error: string | null;
  scannedBarcode: string | null;
}

// Error types
export type ScannerError =
  | 'PRODUCT_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_NOT_AVAILABLE'
  | 'INVALID_BARCODE'
  | 'API_ERROR';

export interface ScannerErrorDetail {
  type: ScannerError;
  message: string;
  barcode?: string;
}
