import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiEye, FiLoader, FiUpload, FiTrash2, FiCheck, FiDownload, FiRefreshCw } from 'react-icons/fi'
import { searchMultipleLogos, searchLogoAlternative } from '../services/logoService'
import { processUploadedFiles, getSvgDimensions, downloadLogosAsZip } from '../services/fileService'

interface Logo {
  id: string
  url: string
  source: string
  sourceProvider?: string
  searchTerm?: string
  dimensions?: {
    width: number
    height: number
  }
  needsDimensions?: boolean
  isRefreshing?: boolean
}

const MAX_LOGOS = 15

export const WorkArea = () => {
  const [logos, setLogos] = useState<Logo[]>([])
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const errorTimerRef = useRef<number | null>(null)

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
      return { ...logo, dimensions, needsDimensions: false }
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
      const { urls, errors } = await processUploadedFiles(files, MAX_LOGOS, logos.length)
      
      if (errors.length > 0) {
        setError(errors.join('. '))
      }

      if (urls.length > 0) {
        const newLogos: Logo[] = urls.map(url => ({
          id: `upload-${Math.random().toString(36).substr(2, 9)}`,
          url,
          source: 'upload',
          sourceProvider: 'User Upload',
          needsDimensions: true
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

  const handleDelete = (id: string) => {
    setLogos(logos.filter(logo => logo.id !== id))
    setSelectedLogos(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
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

  const toggleLogoSelection = (id: string) => {
    setSelectedLogos(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDownload = async () => {
    if (logos.length === 0) return
    
    setIsDownloading(true)
    try {
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
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter company names (comma-separated, maximum 15 items)"
                className="input flex-1"
                disabled={isLoading}
              />
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
                const isSelected = logo ? selectedLogos.has(logo.id) : false
                return (
                  <div
                    key={index}
                    className="aspect-square bg-gray-100 rounded-lg relative group"
                    onClick={() => logo && toggleLogoSelection(logo.id)}
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
                                handleDelete(logo.id)
                              }}
                              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                            >
                              <FiX className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 left-2">
                              <div className="p-1 bg-primary rounded-full">
                                <FiCheck className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 bg-white/80 py-1">
                            {logo.dimensions ? (
                              <span>
                                {logo.dimensions.width} × {logo.dimensions.height} px
                              </span>
                            ) : (
                              <FiLoader className="w-3 h-3 animate-spin inline" />
                            )}
                            <span className="ml-1">• SVG</span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
