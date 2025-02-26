import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiEye, FiLoader, FiUpload, FiTrash2, FiCheck, FiDownload, FiRefreshCw, FiLock, FiUnlock } from 'react-icons/fi'
import { searchMultipleLogos, searchLogoAlternative } from '../services/logoService'
import { processUploadedFiles, getSvgDimensions, downloadLogosAsZip } from '../services/fileService'
import { changeSvgColor, changeSvgGradient, resetSvgColor, changeSvgDimensions, resetSvgDimensions, GradientDefinition } from '../services/svgService'
import { convertPixelsToPhysicalUnits } from '../utils/unitConversion'
import { ColorPicker } from './ColorPicker'
import { DimensionEditor } from './DimensionEditor'

// Type for dimension display units
type DimensionUnit = 'px' | 'in' | 'mm';

interface Logo {
  id: string
  url: string
  originalUrl?: string // Store the original URL before color changes
  source: string
  sourceProvider?: string
  searchTerm?: string
  dimensions?: {
    width: number
    height: number
  }
  originalDimensions?: {
    width: number
    height: number
  }
  needsDimensions?: boolean
  isRefreshing?: boolean
  color?: string // Store the applied color
  gradient?: GradientDefinition // Store the applied gradient
  isChangingDimensions?: boolean
}

const MAX_LOGOS = 15

