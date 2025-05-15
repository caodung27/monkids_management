/**
 * Format a number as Vietnamese currency (VND)
 * @param value Number to format
 * @returns Formatted string in VND
 */
export const formatVND = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    // Removes the decimal part, as VND typically doesn't use decimal points
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format a number with thousand separators
 * @param value Number to format
 * @returns Formatted string with thousand separators
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
}; 