import { useState, useEffect, useRef } from 'react'
import { FiLock, FiUnlock, FiRefreshCw as _FiRefreshCw, FiLoader as _FiLoader } from 'react-icons/fi'
import { convertPixelsToPhysicalUnits } from '../utils/unitConversion'

// Type for dimension unit selection
type DimensionUnit = 'px' | 'in' | 'mm'

interface DimensionEditorProps {
  initialDimensions?: { width: number; height: number }
  originalDimensions?: { width: number; height: number }
  onChange: (dimensions: { width: number; height: number }) => void
  onScaleChange?: (scalePercentage: number) => void
  onReset?: () => void
  disabled?: boolean
  selectionCount?: number
  noLogos?: boolean
}

export const DimensionEditor = ({
  initialDimensions,
  originalDimensions,
  onChange,
  onScaleChange,
  onReset,
  disabled = false,
  selectionCount = 1,
  noLogos = false
}: DimensionEditorProps) => {
  const [width, setWidth] = useState(noLogos ? 0 : (initialDimensions?.width || 0))
  const [height, setHeight] = useState(noLogos ? 0 : (initialDimensions?.height || 0))
  const [lockAspectRatio, setLockAspectRatio] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(1)
  const [selectedPresetUnit, setSelectedPresetUnit] = useState<DimensionUnit>('px')
  
  // Refs for input fields to maintain focus
  const widthInputRef = useRef<HTMLInputElement>(null)
  const heightInputRef = useRef<HTMLInputElement>(null)
  
  // State to track if we should apply changes
  const [shouldApplyChanges, setShouldApplyChanges] = useState(false)
  
  // Effect to apply changes when shouldApplyChanges is true
  useEffect(() => {
    if (shouldApplyChanges) {
      onChange({ width, height });
      setShouldApplyChanges(false);
    }
  }, [shouldApplyChanges, width, height, onChange]);

  // Calculate and store aspect ratio when dimensions change
  useEffect(() => {
    if (initialDimensions?.width && initialDimensions?.height) {
      setWidth(initialDimensions.width)
      setHeight(initialDimensions.height)
      setAspectRatio(initialDimensions.width / initialDimensions.height)
    }
  }, [initialDimensions])

  // Debounce timer for dimension changes
  const dimensionChangeTimerRef = useRef<number | null>(null);
  
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10) || 0
    setWidth(newWidth)
    
    if (lockAspectRatio && newWidth > 0) {
      const newHeight = Math.round(newWidth / aspectRatio)
      setHeight(newHeight)
      
      // Apply changes with debounce to maintain focus but still update
      if (dimensionChangeTimerRef.current) {
        window.clearTimeout(dimensionChangeTimerRef.current);
      }
      
      dimensionChangeTimerRef.current = window.setTimeout(() => {
        onChange({ width: newWidth, height: newHeight });
        dimensionChangeTimerRef.current = null;
      }, 300);
    } else {
      // Apply changes with debounce
      if (dimensionChangeTimerRef.current) {
        window.clearTimeout(dimensionChangeTimerRef.current);
      }
      
      dimensionChangeTimerRef.current = window.setTimeout(() => {
        onChange({ width: newWidth, height });
        dimensionChangeTimerRef.current = null;
      }, 300);
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10) || 0
    setHeight(newHeight)
    
    if (lockAspectRatio && newHeight > 0) {
      const newWidth = Math.round(newHeight * aspectRatio)
      setWidth(newWidth)
      
      // Apply changes with debounce to maintain focus but still update
      if (dimensionChangeTimerRef.current) {
        window.clearTimeout(dimensionChangeTimerRef.current);
      }
      
      dimensionChangeTimerRef.current = window.setTimeout(() => {
        onChange({ width: newWidth, height: newHeight });
        dimensionChangeTimerRef.current = null;
      }, 300);
    } else {
      // Apply changes with debounce
      if (dimensionChangeTimerRef.current) {
        window.clearTimeout(dimensionChangeTimerRef.current);
      }
      
      dimensionChangeTimerRef.current = window.setTimeout(() => {
        onChange({ width, height: newHeight });
        dimensionChangeTimerRef.current = null;
      }, 300);
    }
  }
  
  const handleDimensionBlur = () => {
    // Only call onChange when the input loses focus
    onChange({ width, height })
  }
  
  const handleDimensionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Call onChange when Enter key is pressed
    if (e.key === 'Enter') {
      onChange({ width, height })
      e.currentTarget.blur()
    }
  }

  const toggleAspectRatio = () => {
    setLockAspectRatio(!lockAspectRatio)
  }

  const applyPresetDimensions = (presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth)
    setHeight(presetHeight)
    onChange({ width: presetWidth, height: presetHeight })
  }
  
  const applyInchPresetDimensions = (widthInches: number, heightInches: number) => {
    // Convert inches to pixels (1 inch = 96 pixels)
    const widthPx = Math.round(widthInches * 96)
    const heightPx = Math.round(heightInches * 96)
    
    // Apply the pixel dimensions
    applyPresetDimensions(widthPx, heightPx)
  }
  
  const applyMmPresetDimensions = (widthMm: number, heightMm: number) => {
    // Convert mm to pixels (1 mm = 96/25.4 pixels)
    const widthPx = Math.round(widthMm * (96 / 25.4))
    const heightPx = Math.round(heightMm * (96 / 25.4))
    
    // Apply the pixel dimensions
    applyPresetDimensions(widthPx, heightPx)
  }

  const applyScalePercentage = (percentage: number) => {
    if (onScaleChange) {
      onScaleChange(percentage)
    } else if (originalDimensions) {
      const scaledWidth = Math.round(originalDimensions.width * (percentage / 100))
      const scaledHeight = Math.round(originalDimensions.height * (percentage / 100))
      setWidth(scaledWidth)
      setHeight(scaledHeight)
      onChange({ width: scaledWidth, height: scaledHeight })
    }
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else if (originalDimensions) {
      setWidth(originalDimensions.width)
      setHeight(originalDimensions.height)
      onChange({ width: originalDimensions.width, height: originalDimensions.height })
    }
  }

  // Pixel presets (common icon sizes)
  const pixelPresets = [
    { label: '16×16', width: 16, height: 16 },
    { label: '24×24', width: 24, height: 24 },
    { label: '32×32', width: 32, height: 32 },
    { label: '48×48', width: 48, height: 48 },
    { label: '64×64', width: 64, height: 64 },
    { label: '128×128', width: 128, height: 128 }
  ]
  
  // Inch presets (common print sizes)
  const inchPresets = [
    { label: '0.25×0.25', width: 0.25, height: 0.25 },
    { label: '0.5×0.5', width: 0.5, height: 0.5 },
    { label: '1×1', width: 1, height: 1 },
    { label: '2×2', width: 2, height: 2 },
    { label: '3×3', width: 3, height: 3 },
    { label: '4×4', width: 4, height: 4 }
  ]
  
  // Millimeter presets (common metric sizes)
  const mmPresets = [
    { label: '5×5', width: 5, height: 5 },
    { label: '10×10', width: 10, height: 10 },
    { label: '20×20', width: 20, height: 20 },
    { label: '50×50', width: 50, height: 50 },
    { label: '75×75', width: 75, height: 75 },
    { label: '100×100', width: 100, height: 100 }
  ]

  // Scale percentages
  const scaleOptions = [
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
    { label: '150%', value: 150 },
    { label: '200%', value: 200 },
    { label: '500%', value: 500 }
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Select one or more logos to transform:
      </p>
      
      <div>
        {/* Scale Title */}
        <div className="flex items-center">
          <div className="w-full">
            <span className="text-sm font-medium">Scale</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {scaleOptions.map(option => (
            <button
              key={option.label}
              onClick={() => applyScalePercentage(option.value)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              disabled={disabled || !originalDimensions}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        {/* Preset Dimensions Title */}
        <div className="flex items-center">
          <div className="w-full">
            <span className="text-sm font-medium">Preset Dimensions</span>
          </div>
        </div>
        
        {/* Unit tabs */}
        <div className="inline-flex border border-gray-200 rounded-md mb-3 overflow-hidden">
          <button 
            className={`px-2 py-1 text-xs ${selectedPresetUnit === 'px' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}
            onClick={() => setSelectedPresetUnit('px')}
            disabled={disabled}
          >
            Pixels
          </button>
          <button 
            className={`px-2 py-1 text-xs ${selectedPresetUnit === 'in' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}
            onClick={() => setSelectedPresetUnit('in')}
            disabled={disabled}
          >
            Inches
          </button>
          <button 
            className={`px-2 py-1 text-xs ${selectedPresetUnit === 'mm' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}
            onClick={() => setSelectedPresetUnit('mm')}
            disabled={disabled}
          >
            Millimeters
          </button>
        </div>
        
        {/* Presets based on selected unit */}
        <div className="flex flex-wrap gap-2">
          {selectedPresetUnit === 'px' && pixelPresets.map(preset => (
            <button
              key={preset.label}
              onClick={() => applyPresetDimensions(preset.width, preset.height)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              disabled={disabled}
            >
              {preset.label}
            </button>
          ))}
          
          {selectedPresetUnit === 'in' && inchPresets.map(preset => (
            <button
              key={preset.label}
              onClick={() => applyInchPresetDimensions(preset.width, preset.height)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              disabled={disabled}
            >
              {preset.label}
            </button>
          ))}
          
          {selectedPresetUnit === 'mm' && mmPresets.map(preset => (
            <button
              key={preset.label}
              onClick={() => applyMmPresetDimensions(preset.width, preset.height)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              disabled={disabled}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="flex flex-col">
          {/* Width Title */}
          <div className="flex items-center">
            <div className="w-full">
              <span className="text-sm font-medium">Width (px)</span>
            </div>
          </div>
          <div className="flex flex-col mt-1">
            <div className="flex items-center">
              <input
                ref={widthInputRef}
                id={selectionCount > 1 ? "multiWidth" : "width"}
                type="number"
                min="1"
                value={width || ''}
                onChange={handleWidthChange}
                onBlur={handleDimensionBlur}
                onKeyDown={handleDimensionKeyDown}
                className="input w-20"
                disabled={disabled}
              />
            </div>
            {width > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                <span>{convertPixelsToPhysicalUnits(width).inches}" / {convertPixelsToPhysicalUnits(width).mm}mm</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col">
          {/* Height Title */}
          <div className="flex items-center">
            <div className="w-full">
              <span className="text-sm font-medium">Height (px)</span>
            </div>
          </div>
          <div className="flex flex-col mt-1">
            <div className="flex items-center">
              <input
                ref={heightInputRef}
                id={selectionCount > 1 ? "multiHeight" : "height"}
                type="number"
                min="1"
                value={height || ''}
                onChange={handleHeightChange}
                onBlur={handleDimensionBlur}
                onKeyDown={handleDimensionKeyDown}
                className="input w-20"
                disabled={disabled}
              />
            </div>
            {height > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                <span>{convertPixelsToPhysicalUnits(height).inches}" / {convertPixelsToPhysicalUnits(height).mm}mm</span>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={toggleAspectRatio}
          className={`mt-6 p-2 rounded-md flex items-center gap-2 ${
            lockAspectRatio 
              ? 'bg-primary/10 text-primary' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
          disabled={disabled}
        >
          {lockAspectRatio ? <FiLock size={18} /> : <FiUnlock size={18} />}
          <span className="text-xs">Lock aspect ratio</span>
        </button>
      </div>
      
      <div>
        <button
          onClick={handleReset}
          className="btn-secondary text-sm min-w-[80px] flex items-center justify-center"
          disabled={disabled || !originalDimensions}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
