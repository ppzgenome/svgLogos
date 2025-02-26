import JSZip from 'jszip'

interface ProcessedFile {
  url: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export const processUploadedFiles = async (
  files: FileList,
  maxFiles: number,
  currentCount: number
): Promise<{ processedFiles: ProcessedFile[]; errors: string[] }> => {
  const processedFiles: ProcessedFile[] = []
  const errors: string[] = []

  if (currentCount + files.length > maxFiles) {
    errors.push(`Cannot add more than ${maxFiles} files`)
    return { processedFiles, errors }
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.includes('svg')) {
      errors.push(`${file.name} is not an SVG file`)
      continue
    }

    try {
      const url = URL.createObjectURL(file)
      
      // Read the file content to extract dimensions
      const fileReader = new FileReader()
      const dimensions = await new Promise<{ width: number; height: number } | undefined>((resolve) => {
        fileReader.onload = async (e) => {
          try {
            const content = e.target?.result as string
            if (content) {
              const parser = new DOMParser()
              const doc = parser.parseFromString(content, 'image/svg+xml')
              const svg = doc.querySelector('svg')
              
              if (svg) {
                // First check for explicit width and height attributes
                const widthAttr = svg.getAttribute('width')
                const heightAttr = svg.getAttribute('height')
                
                if (widthAttr && heightAttr) {
                  // Parse dimensions, handling units if present
                  const width = parseFloat(widthAttr.replace(/[^0-9.]/g, ''))
                  const height = parseFloat(heightAttr.replace(/[^0-9.]/g, ''))
                  
                  if (!isNaN(width) && !isNaN(height)) {
                    resolve({ width, height })
                    return
                  }
                }
                
                // Fall back to viewBox if width/height not available
                const viewBox = svg.getAttribute('viewBox')
                if (viewBox) {
                  const [, , width, height] = viewBox.split(' ').map(Number)
                  if (!isNaN(width) && !isNaN(height)) {
                    resolve({ width, height })
                    return
                  }
                }
              }
              resolve(undefined)
            } else {
              resolve(undefined)
            }
          } catch (err) {
            console.error('Error parsing SVG:', err)
            resolve(undefined)
          }
        }
        fileReader.readAsText(file)
      })
      
      processedFiles.push({ url, dimensions })
    } catch (err) {
      errors.push(`Failed to process ${file.name}`)
    }
  }

  return { processedFiles, errors }
}

export const getSvgDimensions = async (url: string): Promise<{ width: number; height: number }> => {
  const response = await fetch(url)
  const text = await response.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  
  if (!svg) {
    throw new Error('Invalid SVG')
  }

  // First check for explicit width and height attributes
  const widthAttr = svg.getAttribute('width')
  const heightAttr = svg.getAttribute('height')
  
  if (widthAttr && heightAttr) {
    // Parse dimensions, handling units if present
    const width = parseFloat(widthAttr.replace(/[^0-9.]/g, ''))
    const height = parseFloat(heightAttr.replace(/[^0-9.]/g, ''))
    
    if (!isNaN(width) && !isNaN(height)) {
      return { width, height }
    }
  }
  
  // Fall back to viewBox if width/height not available or invalid
  const viewBox = svg.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.split(' ').map(Number)
    if (parts.length >= 4) {
      const width = parts[2]
      const height = parts[3]
      if (!isNaN(width) && !isNaN(height)) {
        return { width, height }
      }
    }
  }

  throw new Error('Could not determine SVG dimensions')
}

interface LogoWithDimensions {
  url: string;
  id: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export const downloadLogosAsZip = async (logos: LogoWithDimensions[]): Promise<void> => {
  const zip = new JSZip()

  // Create downloads folder
  const folder = zip.folder('logos')
  if (!folder) throw new Error('Failed to create zip folder')

  // Download each SVG and add to zip
  await Promise.all(
    logos.map(async (logo, index) => {
      try {
        const response = await fetch(logo.url)
        const svgText = await response.text()
        
        // If the logo has dimensions, ensure they are applied to the SVG
        if (logo.dimensions) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(svgText, 'image/svg+xml')
          const svgElement = doc.querySelector('svg')
          
          if (svgElement) {
            // Set width and height attributes explicitly
            svgElement.setAttribute('width', logo.dimensions.width.toString())
            svgElement.setAttribute('height', logo.dimensions.height.toString())
            
            // Convert back to text
            const serializer = new XMLSerializer()
            const modifiedSvgText = serializer.serializeToString(doc)
            
            // Create a blob from the modified SVG text
            const blob = new Blob([modifiedSvgText], { type: 'image/svg+xml' })
            const fileName = `logo-${index + 1}.svg`
            folder.file(fileName, blob)
          } else {
            // Fallback if SVG element not found
            const blob = new Blob([svgText], { type: 'image/svg+xml' })
            const fileName = `logo-${index + 1}.svg`
            folder.file(fileName, blob)
          }
        } else {
          // No dimensions to apply, just use the original SVG
          const blob = new Blob([svgText], { type: 'image/svg+xml' })
          const fileName = `logo-${index + 1}.svg`
          folder.file(fileName, blob)
        }
      } catch (error) {
        console.error(`Failed to download logo ${logo.id}:`, error)
      }
    })
  )

  // Generate and download zip file
  const content = await zip.generateAsync({ type: 'blob' })
  const downloadUrl = URL.createObjectURL(content)
  
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'logos.zip'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(downloadUrl)
}
