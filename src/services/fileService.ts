import JSZip from 'jszip'

export const processUploadedFiles = async (
  files: FileList,
  maxFiles: number,
  currentCount: number
): Promise<{ urls: string[]; errors: string[] }> => {
  const urls: string[] = []
  const errors: string[] = []

  if (currentCount + files.length > maxFiles) {
    errors.push(`Cannot add more than ${maxFiles} files`)
    return { urls, errors }
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.includes('svg')) {
      errors.push(`${file.name} is not an SVG file`)
      continue
    }

    try {
      const url = URL.createObjectURL(file)
      urls.push(url)
    } catch (err) {
      errors.push(`Failed to process ${file.name}`)
    }
  }

  return { urls, errors }
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

  const viewBox = svg.getAttribute('viewBox')
  if (viewBox) {
    const [, , width, height] = viewBox.split(' ').map(Number)
    return { width, height }
  }

  const width = parseInt(svg.getAttribute('width') || '0', 10)
  const height = parseInt(svg.getAttribute('height') || '0', 10)
  
  if (width && height) {
    return { width, height }
  }

  throw new Error('Could not determine SVG dimensions')
}

export const downloadLogosAsZip = async (logos: { url: string; id: string }[]): Promise<void> => {
  const zip = new JSZip()

  // Create downloads folder
  const folder = zip.folder('logos')
  if (!folder) throw new Error('Failed to create zip folder')

  // Download each SVG and add to zip
  await Promise.all(
    logos.map(async (logo, index) => {
      try {
        const response = await fetch(logo.url)
        const blob = await response.blob()
        const fileName = `logo-${index + 1}.svg`
        folder.file(fileName, blob)
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
