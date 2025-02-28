import { useState, useEffect, useRef } from 'react'
import { FiRefreshCw, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

interface BorderEditorProps {
  initialThickness?: number;
  initialCornerRadius?: number;
  onChange: (borderProps: { thickness: number; cornerRadius: number }) => void;
  onReset?: () => void;
  disabled?: boolean;
  selectionCount?: number;
}

export const BorderEditor = ({
  initialThickness = 0,
  initialCornerRadius = 0,
  onChange,
  onReset,
  disabled = false,
  selectionCount = 1
}: BorderEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [thickness, setThickness] = useState(initialThickness);
  const [cornerRadius, setCornerRadius] = useState(initialCornerRadius);
  
  // Refs for input fields to maintain focus
  const thicknessInputRef = useRef<HTMLInputElement>(null);
  const cornerRadiusInputRef = useRef<HTMLInputElement>(null);
  
  // State to track if we should apply changes
  const [shouldApplyChanges, setShouldApplyChanges] = useState(false);
  
  // Effect to apply changes when shouldApplyChanges is true
  useEffect(() => {
    if (shouldApplyChanges) {
      onChange({ thickness, cornerRadius });
      setShouldApplyChanges(false);
    }
  }, [shouldApplyChanges, thickness, cornerRadius, onChange]);
  
  // Update state when props change
  useEffect(() => {
    setThickness(initialThickness);
    setCornerRadius(initialCornerRadius);
  }, [initialThickness, initialCornerRadius]);
  
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
      onChange({ thickness: newThickness, cornerRadius });
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
      onChange({ thickness, cornerRadius: newCornerRadius });
      borderChangeTimerRef.current = null;
    }, 300);
  };
  
  const handleBorderBlur = () => {
    // Only call onChange when the input loses focus
    onChange({ thickness, cornerRadius });
  };
  
  const handleBorderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Call onChange when Enter key is pressed
    if (e.key === 'Enter') {
      onChange({ thickness, cornerRadius });
      e.currentTarget.blur();
    }
  };
  
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      setThickness(0);
      setCornerRadius(0);
      onChange({ thickness: 0, cornerRadius: 0 });
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
