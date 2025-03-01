import { useState, useEffect, useRef } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

interface BorderEditorProps {
  initialThickness?: number;
  initialCornerRadius?: number;
  initialLineStyle?: string;
  onChange: (borderProps: { thickness: number; cornerRadius: number; lineStyle?: string }) => void;
  onReset?: () => void;
  disabled?: boolean;
}

export const BorderEditor = ({
  initialThickness = 0,
  initialCornerRadius = 0,
  initialLineStyle = 'solid',
  onChange,
  onReset,
  disabled = false
}: BorderEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [thickness, setThickness] = useState(initialThickness);
  const [cornerRadius, setCornerRadius] = useState(initialCornerRadius);
  const [lineStyle, setLineStyle] = useState(initialLineStyle);
  
  // Refs for input fields to maintain focus
  const thicknessInputRef = useRef<HTMLInputElement>(null);
  const cornerRadiusInputRef = useRef<HTMLInputElement>(null);
  
  // State to track if we should apply changes
  const [shouldApplyChanges, setShouldApplyChanges] = useState(false);
  
  // Effect to apply changes when shouldApplyChanges is true
  useEffect(() => {
    if (shouldApplyChanges) {
      onChange({ thickness, cornerRadius, lineStyle });
      setShouldApplyChanges(false);
    }
  }, [shouldApplyChanges, thickness, cornerRadius, lineStyle, onChange]);
  
  // Update state when props change
  useEffect(() => {
    setThickness(initialThickness);
    setCornerRadius(initialCornerRadius);
    setLineStyle(initialLineStyle);
  }, [initialThickness, initialCornerRadius, initialLineStyle]);
  
  // Debounce timer for border changes
  const borderChangeTimerRef = useRef<number | null>(null);
  
  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThickness = parseInt(e.target.value, 10) || 0;
    setThickness(newThickness);
    
    // Apply changes with debounce to maintain focus but still update
    if (borderChangeTimerRef.current) {
      window.clearTimeout(borderChangeTimerRef.current);
    }
    
    borderChangeTimerRef.current = window.setTimeout(() => {
      onChange({ thickness: newThickness, cornerRadius, lineStyle });
      borderChangeTimerRef.current = null;
    }, 300);
  };
  
  const handleCornerRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCornerRadius = parseInt(e.target.value, 10) || 0;
    setCornerRadius(newCornerRadius);
    
    // Apply changes with debounce to maintain focus but still update
    if (borderChangeTimerRef.current) {
      window.clearTimeout(borderChangeTimerRef.current);
    }
    
    borderChangeTimerRef.current = window.setTimeout(() => {
      onChange({ thickness, cornerRadius: newCornerRadius, lineStyle });
      borderChangeTimerRef.current = null;
    }, 300);
  };
  
  const handleLineStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLineStyle = e.target.value;
    setLineStyle(newLineStyle);
    
    // Apply changes with debounce to maintain focus but still update
    if (borderChangeTimerRef.current) {
      window.clearTimeout(borderChangeTimerRef.current);
    }
    
    borderChangeTimerRef.current = window.setTimeout(() => {
      onChange({ thickness, cornerRadius, lineStyle: newLineStyle });
      borderChangeTimerRef.current = null;
    }, 300);
  };
  
  const handleBorderBlur = () => {
    // Only call onChange when the input loses focus
    onChange({ thickness, cornerRadius, lineStyle });
  };
  
  const handleBorderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Call onChange when Enter key is pressed
    if (e.key === 'Enter') {
      onChange({ thickness, cornerRadius, lineStyle });
      e.currentTarget.blur();
    }
  };
  
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      setThickness(0);
      setCornerRadius(0);
      setLineStyle('solid');
      onChange({ thickness: 0, cornerRadius: 0, lineStyle: 'solid' });
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div>
      {/* Header - Always visible and clickable */}
      <div 
        className="flex items-center cursor-pointer" 
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <FiChevronDown className="mr-2 text-gray-600" />
        ) : (
          <FiChevronRight className="mr-2 text-gray-600" />
        )}
        <h3 className="text-lg font-medium text-gray-900">
          Border
        </h3>
      </div>
      
      {/* Content - Conditionally rendered based on expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-gray-500 mt-3 mb-3">
              Select one or more logos to transform:
            </p>
            
            {/* Combined Thickness and Radius controls in one row */}
            <div className="flex items-center">
              <label htmlFor="thickness" className="text-sm font-medium mr-4">
                Line Thickness (px)
              </label>
              <div className="mr-6">
                <input
                  ref={thicknessInputRef}
                  type="number"
                  min="0"
                  max="50"
                  value={thickness}
                  onChange={handleThicknessChange}
                  onBlur={handleBorderBlur}
                  onKeyDown={handleBorderKeyDown}
                  className="input w-16 text-center"
                  disabled={disabled}
                />
              </div>
              
              <label htmlFor="cornerRadius" className="text-sm font-medium mr-4">
                Corner Radius (px)
              </label>
              <div className="mr-6">
                <input
                  ref={cornerRadiusInputRef}
                  type="number"
                  min="0"
                  max="100"
                  value={cornerRadius}
                  onChange={handleCornerRadiusChange}
                  onBlur={handleBorderBlur}
                  onKeyDown={handleBorderKeyDown}
                  className="input w-16 text-center"
                  disabled={disabled}
                />
              </div>
              
              <label htmlFor="lineStyle" className="text-sm font-medium mr-4">
                Line Style
              </label>
              <div className="mr-6">
                <select
                  value={lineStyle}
                  onChange={handleLineStyleChange}
                  className="input w-28"
                  disabled={disabled || thickness === 0}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="dashdot">Dash-dot</option>
                  <option value="double">Double</option>
                </select>
              </div>
              
              <button
                onClick={handleReset}
                className="btn-secondary text-sm"
                disabled={disabled || (thickness === 0 && cornerRadius === 0)}
              >
                Remove Border
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
