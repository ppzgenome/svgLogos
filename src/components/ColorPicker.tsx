import { useState, useRef, useEffect } from 'react'
import { GradientDefinition } from '../types/gradients'

interface ColorPickerProps {
  initialColor?: string
  onChange: (color: string) => void
  onGradientChange?: (gradient: GradientDefinition) => void
  disabled?: boolean
  canEditGradient?: boolean // Renamed to _canEditGradient in the component parameters
}

export const ColorPicker = ({ 
  initialColor = '#000000', 
  onChange,
  onGradientChange,
  disabled = false,
  canEditGradient: _canEditGradient = true // Renamed locally to mark as intentionally unused
}: ColorPickerProps) => {
  const [color, setColor] = useState(initialColor)
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null)
  const [customGradientStartColor, setCustomGradientStartColor] = useState('#FF0000')
  const [customGradientEndColor, setCustomGradientEndColor] = useState('#0000FF')
  const [customGradientDirection, setCustomGradientDirection] = useState('to right')
  
  // New state for gradient stops
  const [startStopPosition, setStartStopPosition] = useState(0) // percentage (0-100)
  const [endStopPosition, setEndStopPosition] = useState(100) // percentage (0-100)
  const [activeStop, setActiveStop] = useState<'start' | 'end' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // State for custom color picker popup
  const [openColorPicker, setOpenColorPicker] = useState<'start' | 'end' | null>(null)
  const [tempColor, setTempColor] = useState('')
  
  // References
  const gradientBarRef = useRef<HTMLDivElement>(null)
  const startStopRef = useRef<HTMLDivElement>(null)
  const endStopRef = useRef<HTMLDivElement>(null)
  
  // Refs for input fields to maintain focus
  const startColorInputRef = useRef<HTMLInputElement>(null)
  const endColorInputRef = useRef<HTMLInputElement>(null)
  const customColorInputRef = useRef<HTMLInputElement>(null)
  
  // State to track if we should apply changes
  const [shouldApplyChanges, setShouldApplyChanges] = useState(false)
  
  // Effect to apply changes when shouldApplyChanges is true
  useEffect(() => {
    if (shouldApplyChanges) {
      // Create a gradient with the current colors and positions
      const customGradient: GradientDefinition = {
        id: `custom-gradient`, // Use a stable ID instead of Date.now()
        startColor: customGradientStartColor,
        endColor: customGradientEndColor,
        direction: customGradientDirection,
        name: 'Custom Gradient',
        startPosition: startStopPosition,
        endPosition: endStopPosition
      }
      setSelectedGradient(customGradient.id)
      onGradientChange && onGradientChange(customGradient)
      setShouldApplyChanges(false);
    }
  }, [shouldApplyChanges, customGradientStartColor, customGradientEndColor, 
      customGradientDirection, startStopPosition, endStopPosition, onGradientChange]);
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setColor(newColor)
    setSelectedGradient(null)
    
    // Check if this is the color picker input (type="color") or the text input
    // The color picker input has a className that contains "opacity-0"
    const isColorPickerInput = e.target.className.includes('opacity-0')
    
    // Call onChange immediately for color picker input, but not for text input
    // This prevents focus loss on text input while allowing color picker to work
    if (isColorPickerInput) {
      onChange(newColor)
    }
    // For text input, we'll call onChange on blur or Enter key (handled in separate functions)
  }
  
  const handleColorInputBlur = () => {
    // Only call onChange when the input loses focus
    onChange(color)
  }
  
  const handleColorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Call onChange when Enter key is pressed
    if (e.key === 'Enter') {
      onChange(color)
      e.currentTarget.blur()
    }
  }
  
  // Effect to handle clicks outside the color picker popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openColorPicker) {
        // Check if the click is outside both the color picker and the stop
        const isOutsideStart = startStopRef.current && !startStopRef.current.contains(e.target as Node)
        const isOutsideEnd = endStopRef.current && !endStopRef.current.contains(e.target as Node)
        
        if (isOutsideStart && isOutsideEnd) {
          // Apply the current color and close the picker
          if (openColorPicker === 'start') {
            setCustomGradientStartColor(tempColor)
          } else {
            setCustomGradientEndColor(tempColor)
          }
          applyCustomGradient()
          setOpenColorPicker(null)
        }
      }
    }
    
    if (openColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openColorPicker, tempColor])
  
  // Effect to add and remove window event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && activeStop && gradientBarRef.current) {
        const rect = gradientBarRef.current.getBoundingClientRect()
        const barWidth = rect.width
        const offsetX = e.clientX - rect.left
        
        // Calculate position as percentage (constrained between 0-100)
        let position = Math.max(0, Math.min(100, (offsetX / barWidth) * 100))
        
        // Prevent stops from crossing each other
        if (activeStop === 'start') {
          position = Math.min(position, endStopPosition - 5) // Keep at least 5% apart
          setStartStopPosition(position)
        } else {
          position = Math.max(position, startStopPosition + 5) // Keep at least 5% apart
          setEndStopPosition(position)
        }
        
        // Apply gradient with updated positions
        applyCustomGradient()
      }
    }
    
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setActiveStop(null)
      }
    }
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, activeStop, startStopPosition, endStopPosition])
  
  // Debounce timer for gradient changes
  const gradientChangeTimerRef = useRef<number | null>(null);
  
  const applyCustomGradient = () => {
    if (onGradientChange) {
      // Clear any existing timer
      if (gradientChangeTimerRef.current) {
        window.clearTimeout(gradientChangeTimerRef.current);
        gradientChangeTimerRef.current = null;
      }
      
      // Set a new timer to debounce the gradient change
      gradientChangeTimerRef.current = window.setTimeout(() => {
        setShouldApplyChanges(true);
        gradientChangeTimerRef.current = null;
      }, 50); // 50ms debounce delay
    }
  }
  
  // Handle temporary color change in the popup
  const handleTempColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setTempColor(newColor)
    
    // Update the gradient preview in real-time
    if (openColorPicker === 'start') {
      setCustomGradientStartColor(newColor)
    } else if (openColorPicker === 'end') {
      setCustomGradientEndColor(newColor)
    }
    
    // Apply gradient immediately without delay
    applyCustomGradient()
  }
  
  // Apply color and close picker when Enter is pressed
  const handleTempColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (openColorPicker === 'start') {
        setCustomGradientStartColor(tempColor)
      } else if (openColorPicker === 'end') {
        setCustomGradientEndColor(tempColor)
      }
      applyCustomGradient()
      setOpenColorPicker(null)
    }
  }
  
  // Handlers for the text input fields at the bottom
  const handleStartColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomGradientStartColor(newColor)
    // Don't apply gradient on every keystroke to maintain focus
  }
  
  const handleStartColorBlur = () => {
    // Apply gradient when the input loses focus
    applyCustomGradient()
  }
  
  const handleStartColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Apply gradient when Enter key is pressed
    if (e.key === 'Enter') {
      applyCustomGradient()
      e.currentTarget.blur()
    }
  }
  
  const handleEndColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomGradientEndColor(newColor)
    // Don't apply gradient on every keystroke to maintain focus
  }
  
  const handleEndColorBlur = () => {
    // Apply gradient when the input loses focus
    applyCustomGradient()
  }
  
  const handleEndColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Apply gradient when Enter key is pressed
    if (e.key === 'Enter') {
      applyCustomGradient()
      e.currentTarget.blur()
    }
  }
  
  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomGradientDirection(e.target.value)
    // Apply gradient immediately when direction changes
    applyCustomGradient()
  }
  
  const handleStopMouseDown = (stop: 'start' | 'end') => (e: React.MouseEvent) => {
    if (disabled) return
    
    e.preventDefault()
    setActiveStop(stop)
    setIsDragging(true)
  }
  
  const handleGradientBarClick = (_e: React.MouseEvent) => {
    if (disabled) return
    
    // When clicking the gradient bar, apply the gradient
    applyCustomGradient()
  }
  
  const presetColors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
  ]
  
  const pastelColors = [
    '#3d5a80', // Navy Blue
    '#98c1d9', // Sky Blue
    '#e0fbfc', // Light Cyan
    '#ee6c4d', // Burnt Sienna
    '#293241', // Dark Blue
    '#ff595e', // Red
    '#ffca3a', // Yellow
    '#8ac926', // Green
    '#1982c4', // Blue
    '#6a4c93'  // Purple
  ]
  
  const gradients: GradientDefinition[] = [
    { id: 'sunset', startColor: '#FF8C00', endColor: '#FF5E62', direction: 'to right', name: 'Sunset', startPosition: 0, endPosition: 100 },
    { id: 'ocean', startColor: '#56CCF2', endColor: '#2F80ED', direction: 'to right', name: 'Ocean', startPosition: 0, endPosition: 100 },
    { id: 'forest', startColor: '#7FFF00', endColor: '#006400', direction: 'to right', name: 'Forest', startPosition: 0, endPosition: 100 },
    { id: 'berry', startColor: '#FF6B6B', endColor: '#6B66FF', direction: 'to right', name: 'Berry', startPosition: 0, endPosition: 100 },
    { id: 'fire', startColor: '#FFDD00', endColor: '#FF0000', direction: 'to right', name: 'Fire', startPosition: 0, endPosition: 100 },
    { id: 'sky', startColor: '#87CEEB', endColor: '#FFFFFF', direction: 'to right', name: 'Sky', startPosition: 0, endPosition: 100 },
    { id: 'mint', startColor: '#00B4DB', endColor: '#00F260', direction: 'to right', name: 'Mint', startPosition: 0, endPosition: 100 },
    { id: 'candy', startColor: '#FF9A9E', endColor: '#ABECD6', direction: 'to right', name: 'Candy', startPosition: 0, endPosition: 100 },
    { id: 'royal', startColor: '#7303C0', endColor: '#03A9F4', direction: 'to right', name: 'Royal', startPosition: 0, endPosition: 100 },
    { id: 'sunrise', startColor: '#FFEF78', endColor: '#FF8B8B', direction: 'to right', name: 'Sunrise', startPosition: 0, endPosition: 100 },
  ]
  
  const ColorButton = ({ colorValue }: { colorValue: string }) => (
    <button
      key={colorValue}
      onClick={() => {
        setColor(colorValue)
        setSelectedGradient(null)
        onChange(colorValue)
      }}
      className={`w-6 h-6 rounded-full border border-gray-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-offset-1 hover:ring-primary'
      } ${color === colorValue && !selectedGradient ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
      style={{ backgroundColor: colorValue }}
      aria-label={`Select color ${colorValue}`}
      disabled={disabled}
    />
  )
  
  const GradientButton = ({ gradient }: { gradient: GradientDefinition }) => (
    <button
      key={gradient.id}
      onClick={() => {
        if (onGradientChange) {
          setSelectedGradient(gradient.id)
          onGradientChange(gradient)
        }
      }}
      className={`w-6 h-6 rounded-full border border-gray-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-offset-1 hover:ring-primary'
      } ${selectedGradient === gradient.id ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
      style={{ 
        background: `linear-gradient(${gradient.direction}, ${gradient.startColor} ${gradient.startPosition || 0}%, ${gradient.endColor} ${gradient.endPosition || 100}%)` 
      }}
      aria-label={`Select gradient ${gradient.name}`}
      title={gradient.name}
      disabled={disabled || !onGradientChange}
    />
  )
  
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {/* Standard colors row */}
        <div className="flex items-center">
          <div className="w-20 flex justify-end">
            <span className="text-xs text-gray-500 mr-3">Classic</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((colorValue) => (
              <ColorButton key={colorValue} colorValue={colorValue} />
            ))}
          </div>
        </div>
        
        {/* Pastel colors row */}
        <div className="flex items-center">
          <div className="w-20 flex justify-end">
            <span className="text-xs text-gray-500 mr-3">Modern</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pastelColors.map((colorValue) => (
              <ColorButton key={colorValue} colorValue={colorValue} />
            ))}
          </div>
        </div>
        
        {/* Custom color picker - moved below preset colors */}
        <div className="flex items-center mt-4">
          <div className="w-20 flex justify-end">
            <span className="text-xs text-gray-500 mr-3">Custom</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="relative w-6 h-6 rounded-full border border-gray-300 overflow-hidden"
              style={{ background: color }}
            >
              <input
                type="color"
                value={color}
                onChange={handleColorChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={disabled}
              />
            </div>
            <input
              ref={customColorInputRef}
              type="text"
              value={color}
              onChange={handleColorChange}
              onBlur={handleColorInputBlur}
              onKeyDown={handleColorInputKeyDown}
              className="input w-24"
              maxLength={7}
              disabled={disabled}
            />
          </div>
        </div>
        
        {/* Gradients Title */}
        <div className="flex items-center mt-4">
          <div className="w-full">
            <span className="text-sm font-medium">Gradients</span>
          </div>
        </div>
        
        {/* Gradient colors row */}
        {onGradientChange && (
          <div className="flex items-center">
            <div className="w-20 flex justify-end">
              <span className="text-xs text-gray-500 mr-3">Presets</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {gradients.map((gradient) => (
                <GradientButton key={gradient.id} gradient={gradient} />
              ))}
            </div>
          </div>
        )}
        
        {/* Custom Gradient Section */}
        {onGradientChange && (
          <div className="flex items-start">
            <div className="w-20 flex justify-end pt-1">
              <span className="text-xs text-gray-500 mr-3">Custom</span>
            </div>
            <div className="flex flex-col gap-2" style={{ width: 'calc(100% - 5rem)' }}>
              {/* Gradient Bar with Draggable Color Stops */}
              <div 
                ref={gradientBarRef}
                className={`relative h-6 rounded border border-gray-300 ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${selectedGradient?.startsWith('custom-') ? 'ring-2 ring-primary' : ''}`}
                style={{ 
                  background: `linear-gradient(${customGradientDirection}, ${customGradientStartColor} ${startStopPosition}%, ${customGradientEndColor} ${endStopPosition}%)` 
                }}
                onClick={disabled ? undefined : handleGradientBarClick}
              >
                {/* Start Color Stop */}
                <div 
                  ref={startStopRef}
                  className={`absolute top-0 bottom-0 cursor-grab ${isDragging && activeStop === 'start' ? 'cursor-grabbing' : ''}`}
                  style={{ left: `${startStopPosition}%` }}
                  onMouseDown={handleStopMouseDown('start')}
                  title="Drag to adjust position"
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                    <div 
                      className={`w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-200 
                        ${activeStop === 'start' ? 'ring-2 ring-primary ring-opacity-70' : ''}
                        hover:scale-110 hover:shadow-lg`}
                      style={{ background: customGradientStartColor }}
                      title="Click to change color"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Custom Color Picker Popup for Start Stop */}
                    {openColorPicker === 'start' && (
                      <div className="absolute left-0 top-10 z-20 bg-white rounded-md shadow-lg p-3 border border-gray-200 w-48">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="relative w-6 h-6 rounded-full border border-gray-300 overflow-hidden"
                            style={{ background: tempColor }}
                          >
                            <input
                              type="color"
                              value={tempColor}
                              onChange={handleTempColorChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={disabled}
                            />
                          </div>
                          <input
                            type="text"
                            value={tempColor}
                            onChange={handleTempColorChange}
                            onKeyDown={handleTempColorKeyDown}
                            className="input w-full text-xs"
                            maxLength={7}
                            disabled={disabled}
                            autoFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* End Color Stop */}
                <div 
                  ref={endStopRef}
                  className={`absolute top-0 bottom-0 cursor-grab ${isDragging && activeStop === 'end' ? 'cursor-grabbing' : ''}`}
                  style={{ left: `${endStopPosition}%` }}
                  onMouseDown={handleStopMouseDown('end')}
                  title="Drag to adjust position"
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                    <div 
                      className={`w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-200 
                        ${activeStop === 'end' ? 'ring-2 ring-primary ring-opacity-70' : ''}
                        hover:scale-110 hover:shadow-lg`}
                      style={{ background: customGradientEndColor }}
                      title="Click to change color"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Custom Color Picker Popup for End Stop */}
                    {openColorPicker === 'end' && (
                      <div className="absolute right-0 top-10 z-20 bg-white rounded-md shadow-lg p-3 border border-gray-200 w-48">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="relative w-6 h-6 rounded-full border border-gray-300 overflow-hidden"
                            style={{ background: tempColor }}
                          >
                            <input
                              type="color"
                              value={tempColor}
                              onChange={handleTempColorChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={disabled}
                            />
                          </div>
                          <input
                            type="text"
                            value={tempColor}
                            onChange={handleTempColorChange}
                            onKeyDown={handleTempColorKeyDown}
                            className="input w-full text-xs"
                            maxLength={7}
                            disabled={disabled}
                            autoFocus
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Color Input Fields with Color Pickers */}
              <div className="flex justify-between mt-1">
                <div className="flex items-center gap-1">
                  <div 
                    className="relative w-5 h-5 rounded-full border border-gray-300 overflow-hidden"
                    style={{ background: customGradientStartColor }}
                  >
                    <input
                      type="color"
                      value={customGradientStartColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setCustomGradientStartColor(newColor);
                        // Apply gradient immediately without delay
                        applyCustomGradient();
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={disabled}
                    />
                  </div>
                  <input
                    ref={startColorInputRef}
                    type="text"
                    value={customGradientStartColor}
                    onChange={handleStartColorChange}
                    onBlur={handleStartColorBlur}
                    onKeyDown={handleStartColorKeyDown}
                    className="input w-20 text-xs"
                    maxLength={7}
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <div 
                    className="relative w-5 h-5 rounded-full border border-gray-300 overflow-hidden"
                    style={{ background: customGradientEndColor }}
                  >
                    <input
                      type="color"
                      value={customGradientEndColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setCustomGradientEndColor(newColor);
                        // Apply gradient immediately without delay
                        applyCustomGradient();
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={disabled}
                    />
                  </div>
                  <input
                    ref={endColorInputRef}
                    type="text"
                    value={customGradientEndColor}
                    onChange={handleEndColorChange}
                    onBlur={handleEndColorBlur}
                    onKeyDown={handleEndColorKeyDown}
                    className="input w-20 text-xs"
                    maxLength={7}
                    disabled={disabled}
                  />
                </div>
              </div>
              
              {/* Direction Selector */}
              <div className="flex items-center gap-2 mt-2 mb-2">
                <span className="text-xs text-gray-500 mr-2">Direction:</span>
                <select 
                  value={customGradientDirection} 
                  onChange={handleDirectionChange}
                  className="input text-sm py-1"
                  disabled={disabled}
                >
                  <option value="to right">Horizontal →</option>
                  <option value="to bottom">Vertical ↓</option>
                  <option value="to bottom right">Diagonal ↘</option>
                  <option value="to top right">Diagonal ↗</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
