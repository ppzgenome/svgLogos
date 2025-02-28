/**
 * SVG manipulation service for handling color changes and other transformations
 */

/**
 * Interface for gradient definition
 */
export interface GradientDefinition {
  id: string;
  startColor: string;
  endColor: string;
  direction: string;
  name: string;
  startPosition?: number; // Position of start color (0-100)
  endPosition?: number; // Position of end color (0-100)
}

/**
 * Interface for border properties
 */
export interface BorderProperties {
  thickness: number;
  cornerRadius: number;
}

/**
 * Changes the color of an SVG by modifying fill and stroke attributes
 * @param svgUrl URL of the SVG to modify
 * @param color New color to apply (hex format)
 * @returns Promise resolving to a new object URL for the colored SVG
 */
export const changeSvgColor = async (svgUrl: string, color: string): Promise<string> => {
  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  
  // Apply color to all paths, shapes, and strokes
  const elements = svgDoc.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon');
  elements.forEach(el => {
    // Remove any existing fill if it's not 'none'
    if (el.getAttribute('fill') !== 'none') {
      el.setAttribute('fill', color);
    }
    
    // Change stroke color if it exists
    if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
      el.setAttribute('stroke', color);
    }
  });
  
  // Convert back to string and create a new object URL
  const serializer = new XMLSerializer();
  const coloredSvgText = serializer.serializeToString(svgDoc);
  const blob = new Blob([coloredSvgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
};

/**
 * Applies a linear gradient to an SVG
 * @param svgUrl URL of the SVG to modify
 * @param gradient Gradient definition with start/end colors and direction
 * @returns Promise resolving to a new object URL for the gradient-colored SVG
 */
export const changeSvgGradient = async (svgUrl: string, gradient: GradientDefinition): Promise<string> => {
  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  
  // Get the SVG element
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('Invalid SVG: No SVG element found');
  }
  
  // Create a unique ID for the gradient
  const gradientId = `gradient-${Math.random().toString(36).substring(2, 9)}`;
  
  // Create the gradient definition
  const defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const linearGradient = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  linearGradient.setAttribute('id', gradientId);
  
  // Set gradient direction
  switch (gradient.direction) {
    case 'to right':
      linearGradient.setAttribute('x1', '0%');
      linearGradient.setAttribute('y1', '0%');
      linearGradient.setAttribute('x2', '100%');
      linearGradient.setAttribute('y2', '0%');
      break;
    case 'to bottom':
      linearGradient.setAttribute('x1', '0%');
      linearGradient.setAttribute('y1', '0%');
      linearGradient.setAttribute('x2', '0%');
      linearGradient.setAttribute('y2', '100%');
      break;
    case 'to bottom right':
      linearGradient.setAttribute('x1', '0%');
      linearGradient.setAttribute('y1', '0%');
      linearGradient.setAttribute('x2', '100%');
      linearGradient.setAttribute('y2', '100%');
      break;
    case 'to top right':
      linearGradient.setAttribute('x1', '0%');
      linearGradient.setAttribute('y1', '100%');
      linearGradient.setAttribute('x2', '100%');
      linearGradient.setAttribute('y2', '0%');
      break;
    default:
      linearGradient.setAttribute('x1', '0%');
      linearGradient.setAttribute('y1', '0%');
      linearGradient.setAttribute('x2', '100%');
      linearGradient.setAttribute('y2', '0%');
  }
  
  // Add gradient stops with positions
  const stop1 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', `${gradient.startPosition || 0}%`);
  stop1.setAttribute('stop-color', gradient.startColor);
  
  const stop2 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', `${gradient.endPosition || 100}%`);
  stop2.setAttribute('stop-color', gradient.endColor);
  
  linearGradient.appendChild(stop1);
  linearGradient.appendChild(stop2);
  defs.appendChild(linearGradient);
  
  // Add defs to SVG if it doesn't exist
  const existingDefs = svgElement.querySelector('defs');
  if (existingDefs) {
    existingDefs.appendChild(linearGradient);
  } else {
    svgElement.insertBefore(defs, svgElement.firstChild);
  }
  
  // Apply gradient to all paths, shapes, and strokes
  const elements = svgDoc.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon');
  elements.forEach(el => {
    // Apply gradient fill if the element doesn't have fill="none"
    if (el.getAttribute('fill') !== 'none') {
      el.setAttribute('fill', `url(#${gradientId})`);
    }
    
    // Don't change stroke for now to keep the outline consistent
  });
  
  // Convert back to string and create a new object URL
  const serializer = new XMLSerializer();
  const gradientSvgText = serializer.serializeToString(svgDoc);
  const blob = new Blob([gradientSvgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
};

/**
 * Resets an SVG to its original state by removing color modifications
 * @param originalSvgUrl URL of the original unmodified SVG
 * @returns Promise resolving to a new object URL for the reset SVG
 */
export const resetSvgColor = async (originalSvgUrl: string): Promise<string> => {
  // Simply return a new object URL for the original SVG
  const response = await fetch(originalSvgUrl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Changes the dimensions of an SVG
 * @param svgUrl URL of the SVG to modify
 * @param width New width in pixels
 * @param height New height in pixels
 * @returns Promise resolving to a new object URL for the resized SVG
 */
export const changeSvgDimensions = async (svgUrl: string, width: number, height: number): Promise<string> => {
  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  
  // Get the SVG element
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('Invalid SVG: No SVG element found');
  }
  
  // Update width and height attributes
  svgElement.setAttribute('width', width.toString());
  svgElement.setAttribute('height', height.toString());
  
  // Convert back to string and create a new object URL
  const serializer = new XMLSerializer();
  const resizedSvgText = serializer.serializeToString(svgDoc);
  const blob = new Blob([resizedSvgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
};

/**
 * Scales an SVG by a percentage
 * @param svgUrl URL of the SVG to modify
 * @param scalePercentage Percentage to scale (e.g., 50, 150, 200)
 * @returns Promise resolving to a new object URL for the scaled SVG
 */
export const scaleSvgDimensions = async (svgUrl: string, scalePercentage: number): Promise<string> => {
  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  
  // Get the SVG element
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('Invalid SVG: No SVG element found');
  }
  
  // Get current dimensions
  let width = svgElement.getAttribute('width');
  let height = svgElement.getAttribute('height');
  
  // Calculate scale factor
  const scaleFactor = scalePercentage / 100;
  
  // Update width and height if they exist
  if (width && height) {
    const newWidth = Math.round(parseFloat(width) * scaleFactor);
    const newHeight = Math.round(parseFloat(height) * scaleFactor);
    svgElement.setAttribute('width', newWidth.toString());
    svgElement.setAttribute('height', newHeight.toString());
  }
  
  // Keep the original viewBox if it exists
  // No need to modify the viewBox when scaling
  
  // Convert back to string and create a new object URL
  const serializer = new XMLSerializer();
  const scaledSvgText = serializer.serializeToString(svgDoc);
  const blob = new Blob([scaledSvgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
};

/**
 * Resets an SVG to its original dimensions
 * @param originalSvgUrl URL of the original unmodified SVG
 * @returns Promise resolving to a new object URL for the reset SVG
 */
export const resetSvgDimensions = async (originalSvgUrl: string): Promise<string> => {
  // Simply return a new object URL for the original SVG
  const response = await fetch(originalSvgUrl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Adds or updates a border around an SVG logo
 * @param svgUrl URL of the SVG to modify
 * @param thickness Border thickness in pixels
 * @param cornerRadius Corner radius in pixels
 * @param color Border color (hex format) or undefined if using gradient
 * @param gradient Gradient definition or undefined if using solid color
 * @returns Promise resolving to a new object URL for the SVG with border
 */
export const addSvgBorder = async (
  svgUrl: string, 
  thickness: number, 
  cornerRadius: number,
  color?: string,
  gradient?: GradientDefinition
): Promise<string> => {
  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  
  // Get the SVG element
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('Invalid SVG: No SVG element found');
  }
  
  // Get or create viewBox
  let viewBox = svgElement.getAttribute('viewBox');
  let viewBoxValues: number[] = [0, 0, 0, 0];
  let width: number;
  let height: number;
  
  if (viewBox) {
    // Parse existing viewBox
    viewBoxValues = viewBox.split(/\s+/).map(parseFloat);
    width = viewBoxValues[2];
    height = viewBoxValues[3];
  } else {
    // Get width and height attributes
    width = parseFloat(svgElement.getAttribute('width') || '24');
    height = parseFloat(svgElement.getAttribute('height') || '24');
    
    // Create viewBox from width/height
    viewBoxValues = [0, 0, width, height];
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  
  // Create or update the border rectangle
  let borderRect = svgDoc.querySelector('rect[data-border="true"]');
  
  if (!borderRect) {
    borderRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('data-border', 'true');
    
    // Insert the border as the first child so it appears behind the content
    svgElement.insertBefore(borderRect, svgElement.firstChild);
  }
  
  // Calculate dynamic padding as a percentage of logo dimensions with a minimum value
  const paddingPercentage = 0.1; // 10% of logo dimensions
  const minPadding = 5; // Minimum 5px padding
  
  // Calculate actual padding based on logo dimensions
  const paddingWidth = Math.max(width * paddingPercentage, minPadding);
  const paddingHeight = Math.max(height * paddingPercentage, minPadding);
  
  // Set border properties to create a proper border (outline) around the SVG content
  // Position the border with calculated padding to ensure it grows outward, not inward
  borderRect.setAttribute('x', (viewBoxValues[0] - paddingWidth).toString());
  borderRect.setAttribute('y', (viewBoxValues[1] - paddingHeight).toString());
  borderRect.setAttribute('width', (width + paddingWidth * 2).toString());
  borderRect.setAttribute('height', (height + paddingHeight * 2).toString());
  borderRect.setAttribute('rx', cornerRadius.toString());
  borderRect.setAttribute('ry', cornerRadius.toString());
  borderRect.setAttribute('fill', 'none');
  borderRect.setAttribute('stroke-width', thickness.toString());
  
  // Adjust the viewBox to include both the padding and border
  // This ensures the entire SVG (including border and padding) is visible
  const newViewBox = `${viewBoxValues[0] - paddingWidth - thickness} ${viewBoxValues[1] - paddingHeight - thickness} ${width + (paddingWidth + thickness)*2} ${height + (paddingHeight + thickness)*2}`;
  svgElement.setAttribute('viewBox', newViewBox);
  
  // Apply color or gradient to the stroke instead of fill
  if (gradient) {
    // Create a unique ID for the gradient
    const gradientId = `border-gradient-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the gradient definition
    const defs = svgDoc.querySelector('defs') || svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const linearGradient = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    linearGradient.setAttribute('id', gradientId);
    
    // Set gradient direction
    switch (gradient.direction) {
      case 'to right':
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '0%');
        break;
      case 'to bottom':
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '0%');
        linearGradient.setAttribute('y2', '100%');
        break;
      case 'to bottom right':
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '100%');
        break;
      case 'to top right':
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '100%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '0%');
        break;
      default:
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '0%');
    }
    
    // Add gradient stops with positions
    const stop1 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', `${gradient.startPosition || 0}%`);
    stop1.setAttribute('stop-color', gradient.startColor);
    
    const stop2 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', `${gradient.endPosition || 100}%`);
    stop2.setAttribute('stop-color', gradient.endColor);
    
    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    
    // Add defs to SVG if it doesn't exist
    if (!svgDoc.querySelector('defs')) {
      svgElement.insertBefore(defs, svgElement.firstChild);
    }
    
    defs.appendChild(linearGradient);
    
    // Apply gradient to stroke
    borderRect.setAttribute('stroke', `url(#${gradientId})`);
  } else if (color) {
    // Apply solid color to stroke
    borderRect.setAttribute('stroke', color);
  } else {
    // Default to black if no color or gradient is specified
    borderRect.setAttribute('stroke', '#000000');
  }
  
  // Convert back to string and create a new object URL
  const serializer = new XMLSerializer();
  const borderedSvgText = serializer.serializeToString(svgDoc);
  const blob = new Blob([borderedSvgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
};

/**
 * Removes the border from an SVG
 * @param svgUrl URL of the SVG to modify
 * @returns Promise resolving to a new object URL for the SVG without border
 */
export const removeSvgBorder = async (svgUrl: string): Promise<string> => {
  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  
  // Parse the SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  
  // Get the SVG element
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('Invalid SVG: No SVG element found');
  }
  
  // Find and remove the border rectangle
  const borderRect = svgDoc.querySelector('rect[data-border="true"]');
  if (borderRect && borderRect.parentNode) {
    // Get the border properties
    const x = parseFloat(borderRect.getAttribute('x') || '0');
    const y = parseFloat(borderRect.getAttribute('y') || '0');
    const width = parseFloat(borderRect.getAttribute('width') || '0');
    const height = parseFloat(borderRect.getAttribute('height') || '0');
    
    // Get the current viewBox
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      // Calculate the original content dimensions
      const contentWidth = width - (Math.abs(x) * 2);
      const contentHeight = height - (Math.abs(y) * 2);
      
      // Restore the original viewBox
      const originalViewBox = `0 0 ${contentWidth} ${contentHeight}`;
      svgElement.setAttribute('viewBox', originalViewBox);
    }
    
    // Remove the border rectangle
    borderRect.parentNode.removeChild(borderRect);
  }
  
  // Convert back to string and create a new object URL
  const serializer = new XMLSerializer();
  const noBorderSvgText = serializer.serializeToString(svgDoc);
  const blob = new Blob([noBorderSvgText], {type: 'image/svg+xml'});
  return URL.createObjectURL(blob);
};
