/**
 * Barcode Scanner Service
 * Integrates with OpenFoodFacts API to fetch product nutrition data
 */

import {
  OpenFoodFactsResponse,
  OpenFoodFactsProduct,
  ParsedFoodItem,
  ScannerErrorDetail,
} from '../types/barcode.types';

const OPENFOODFACTS_API_BASE = 'https://world.openfoodfacts.org/api/v2';

/**
 * Fetch product information by barcode from OpenFoodFacts
 * @param barcode - The barcode number (UPC, EAN, etc.)
 * @returns ParsedFoodItem or null if not found
 * @throws Error if network request fails
 */
export async function fetchProductByBarcode(
  barcode: string
): Promise<ParsedFoodItem | null> {
  try {
    console.log('🔍 Fetching product for barcode:', barcode);
    const url = `${OPENFOODFACTS_API_BASE}/product/${barcode}.json`;
    console.log('📡 API URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FareFit - Fitness Nutrition Tracker',
      },
    });

    console.log('📥 Response status:', response.status);

    // Handle 404 - product not found
    if (response.status === 404) {
      console.log('❌ Product not found in OpenFoodFacts database (404)');
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenFoodFactsResponse = await response.json();
    console.log('📦 API Response:', data);

    // Product not found in database
    if (data.status === 0 || !data.product) {
      console.log('❌ Product not found in OpenFoodFacts database');
      return null;
    }

    console.log('✅ Product found:', data.product.product_name);

    // Parse and return the product data
    const parsedData = parseProductToFoodItem(data.product, barcode);
    console.log('🎯 Parsed product data:', parsedData);

    // Check if product has valid nutrition data
    if (!hasValidNutritionData(parsedData)) {
      console.log('⚠️ Product found but has no nutrition data');
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('❌ Error fetching product from OpenFoodFacts:', error);
    throw error;
  }
}

/**
 * Parse OpenFoodFacts product data into FoodItem format
 * @param product - OpenFoodFacts product object
 * @param barcode - The scanned barcode
 * @returns ParsedFoodItem with nutrition data
 */
function parseProductToFoodItem(
  product: OpenFoodFactsProduct,
  barcode: string
): ParsedFoodItem {
  const nutriments = product.nutriments || {};

  // Determine serving size - prefer per serving data, fallback to 100g
  const servingSize = product.serving_size || '100g';
  const useServingData = !!product.serving_size;

  // Get nutrition values - prefer per serving, fallback to 100g
  const calories = useServingData
    ? nutriments['energy-kcal_serving'] || nutriments['energy-kcal'] || 0
    : nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;

  const protein = useServingData
    ? nutriments.proteins_serving || nutriments.proteins || 0
    : nutriments.proteins_100g || nutriments.proteins || 0;

  const carbs = useServingData
    ? nutriments.carbohydrates_serving || nutriments.carbohydrates || 0
    : nutriments.carbohydrates_100g || nutriments.carbohydrates || 0;

  const fat = useServingData
    ? nutriments.fat_serving || nutriments.fat || 0
    : nutriments.fat_100g || nutriments.fat || 0;

  const fiber = useServingData
    ? nutriments.fiber_serving || nutriments.fiber || 0
    : nutriments.fiber_100g || nutriments.fiber || 0;

  return {
    id: Date.now().toString(),
    name: product.product_name || 'Unknown Product',
    brandName: product.brands || '',
    servingSize: servingSize,
    amountConsumed: 1,
    baseCalories: Math.round(calories),
    baseProtein: Math.round(protein * 10) / 10,
    baseCarbs: Math.round(carbs * 10) / 10,
    baseFat: Math.round(fat * 10) / 10,
    baseFiber: Math.round(fiber * 10) / 10,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
    isExpanded: true,
    isFavorite: false,
  };
}

/**
 * Validate barcode format
 * @param barcode - Barcode string to validate
 * @returns true if valid format
 */
export function isValidBarcode(barcode: string): boolean {
  // Check if barcode is numeric and has valid length
  // UPC-A: 12 digits, EAN-13: 13 digits, EAN-8: 8 digits
  const numericBarcode = barcode.replace(/\D/g, '');
  const validLengths = [8, 12, 13, 14]; // Common barcode lengths

  return (
    numericBarcode.length > 0 && validLengths.includes(numericBarcode.length)
  );
}

/**
 * Create a scanner error detail object
 * @param type - Type of error
 * @param barcode - Optional barcode that caused the error
 * @returns ScannerErrorDetail object
 */
export function createScannerError(
  type: ScannerErrorDetail['type'],
  barcode?: string
): ScannerErrorDetail {
  const errorMessages: Record<ScannerErrorDetail['type'], string> = {
    PRODUCT_NOT_FOUND:
      'Product not found in database. Please try manual entry.',
    NETWORK_ERROR:
      'Network error. Please check your connection and try again.',
    CAMERA_PERMISSION_DENIED:
      'Camera permission denied. Please enable camera access in your browser settings.',
    CAMERA_NOT_AVAILABLE:
      'Camera not available. Please check your device settings.',
    INVALID_BARCODE: 'Invalid barcode format. Please try again.',
    API_ERROR: 'Error fetching product data. Please try again.',
  };

  return {
    type,
    message: errorMessages[type],
    barcode,
  };
}

/**
 * Check if a product has sufficient nutrition data
 * @param product - Parsed food item
 * @returns true if has nutrition data (even if 0 calories for diet drinks)
 */
export function hasValidNutritionData(product: ParsedFoodItem): boolean {
  // Product is valid if it has a name and serving size
  // (even if calories are 0, like diet sodas)
  return product.name !== 'Unknown Product' && product.servingSize.length > 0;
}

/**
 * Format barcode for display (add dashes for readability)
 * @param barcode - Raw barcode string
 * @returns Formatted barcode
 */
export function formatBarcodeDisplay(barcode: string): string {
  if (barcode.length === 12) {
    // UPC-A: XXX-XXX-XXX-XXX
    return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4');
  } else if (barcode.length === 13) {
    // EAN-13: X-XXXXXX-XXXXXX
    return barcode.replace(/(\d{1})(\d{6})(\d{6})/, '$1-$2-$3');
  }
  return barcode;
}