export const WorkArea = () => {
  const [logos, setLogos] = useState<Logo[]>([])
  const [selectedLogos, setSelectedLogos] = useState<Set<number>>(new Set())
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [isApplyingColor, setIsApplyingColor] = useState(false)
  const [colorOperationType, setColorOperationType] = useState<'apply' | 'gradient' | 'reset' | null>(null)
  const [isChangingDimensions, setIsChangingDimensions] = useState(false)
  const [displayUnit, setDisplayUnit] = useState<DimensionUnit>('px')
  const [batchPresetUnit, setBatchPresetUnit] = useState<DimensionUnit>('px')
  const [multiWidth, setMultiWidth] = useState(0)
  const [multiHeight, setMultiHeight] = useState(0)
  const [multiLockAspectRatio, setMultiLockAspectRatio] = useState(true)
  const [multiAspectRatio, setMultiAspectRatio] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const errorTimerRef = useRef<number | null>(null)
  
  // Calculate average dimensions and aspect ratio for selected logos
  useEffect(() => {
    if (selectedLogos.size > 1) {
      // Get all selected logos
      const selected = Array.from(selectedLogos).map(index => logos[index]).filter(logo => logo && logo.dimensions);
      
      if (selected.length > 0) {
        // Calculate average dimensions
        const totalWidth = selected.reduce((sum, logo) => sum + (logo.dimensions?.width || 0), 0);
        const totalHeight = selected.reduce((sum, logo) => sum + (logo.dimensions?.height || 0), 0);
        
        const avgWidth = Math.round(totalWidth / selected.length);
        const avgHeight = Math.round(totalHeight / selected.length);
        
        setMultiWidth(avgWidth);
        setMultiHeight(avgHeight);
        
        // Calculate average aspect ratio
        if (avgHeight > 0) {
          setMultiAspectRatio(avgWidth / avgHeight);
        }
      }
    }
  }, [selectedLogos, logos]);
  
  // Handle width change for multiple logos
  const handleMultiWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10) || 0;
    setMultiWidth(newWidth);
    
    if (multiLockAspectRatio && newWidth > 0) {
      const newHeight = Math.round(newWidth / multiAspectRatio);
      setMultiHeight(newHeight);
      // Don't apply dimensions immediately to prevent focus loss
    } else {
      // Don't apply dimensions immediately to prevent focus loss
    }
  };
  
  // Handle height change for multiple logos
  const handleMultiHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10) || 0;
    setMultiHeight(newHeight);
    
    if (multiLockAspectRatio && newHeight > 0) {
      const newWidth = Math.round(newHeight * multiAspectRatio);
      setMultiWidth(newWidth);
      // Don't apply dimensions immediately to prevent focus loss
    } else {
      // Don't apply dimensions immediately to prevent focus loss
    }
  };
  
  // Handle dimension input blur for multiple logos
  const handleMultiDimensionBlur = () => {
    // Apply dimensions when input loses focus
    applyDimensionsToSelectedLogos({ width: multiWidth, height: multiHeight });
  };
  
  // Handle dimension input key down for multiple logos
  const handleMultiDimensionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Apply dimensions when Enter key is pressed
    if (e.key === 'Enter') {
      applyDimensionsToSelectedLogos({ width: multiWidth, height: multiHeight });
    }
  };
  
  // Toggle aspect ratio lock for multiple logos
  const toggleMultiAspectRatio = () => {
    setMultiLockAspectRatio(!multiLockAspectRatio);
  };

  // Auto-dismiss error message after 2 seconds for certain errors
  useEffect(() => {
    // Clear any existing timer
    if (errorTimerRef.current) {
      window.clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
    
    // Set a new timer if the error is "No alternative logo found"
    if (error === 'No alternative logo found') {
      errorTimerRef.current = window.setTimeout(() => {
        setError(null)
        errorTimerRef.current = null
      }, 2000)
    }
    
    // Clean up on unmount
    return () => {
      if (errorTimerRef.current) {
        window.clearTimeout(errorTimerRef.current)
      }
    }
  }, [error])

  const fetchDimensions = useCallback(async (logo: Logo) => {
    if (!logo.needsDimensions) return logo
    
    try {
      const dimensions = await getSvgDimensions(logo.url)
      // Store both current and original dimensions
      return { 
        ...logo, 
        dimensions, 
        originalDimensions: logo.originalDimensions || dimensions, 
        needsDimensions: false 
      }
    } catch {
      return { ...logo, needsDimensions: false }
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const updateDimensions = async () => {
      const logosNeedingDimensions = logos.filter(logo => logo.needsDimensions)
      if (logosNeedingDimensions.length === 0) return

      const updatedLogos = await Promise.all(
        logos.map(async (logo) => {
          if (!logo.needsDimensions) return logo
          return fetchDimensions(logo)
        })
      )

      if (isMounted) {
        setLogos(updatedLogos)
      }
    }

    updateDimensions()

    return () => {
      isMounted = false
    }
  }, [logos, fetchDimensions])

  const handleSearch = async () => {
    const terms = searchInput.split(',').map(term => term.trim()).filter(Boolean)
    if (terms.length === 0) return
    
    if (logos.length + terms.length > MAX_LOGOS) {
      setError(`Maximum of ${MAX_LOGOS} logos allowed`)
      return
    }

    setIsLoading(true)
    setError(null)
    setWarning(null)
    
    try {
      const result = await searchMultipleLogos(terms)
      
      // Add successful logos to the grid
      setLogos(prevLogos => [
        ...prevLogos,
        ...result.successes.map((logo, index) => ({ 
          ...logo, 
          needsDimensions: true,
          searchTerm: terms[index] 
        }))
      ])
      
      // Show warning for failed searches
      if (result.failures.length > 0) {
        setWarning(`Could not find logos for: ${result.failures.join(', ')}`)
      }
      
      setSearchInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0) return

    setIsLoading(true)
    setError(null)
    setWarning(null)

    try {
      const { processedFiles, errors } = await processUploadedFiles(files, MAX_LOGOS, logos.length)
      
      if (errors.length > 0) {
        setError(errors.join('. '))
      }

      if (processedFiles.length > 0) {
        const newLogos: Logo[] = processedFiles.map(file => ({
          id: `upload-${Math.random().toString(36).substr(2, 9)}`,
          url: file.url,
          source: 'upload',
          sourceProvider: 'User Upload',
          // If dimensions were extracted during upload, use them directly
          dimensions: file.dimensions,
          // If dimensions were found, we don't need to fetch them again
          needsDimensions: !file.dimensions,
          // If dimensions were found, store them as original dimensions too
          originalDimensions: file.dimensions
        }))
        setLogos(prevLogos => [...prevLogos, ...newLogos])
      }
    } catch (err) {
      setError('Failed to process uploaded files')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      processFiles(files)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set dragging to false if we're leaving the drop zone
    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (rect) {
      const { clientX, clientY } = e
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDragging(false)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files) {
      processFiles(files)
    }
  }

  const handleDelete = (id: string, index: number) => {
    setLogos(logos.filter(logo => logo.id !== id))
    setSelectedLogos(prev => {
      const next = new Set(prev)
      next.delete(index)
      
      // Update indices for logos after the deleted one
      const updated = new Set<number>()
      prev.forEach(idx => {
        if (idx < index) {
          updated.add(idx)
        } else if (idx > index) {
          updated.add(idx - 1)
        }
      })
      return updated
    })
    setError(null)
  }

  const handleView = (url: string) => {
    window.open(url, '_blank')
  }

  const handleClearAll = () => {
    if (logos.length === 0) return
    setLogos([])
    setSelectedLogos(new Set())
    setError(null)
    setWarning(null)
  }

  const toggleLogoSelection = (index: number) => {
    setSelectedLogos(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    // Create a set with indices of all logos
    const allIndices = new Set<number>()
    for (let i = 0; i < logos.length; i++) {
      allIndices.add(i)
    }
    setSelectedLogos(allIndices)
  }

  const handleDeselectAll = () => {
    setSelectedLogos(new Set())
  }

  const handleDownload = async () => {
    if (logos.length === 0) return
    
    setIsDownloading(true)
    try {
      // Pass the complete logo objects to ensure dimensions are preserved
      await downloadLogosAsZip(logos)
    } catch (err) {
      setError('Failed to download logos')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRefresh = async (logo: Logo, index: number) => {
    if (!logo.searchTerm) {
      setError('Cannot refresh uploaded logos')
      return
    }

    // Set refreshing state for this logo
    setLogos(prevLogos => 
      prevLogos.map((l, i) => 
        i === index ? { ...l, isRefreshing: true } : l
      )
    )

    try {
      const alternativeLogo = await searchLogoAlternative(logo.searchTerm, logo.url, logo.source)
      
      // Replace the logo with the alternative
      setLogos(prevLogos => 
        prevLogos.map((l, i) => 
          i === index ? { 
            ...alternativeLogo, 
            searchTerm: logo.searchTerm,
            needsDimensions: true,
            isRefreshing: false
          } : l
        )
      )
      
      // No success message - removed as requested
    } catch (err) {
      // Reset refreshing state
      setLogos(prevLogos => 
        prevLogos.map((l, i) => 
          i === index ? { ...l, isRefreshing: false } : l
        )
      )
      setError('No alternative logo found')
    }
  }

  // Debounce timer for color changes
  const colorChangeTimerRef = useRef<number | null>(null);
  
  const applyColorToSelectedLogos = async (color: string, showLoading = false) => {
    if (selectedLogos.size === 0) return
    
    // Clear any existing timer
    if (colorChangeTimerRef.current) {
      window.clearTimeout(colorChangeTimerRef.current);
      colorChangeTimerRef.current = null;
    }
    
    // Set a new timer to debounce the color change
    colorChangeTimerRef.current = window.setTimeout(async () => {
      // Only show loading state for non-incremental changes
      if (showLoading) {
        setIsApplyingColor(true);
        setColorOperationType('apply');
      }
      
      setError(null)
      
      try {
        const updatedLogos = await Promise.all(
          logos.map(async (logo, index) => {
            if (selectedLogos.has(index)) {
              // Store original URL if not already stored
              const originalUrl = logo.originalUrl || logo.url
              
              // Generate new colored SVG
              const coloredUrl = await changeSvgColor(originalUrl, color)
              
              return {
                ...logo,
                url: coloredUrl,
                originalUrl: originalUrl,
                color: color,
                gradient: undefined // Clear any gradient when applying solid color
              }
            }
            return logo
          })
        )
        
        setLogos(updatedLogos)
      } catch (err) {
        setError('Failed to apply color to logos')
      } finally {
        if (showLoading) {
          setIsApplyingColor(false);
          setColorOperationType(null);
        }
        colorChangeTimerRef.current = null;
      }
    }, 150); // 150ms debounce delay
  }
  
  const applyGradientToSelectedLogos = async (gradient: GradientDefinition, showLoading = false) => {
    if (selectedLogos.size === 0) return
    
    // Clear any existing timer
    if (colorChangeTimerRef.current) {
      window.clearTimeout(colorChangeTimerRef.current);
      colorChangeTimerRef.current = null;
    }
    
    // Set a new timer to debounce the gradient change
    colorChangeTimerRef.current = window.setTimeout(async () => {
      // Only show loading state for non-incremental changes
      if (showLoading) {
        setIsApplyingColor(true);
        setColorOperationType('gradient');
      }
      
      setError(null)
      
      try {
        const updatedLogos = await Promise.all(
          logos.map(async (logo, index) => {
            if (selectedLogos.has(index)) {
              // Store original URL if not already stored
              const originalUrl = logo.originalUrl || logo.url
              
              // Generate new gradient SVG
              const gradientUrl = await changeSvgGradient(originalUrl, gradient)
              
              return {
                ...logo,
                url: gradientUrl,
                originalUrl: originalUrl,
                color: undefined, // Clear any solid color when applying gradient
                gradient: gradient
              }
            }
            return logo
          })
        )
        
        setLogos(updatedLogos)
      } catch (err) {
        setError('Failed to apply gradient to logos')
      } finally {
        if (showLoading) {
          setIsApplyingColor(false);
          setColorOperationType(null);
        }
        colorChangeTimerRef.current = null;
      }
    }, 150); // 150ms debounce delay
  }

  const resetSelectedLogosColor = async () => {
    if (selectedLogos.size === 0) return
    
    setIsApplyingColor(true)
    setColorOperationType('reset') // Set the operation type to reset
    setError(null)
    
    try {
      const updatedLogos = await Promise.all(
        logos.map(async (logo, index) => {
          if (selectedLogos.has(index) && logo.originalUrl) {
            // Reset to original URL
            const resetUrl = await resetSvgColor(logo.originalUrl)
            
            return {
              ...logo,
              url: resetUrl,
              color: undefined
            }
          }
          return logo
        })
      )
      
      setLogos(updatedLogos)
    } catch (err) {
      setError('Failed to reset logo colors')
    } finally {
      setIsApplyingColor(false)
      setColorOperationType(null) // Reset the operation type
    }
  }

  // Debounce timer for dimension changes
  const dimensionChangeTimerRef = useRef<number | null>(null);
  
  const applyDimensionsToSelectedLogos = async (dimensions: { width: number; height: number }, showLoading = false) => {
    if (selectedLogos.size === 0) return
    
    // Clear any existing timer
    if (dimensionChangeTimerRef.current) {
      window.clearTimeout(dimensionChangeTimerRef.current);
      dimensionChangeTimerRef.current = null;
    }
    
    // Only show loading state for non-incremental changes
    if (showLoading) {
      setIsChangingDimensions(true);
    }
    
    setError(null)
    
    try {
      const updatedLogos = await Promise.all(
        logos.map(async (logo, index) => {
          if (selectedLogos.has(index)) {
            // Store original URL if not already stored
            const originalUrl = logo.originalUrl || logo.url
            
            // Store original dimensions if not already stored
            const originalDimensions = logo.originalDimensions || logo.dimensions
            
            // Generate new resized SVG
            let resizedUrl = await changeSvgDimensions(originalUrl, dimensions.width, dimensions.height)
            
            // Reapply color or gradient if they exist
            if (logo.color) {
              resizedUrl = await changeSvgColor(resizedUrl, logo.color)
            } else if (logo.gradient) {
              resizedUrl = await changeSvgGradient(resizedUrl, logo.gradient)
            }
            
            return {
              ...logo,
              url: resizedUrl,
              originalUrl: originalUrl,
              dimensions: dimensions,
              originalDimensions: originalDimensions,
              // Preserve color and gradient properties
              color: logo.color,
              gradient: logo.gradient
            }
          }
          return logo
        })
      )
      
      setLogos(updatedLogos)
    } catch (err) {
      setError('Failed to apply dimensions to logos')
    } finally {
      if (showLoading) {
        setIsChangingDimensions(false);
      }
    }
  }
  
  const scaleSelectedLogos = async (scalePercentage: number) => {
    if (selectedLogos.size === 0) return
    
    setIsChangingDimensions(true)
    setError(null)
    
    try {
      const updatedLogos = await Promise.all(
        logos.map(async (logo, index) => {
          if (selectedLogos.has(index) && logo.originalDimensions) {
            // Store original URL if not already stored
            const originalUrl = logo.originalUrl || logo.url
            
            // Calculate new dimensions based on scale percentage
            const newWidth = Math.round(logo.originalDimensions.width * (scalePercentage / 100))
            const newHeight = Math.round(logo.originalDimensions.height * (scalePercentage / 100))
            
            // Generate new scaled SVG
            let scaledUrl = await changeSvgDimensions(originalUrl, newWidth, newHeight)
            
            // Reapply color or gradient if they exist
            if (logo.color) {
              scaledUrl = await changeSvgColor(scaledUrl, logo.color)
            } else if (logo.gradient) {
              scaledUrl = await changeSvgGradient(scaledUrl, logo.gradient)
            }
            
            return {
              ...logo,
              url: scaledUrl,
              originalUrl: originalUrl,
              dimensions: { width: newWidth, height: newHeight },
              // Preserve color and gradient properties
              color: logo.color,
              gradient: logo.gradient
            }
          }
          return logo
        })
      )
      
      setLogos(updatedLogos)
    } catch (err) {
      setError('Failed to scale logos')
    } finally {
      setIsChangingDimensions(false)
    }
  }
  
  const resetSelectedLogosDimensions = async () => {
    if (selectedLogos.size === 0) return
    
    setIsChangingDimensions(true)
    setError(null)
    
    try {
      const updatedLogos = await Promise.all(
        logos.map(async (logo, index) => {
          if (selectedLogos.has(index) && logo.originalUrl && logo.originalDimensions) {
            // Reset to original URL and dimensions
            let resetUrl = await resetSvgDimensions(logo.originalUrl)
            
            // Reapply color or gradient if they exist
            if (logo.color) {
              resetUrl = await changeSvgColor(resetUrl, logo.color)
            } else if (logo.gradient) {
              resetUrl = await changeSvgGradient(resetUrl, logo.gradient)
            }
            
            return {
              ...logo,
              url: resetUrl,
              dimensions: { ...logo.originalDimensions },
              // Preserve color and gradient properties
              color: logo.color,
              gradient: logo.gradient
            }
          }
          return logo
        })
      )
      
      setLogos(updatedLogos)
    } catch (err) {
      setError('Failed to reset logo dimensions')
    } finally {
      setIsChangingDimensions(false)
    }
  }
  
  // Apply inch dimensions to selected logos
  const applyInchDimensionsToSelectedLogos = async (widthInches: number, heightInches: number) => {
    // Convert inches to pixels (1 inch = 96 pixels)
    const widthPx = Math.round(widthInches * 96)
    const heightPx = Math.round(heightInches * 96)
    
    // Apply the pixel dimensions
    applyDimensionsToSelectedLogos({ width: widthPx, height: heightPx })
  }
  
  // Apply millimeter dimensions to selected logos
  const applyMmDimensionsToSelectedLogos = async (widthMm: number, heightMm: number) => {
    // Convert mm to pixels (1 mm = 96/25.4 pixels)
    const widthPx = Math.round(widthMm * (96 / 25.4))
    const heightPx = Math.round(heightMm * (96 / 25.4))
    
    // Apply the pixel dimensions
    applyDimensionsToSelectedLogos({ width: widthPx, height: heightPx })
  }

  return (
    <section className="section-bg pt-20 pb-8">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Logo Canvas 🪄</h2>
          
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter company names (comma-separated, maximum 15 items)"
                  className="input flex-1 pl-10 py-2 bg-gray-50 border-gray-300 focus:ring-2 focus:ring-primary focus:bg-white shadow-sm"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary whitespace-nowrap relative"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  'Logo Search'
                )}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-500 text-sm font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2"
                  disabled={isLoading}
                >
                  <FiUpload className="w-4 h-4" />
                  Upload SVG Files
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-secondary flex items-center gap-2"
                  disabled={isLoading || isDownloading || logos.length === 0}
                >
                  {isDownloading ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiDownload className="w-4 h-4" />
                  )}
                  Download All
                </button>
                <button
                  onClick={handleClearAll}
                  className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isLoading || logos.length === 0}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500"
              >
                or drag SVG files into grid
              </motion.p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mb-4">
            <AnimatePresence>
              {warning && (
                <motion.div
                  key={`warning-${warning}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md p-4 bg-yellow-50 text-yellow-600 rounded-md text-center"
                >
                  {warning}
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  key={`error-${error}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md p-4 bg-red-50 text-red-600 rounded-md text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logo selection counter and controls */}
          {logos.length > 0 && (
            <div className="flex justify-end items-center w-full max-w-[75%] mx-auto mb-2 gap-2">
              <span className="text-sm font-medium text-gray-600">
                {selectedLogos.size}/{logos.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                disabled={selectedLogos.size === logos.length}
                title="Select all logos"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                disabled={selectedLogos.size === 0}
                title="Deselect all logos"
              >
                Deselect All
              </button>
            </div>
          )}

          <div 
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`mx-auto w-full max-w-[75%] relative rounded-lg transition-all duration-200 ${
              isDragging ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-primary/5 rounded-lg flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 px-6 py-4 rounded-lg shadow-lg">
                  <p className="text-primary font-medium">Drop SVG files here</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-5 gap-4">
              {[...Array(MAX_LOGOS)].map((_, index) => {
                const logo = logos[index]
                const isSelected = logo ? selectedLogos.has(index) : false
                return (
                  <div
                    key={index}
                    className="flex flex-col"
                  >
                    <div 
                      className="aspect-square bg-gray-100 rounded-lg relative group"
                      onClick={() => logo && toggleLogoSelection(index)}
                    >
                      {logo && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg transition-colors duration-200 ${
                              isSelected ? 'bg-primary/10' : ''
                            }`}
                          >
                            <img 
                              src={logo.url} 
                              alt={`Logo from ${logo.sourceProvider || logo.source}`} 
                              className="w-3/4 h-3/4 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48bGluZSB4MT0iMTIiIHkxPSI4IiB4Mj0iMTIiIHkyPSIxNiI+PC9saW5lPjxsaW5lIHgxPSI4IiB5MT0iMTIiIHgyPSIxNiIgeTI9IjEyIj48L2xpbmU+PC9zdmc+'
                                target.classList.add('text-gray-400')
                              }}
                            />
                            
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              {!isSelected && (
                                <button
                                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                                  title="Select logo"
                                >
                                  <FiCheck className="w-4 h-4 text-gray-600" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRefresh(logo, index)
                                }}
                                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                                disabled={logo.isRefreshing || !logo.searchTerm}
                                title={logo.searchTerm ? "Find alternative logo" : "Cannot refresh uploaded logos"}
                              >
                                {logo.isRefreshing ? (
                                  <FiLoader className="w-4 h-4 animate-spin text-gray-600" />
                                ) : (
                                  <FiRefreshCw className={`w-4 h-4 ${logo.searchTerm ? 'text-gray-600' : 'text-gray-400'}`} />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleView(logo.url)
                                }}
                                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                              >
                                <FiEye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(logo.id, index)
                                }}
                                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                              >
                                <FiX className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>

                            {/* Selection indicator for selected logos */}
                            {isSelected && (
                              <div className="absolute top-2 left-2">
                                <div className="p-1 bg-primary rounded-full">
                                  <FiCheck className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                    
                    {/* Dimensions information - now below the image cell */}
                    {logo && (
                      <div className="text-center text-xs text-gray-500 py-1 mt-1">
                        {logo.dimensions ? (
                          <div className="flex items-center justify-center">
                            {/* Dimension display based on selected unit */}
                            {displayUnit === 'px' && (
                              <span>{logo.dimensions.width} × {logo.dimensions.height} px</span>
                            )}
                            {displayUnit === 'in' && (
                              <span>
                                {convertPixelsToPhysicalUnits(logo.dimensions.width).inches}" × {convertPixelsToPhysicalUnits(logo.dimensions.height).inches}"
                              </span>
                            )}
                            {displayUnit === 'mm' && (
                              <span>
                                {convertPixelsToPhysicalUnits(logo.dimensions.width).mm} × {convertPixelsToPhysicalUnits(logo.dimensions.height).mm} mm
                              </span>
                            )}
                            
                            {/* Unit toggle buttons */}
                            <div className="inline-flex ml-2 border border-gray-200 rounded-md overflow-hidden">
                              <button 
                                className={`px-1 text-[10px] ${displayUnit === 'px' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}
                                onClick={(e) => { e.stopPropagation(); setDisplayUnit('px'); }}
                              >
                                px
                              </button>
                              <button 
                                className={`px-1 text-[10px] ${displayUnit === 'in' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}
                                onClick={(e) => { e.stopPropagation(); setDisplayUnit('in'); }}
                              >
                                in
                              </button>
                              <button 
                                className={`px-1 text-[10px] ${displayUnit === 'mm' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}
                                onClick={(e) => { e.stopPropagation(); setDisplayUnit('mm'); }}
                              >
                                mm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <FiLoader className="w-3 h-3 animate-spin inline" />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Editor Cards - Below grid */}
          <div className="mt-6 w-full max-w-[75%] mx-auto flex flex-wrap gap-4">
            {/* Color Editor Card */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex-1 max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Colors
              </h3>
              
              <p className="text-sm text-gray-500 mb-3">
                Select one or more logos to transform:
              </p>
              
              <div className="flex flex-wrap gap-6">
                <div>
                  <ColorPicker
                    initialColor={selectedColor}
                    onChange={(color) => {
                      setSelectedColor(color)
                      if (selectedLogos.size > 0) {
                        // Only show loading for button clicks, not for text input changes
                        const isButtonClick = color !== selectedColor && color.length === 7;
                        applyColorToSelectedLogos(color, isButtonClick)
                      }
                    }}
                    onGradientChange={(gradient) => {
                      if (selectedLogos.size > 0) {
                        // Only show loading for preset gradient selections, not for custom gradient adjustments
                        const isPresetGradient = !gradient.id.startsWith('custom-');
                        applyGradientToSelectedLogos(gradient, isPresetGradient)
                      }
                    }}
                    disabled={isApplyingColor}
                    canEditGradient={true} // Always allow editing gradient stoppers regardless of selection
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={resetSelectedLogosColor}
                    className="btn-secondary text-sm"
                    disabled={isApplyingColor || selectedLogos.size === 0}
                  >
                    {isApplyingColor && colorOperationType === 'reset' ? (
                      <FiLoader className="w-4 h-4 animate-spin mr-2 inline" />
                    ) : null}
                    Reset
                  </button>
                </div>
              </div>
            </div>
            
            {/* Dimension Editor Card */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex-1 max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Dimensions
              </h3>
              
              {/* Always render the DimensionEditor component */}
              <DimensionEditor
                initialDimensions={
                  selectedLogos.size === 1 
                    ? logos[Array.from(selectedLogos)[0]].dimensions 
                    : selectedLogos.size > 1 
                      ? { width: multiWidth, height: multiHeight }
                      : { width: 0, height: 0 } // Default dimensions when no logos selected
                }
                originalDimensions={
                  selectedLogos.size === 1 
                    ? logos[Array.from(selectedLogos)[0]].originalDimensions 
                    : selectedLogos.size > 1
                      ? (() => {
                          // Calculate average original dimensions for multiple logos
                          const selected = Array.from(selectedLogos)
                            .map(index => logos[index])
                            .filter(logo => logo && logo.originalDimensions);
                          
                          if (selected.length > 0) {
                            const totalWidth = selected.reduce((sum, logo) => 
                              sum + (logo.originalDimensions?.width || 0), 0);
                            const totalHeight = selected.reduce((sum, logo) => 
                              sum + (logo.originalDimensions?.height || 0), 0);
                            
                            return {
                              width: Math.round(totalWidth / selected.length),
                              height: Math.round(totalHeight / selected.length)
                            };
                          }
                          return undefined;
                        })()
                      : undefined
                }
                onChange={(dimensions) => {
                  if (selectedLogos.size > 0) {
                    applyDimensionsToSelectedLogos(dimensions);
                  }
                }}
                onScaleChange={(scalePercentage) => {
                  if (selectedLogos.size > 0) {
                    scaleSelectedLogos(scalePercentage);
                  }
                }}
                onReset={() => {
                  if (selectedLogos.size > 0) {
                    resetSelectedLogosDimensions();
                  }
                }}
                disabled={isChangingDimensions || selectedLogos.size === 0}
                selectionCount={selectedLogos.size}
                noLogos={logos.length === 0}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
