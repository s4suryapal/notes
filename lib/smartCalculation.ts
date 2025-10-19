/**
 * Smart Calculation Utility
 *
 * Detects numbers in text and calculates statistics like sum, average, count, min, max
 */

export interface CalculationStats {
  numbers: number[];
  sum: number;
  average: number;
  count: number;
  min: number;
  max: number;
}

/**
 * Extract all numbers from text
 * Supports:
 * - Integers: 1000, 500
 * - Decimals: 1000.50, 500.25
 * - Comma-separated: 1,000, 10,000.50
 * - Negative numbers: -500, -1000.50
 */
export function detectNumbers(text: string): number[] {
  if (!text || typeof text !== 'string') return [];

  // Remove HTML tags if present (from rich text editor)
  const plainText = text.replace(/<[^>]*>/g, ' ');

  // Regular expression to match standalone numbers while excluding dates:
  // - Lookbehind to ensure not part of a word (space, start, or punctuation before)
  // - Negative lookahead to exclude numbers that are part of dates (e.g., 20-10-2025)
  // - Negative lookbehind to exclude numbers preceded by date separators
  // - Optional negative sign
  // - Either comma-separated format (1,000) or plain digits
  // - Optional decimal part
  // - Negative lookahead to ensure not followed by date separator
  // - Word boundary at end
  const numberPattern = /(?<=^|[\s,;:()[\]{}])(?![\d-\/\.]*\d[-\/]\d)(?<![-\/]\d{1,2}[-\/])-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?![-\/]\d)(?=\b)/g;

  const matches = plainText.match(numberPattern);

  if (!matches) return [];

  // Convert matched strings to numbers (remove commas)
  const numbers = matches
    .map(match => parseFloat(match.replace(/,/g, '')))
    .filter(num => !isNaN(num) && isFinite(num));

  return numbers;
}

/**
 * Calculate statistics from an array of numbers
 */
export function calculateStats(numbers: number[]): CalculationStats | null {
  if (!numbers || numbers.length === 0) {
    return null;
  }

  const sum = numbers.reduce((acc, num) => acc + num, 0);
  const count = numbers.length;
  const average = sum / count;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return {
    numbers,
    sum,
    average,
    count,
    min,
    max,
  };
}

/**
 * Format number with commas and decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (!isFinite(num)) return '0';

  // Check if number has decimals
  const hasDecimals = num % 1 !== 0;

  // If no decimals, show as integer
  if (!hasDecimals) {
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  }

  // Show decimals
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get calculation summary text
 */
export function getCalculationSummary(stats: CalculationStats): string {
  const { count, sum, average } = stats;

  if (count === 0) return '';
  if (count === 1) return `1 number: ${formatNumber(sum)}`;

  return `${count} numbers • Sum: ${formatNumber(sum)} • Avg: ${formatNumber(average)}`;
}

/**
 * Detect if text contains enough numbers to show calculations
 * Requires at least 2 numbers to be meaningful
 */
export function shouldShowCalculation(text: string): boolean {
  const numbers = detectNumbers(text);
  return numbers.length >= 2;
}
