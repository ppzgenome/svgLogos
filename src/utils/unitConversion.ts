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
