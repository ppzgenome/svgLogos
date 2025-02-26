import { useState } from 'react'
import { GradientDefinition } from '../services/svgService'

interface ColorPickerProps {
  initialColor?: string
  onChange: (color: string) => void
  onGradientChange?: (gradient: GradientDefinition) => void
  disabled?: boolean
}

export const ColorPicker = ({ 
  initialColor = '#000000', 
  onChange,
  onGradientChange,
  disabled = false
}: ColorPickerProps) => {
  const [color, setColor] = useState(initialColor)
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null)
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setColor(newColor)
    setSelectedGradient(null)
    onChange(newColor)
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
    { id: 'sunset', startColor: '#FF8C00', endColor: '#FF5E62', direction: 'to right', name: 'Sunset' },
    { id: 'ocean', startColor: '#56CCF2', endColor: '#2F80ED', direction: 'to right', name: 'Ocean' },
    { id: 'forest', startColor: '#7FFF00', endColor: '#006400', direction: 'to right', name: 'Forest' },
    { id: 'berry', startColor: '#FF6B6B', endColor: '#6B66FF', direction: 'to right', name: 'Berry' },
    { id: 'fire', startColor: '#FFDD00', endColor: '#FF0000', direction: 'to right', name: 'Fire' },
    { id: 'sky', startColor: '#87CEEB', endColor: '#FFFFFF', direction: 'to right', name: 'Sky' },
    { id: 'mint', startColor: '#00B4DB', endColor: '#00F260', direction: 'to right', name: 'Mint' },
    { id: 'candy', startColor: '#FF9A9E', endColor: '#ABECD6', direction: 'to right', name: 'Candy' },
    { id: 'royal', startColor: '#7303C0', endColor: '#03A9F4', direction: 'to right', name: 'Royal' },
    { id: 'sunrise', startColor: '#FFEF78', endColor: '#FF8B8B', direction: 'to right', name: 'Sunrise' },
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
        background: `linear-gradient(${gradient.direction}, ${gradient.startColor}, ${gradient.endColor})` 
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
        
        {/* Gradient colors row */}
        {onGradientChange && (
          <div className="flex items-center">
            <div className="w-20 flex justify-end">
              <span className="text-xs text-gray-500 mr-3">Gradients</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {gradients.map((gradient) => (
                <GradientButton key={gradient.id} gradient={gradient} />
              ))}
            </div>
          </div>
        )}
        
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
              type="text"
              value={color}
              onChange={handleColorChange}
              className="input w-24"
              maxLength={7}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
