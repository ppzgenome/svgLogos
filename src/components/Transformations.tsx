import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

type Unit = 'px' | '%' | 'in' | 'mm'

interface Dimension {
  value: number
}

export const Transformations = () => {
  const [width, setWidth] = useState<Dimension>({ value: 100 })
  const [height, setHeight] = useState<Dimension>({ value: 100 })
  const [unit, setUnit] = useState<Unit>('px')
  const [lockAspectRatio, setLockAspectRatio] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1)

  useEffect(() => {
    if (lockAspectRatio) {
      setAspectRatio(width.value / height.value)
    }
  }, [lockAspectRatio])

  const handleWidthChange = (newValue: number) => {
    setWidth({ value: newValue })
    if (lockAspectRatio) {
      setHeight({ value: newValue / aspectRatio })
    }
  }

  const handleHeightChange = (newValue: number) => {
    setHeight({ value: newValue })
    if (lockAspectRatio) {
      setWidth({ value: newValue * aspectRatio })
    }
  }

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit)
  }

  const units: Unit[] = ['px', '%', 'in', 'mm']

  return (
    <section className="section-bg pt-8 pb-20">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card w-80"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Format & Style 🎨</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dimensions</h3>
                <div className="space-y-4">
                  {/* Width Control */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={width.value}
                        onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
                        className="input w-32"
                      />
                      <select
                        value={unit}
                        onChange={(e) => handleUnitChange(e.target.value as Unit)}
                        className="input w-24"
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Height Control */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={height.value}
                        onChange={(e) => handleHeightChange(parseFloat(e.target.value))}
                        className="input w-32"
                      />
                      <select
                        value={unit}
                        onChange={(e) => handleUnitChange(e.target.value as Unit)}
                        className="input w-24"
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aspect Ratio Lock */}
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="aspectRatio"
                  checked={lockAspectRatio}
                  onChange={(e) => setLockAspectRatio(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="aspectRatio" className="ml-2 block text-sm text-gray-700">
                  Lock aspect ratio
                </label>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
