/**
 * Utility functions for unit conversion
 */

/**
 * Convert pixels to inches and millimeters
 * @param pixels Number of pixels
 * @returns Object containing inches and millimeters values
 */
export const convertPixelsToPhysicalUnits = (pixels: number): { 
  inches: number; 
  mm: number; 
} => {
  // Standard conversion: 96 pixels = 1 inch
  const inches = pixels / 96;
  // 1 inch = 25.4 mm
  const mm = inches * 25.4;
  
  return {
    inches: Number(inches.toFixed(2)),
    mm: Number(mm.toFixed(1))
  };
};

/**
 * Convert inches to pixels
 * @param inches Number of inches
 * @returns Number of pixels
 */
export const convertInchesToPixels = (inches: number): number => {
  // Standard conversion: 1 inch = 96 pixels
  return Math.round(inches * 96);
};

/**
 * Convert millimeters to pixels
 * @param mm Number of millimeters
 * @returns Number of pixels
 */
export const convertMmToPixels = (mm: number): number => {
  // 1 mm = (1/25.4) inches, 1 inch = 96 pixels
  return Math.round(mm * (96 / 25.4));
};

/**
 * Convert pixels to the specified unit
 * @param pixels Number of pixels
 * @param unit Target unit ('px', 'in', or 'mm')
 * @returns Value in the specified unit
 */
export const convertPixelsToUnit = (pixels: number, unit: 'px' | 'in' | 'mm'): number => {
  switch (unit) {
    case 'px':
      return pixels;
    case 'in':
      return convertPixelsToPhysicalUnits(pixels).inches;
    case 'mm':
      return convertPixelsToPhysicalUnits(pixels).mm;
    default:
      return pixels;
  }
};

/**
 * Convert from a specified unit to pixels
 * @param value Value in the specified unit
 * @param unit Source unit ('px', 'in', or 'mm')
 * @returns Number of pixels
 */
export const convertToPixels = (value: number, unit: 'px' | 'in' | 'mm'): number => {
  switch (unit) {
    case 'px':
      return value;
    case 'in':
      return convertInchesToPixels(value);
    case 'mm':
      return convertMmToPixels(value);
    default:
      return value;
  }
};
