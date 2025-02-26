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
  let viewBox = svgElement.getAttribute('viewBox');
  
  // Calculate scale factor
  const scaleFactor = scalePercentage / 100;
  
  // Update width and height if they exist
  if (width && height) {
    const newWidth = Math.round(parseFloat(width) * scaleFactor);
    const newHeight = Math.round(parseFloat(height) * scaleFactor);
    svgElement.setAttribute('width', newWidth.toString());
    svgElement.setAttribute('height', newHeight.toString());
  }
  
  // Update viewBox if it exists
  if (viewBox) {
    const [minX, minY, vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
    const newViewBox = `${minX} ${minY} ${vbWidth} ${vbHeight}`;
    svgElement.setAttribute('viewBox', newViewBox);
  }
  
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
