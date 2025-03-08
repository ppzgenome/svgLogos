import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import SHA256 from 'crypto-js/sha256'
import encHex from 'crypto-js/enc-hex'

// Supabase configuration - using direct values since we have them from the .env file
const supabaseUrl = 'https://bxegwxrggebnjnowjvol.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZWd3eHJnZ2Vibmpub3dqdm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NzExNzksImV4cCI6MjA1NjQ0NzE3OX0.9_pz8u63FLQJ7f0PHBJWL6d7oCUU1eAJRbWj-TraPrw'

// Storage bucket name
const STORAGE_BUCKET = 'internal-logo-repo'

// Table name
const LOGO_SEARCHES_TABLE = 'logo_searches'

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Interface for logo search records
interface LogoSearchRecord {
  id: string
  search_term: string
  file_name: string
  source: string
  created_at: string
  logo_found: boolean
  object_url: string | null
  content_hash: string | null
  visual_signature: any | null
}

// Interface for internal logo search result
export interface InternalLogoSearchResult {
  id: string
  url: string
  source: string
  sourceProvider: string
  searchTerm: string
}

/**
 * Normalize SVG content to ensure consistent comparison
 */
function normalizeSvgContent(svgContent: string): string {
  // Remove whitespace between tags
  let normalized = svgContent.replace(/>\s+</g, '><')
  
  // Trim whitespace
  normalized = normalized.trim()
  
  // Convert to lowercase
  normalized = normalized.toLowerCase()
  
  return normalized
}

/**
 * Generate a hash for SVG content
 */
function generateContentHash(svgContent: string): string {
  const normalizedContent = normalizeSvgContent(svgContent)
  return SHA256(normalizedContent).toString(encHex)
}

/**
 * Extract visual signature from SVG content
 * This is a simplified implementation that extracts basic characteristics
 */
function extractVisualSignature(svgContent: string): any {
  try {
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svgElement = svgDoc.querySelector('svg')
    
    if (!svgElement) {
      return null
    }
    
    // Extract basic characteristics
    const viewBox = svgElement.getAttribute('viewBox')
    const width = svgElement.getAttribute('width')
    const height = svgElement.getAttribute('height')
    
    // Count path elements
    const pathCount = svgDoc.querySelectorAll('path').length
    
    // Count other shape elements
    const circleCount = svgDoc.querySelectorAll('circle').length
    const rectCount = svgDoc.querySelectorAll('rect').length
    const ellipseCount = svgDoc.querySelectorAll('ellipse').length
    const lineCount = svgDoc.querySelectorAll('line').length
    const polylineCount = svgDoc.querySelectorAll('polyline').length
    const polygonCount = svgDoc.querySelectorAll('polygon').length
    
    // Extract colors
    const colors = new Set<string>()
    const colorElements = svgDoc.querySelectorAll('[fill], [stroke]')
    colorElements.forEach(el => {
      const fill = (el as Element).getAttribute('fill')
      const stroke = (el as Element).getAttribute('stroke')
      if (fill && fill !== 'none') colors.add(fill)
      if (stroke && stroke !== 'none') colors.add(stroke)
    })
    
    return {
      viewBox,
      width,
      height,
      elements: {
        path: pathCount,
        circle: circleCount,
        rect: rectCount,
        ellipse: ellipseCount,
        line: lineCount,
        polyline: polylineCount,
        polygon: polygonCount,
        total: pathCount + circleCount + rectCount + ellipseCount + lineCount + polylineCount + polygonCount
      },
      colors: Array.from(colors)
    }
  } catch (error) {
    console.error('Error extracting visual signature:', error)
    return null
  }
}

/**
 * Compare two visual signatures to determine if they are similar
 */
function areVisualSignaturesSimilar(sig1: any, sig2: any): boolean {
  if (!sig1 || !sig2) return false
  
  // Compare element counts with some tolerance
  const elementDiff = Math.abs(sig1.elements.total - sig2.elements.total)
  const elementTolerance = Math.max(sig1.elements.total, sig2.elements.total) * 0.2 // 20% tolerance
  
  // Compare colors
  const colorSet1 = new Set(sig1.colors)
  const colorSet2 = new Set(sig2.colors)
  const commonColors = sig1.colors.filter((color: string) => colorSet2.has(color)).length
  const colorSimilarity = commonColors / Math.max(colorSet1.size, colorSet2.size)
  
  // Logos are similar if element counts are close and they share most colors
  return elementDiff <= elementTolerance && colorSimilarity >= 0.7
}

/**
 * Check if a logo already exists in the repository
 */
async function logoExistsInRepository(searchTerm: string, svgContent: string): Promise<boolean> {
  try {
    const contentHash = generateContentHash(svgContent)
    const visualSignature = extractVisualSignature(svgContent)
    
    // First check for exact content match using hash
    const { data: hashMatches, error: hashError } = await supabase
      .from(LOGO_SEARCHES_TABLE)
      .select('*')
      .eq('content_hash', contentHash)
      .eq('logo_found', true)
    
    if (hashError) {
      console.error('Error checking for hash matches:', hashError)
      return false
    }
    
    if (hashMatches && hashMatches.length > 0) {
      return true
    }
    
    // If no exact match, check for visual similarity
    const { data: termMatches, error: termError } = await supabase
      .from(LOGO_SEARCHES_TABLE)
      .select('*')
      .eq('search_term', searchTerm.toLowerCase())
      .eq('logo_found', true)
    
    if (termError) {
      console.error('Error checking for term matches:', termError)
      return false
    }
    
    if (termMatches && termMatches.length > 0) {
      // Check each match for visual similarity
      for (const match of termMatches) {
        if (match.visual_signature && areVisualSignaturesSimilar(visualSignature, match.visual_signature)) {
          return true
        }
      }
    }
    
    return false
  } catch (error) {
    console.error('Error checking if logo exists:', error)
    return false
  }
}

/**
 * Search for a logo in the internal repository
 */
export async function searchInternalRepo(term: string): Promise<InternalLogoSearchResult | null> {
  try {
    const normalizedTerm = term.toLowerCase().trim()
    
    // Query the database for the search term
    const { data, error } = await supabase
      .from(LOGO_SEARCHES_TABLE)
      .select('*')
      .eq('search_term', normalizedTerm)
      .eq('logo_found', true)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Error searching internal repo:', error)
      return null
    }
    
    if (!data || data.length === 0) {
      // No match found
      return null
    }
    
    const record = data[0] as LogoSearchRecord
    
    // If we have a record but no object_url, something is wrong
    if (!record.object_url) {
      console.error('Record found but no object_url:', record)
      return null
    }
    
    // Return the logo information
    return {
      id: `internal-${record.id}`,
      url: record.object_url,
      source: 'internal',
      sourceProvider: 'Internal Logo Repository',
      searchTerm: normalizedTerm
    }
  } catch (error) {
    console.error('Error in searchInternalRepo:', error)
    return null
  }
}

/**
 * Save a logo to the internal repository
 */
export async function saveLogoToInternalRepo(
  term: string,
  logo: { url: string; source: string; sourceProvider?: string },
  svgContent: string
): Promise<boolean> {
  try {
    const normalizedTerm = term.toLowerCase().trim()
    
    // Check if this logo already exists in our repository
    const exists = await logoExistsInRepository(normalizedTerm, svgContent)
    if (exists) {
      console.log(`Logo for "${normalizedTerm}" already exists in repository`)
      return false
    }
    
    // Generate a unique filename
    const fileName = `${normalizedTerm}-${uuidv4()}.svg`
    
    // Upload the SVG to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, new Blob([svgContent], { type: 'image/svg+xml' }), {
        contentType: 'image/svg+xml',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Error uploading logo to storage:', uploadError)
      return false
    }
    
    // Get the public URL
    const { data: publicUrlData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL for uploaded file')
      return false
    }
    
    // Generate content hash and visual signature
    const contentHash = generateContentHash(svgContent)
    const visualSignature = extractVisualSignature(svgContent)
    
    // Create a record in the database
    const { data: insertData, error: insertError } = await supabase
      .from(LOGO_SEARCHES_TABLE)
      .insert([
        {
          id: uuidv4(),
          search_term: normalizedTerm,
          file_name: fileName,
          source: logo.source,
          created_at: new Date().toISOString(),
          logo_found: true,
          object_url: publicUrlData.publicUrl,
          content_hash: contentHash,
          visual_signature: visualSignature
        }
      ])
    
    if (insertError) {
      console.error('Error inserting logo record:', insertError)
      return false
    }
    
    console.log(`Logo for "${normalizedTerm}" saved to internal repository`)
    return true
  } catch (error) {
    console.error('Error in saveLogoToInternalRepo:', error)
    return false
  }
}

/**
 * Track a failed search in the database
 */
export async function trackFailedSearch(term: string): Promise<void> {
  try {
    const normalizedTerm = term.toLowerCase().trim()
    
    // Create a record in the database
    const { error } = await supabase
      .from(LOGO_SEARCHES_TABLE)
      .insert([
        {
          id: uuidv4(),
          search_term: normalizedTerm,
          file_name: '',
          source: 'none',
          created_at: new Date().toISOString(),
          logo_found: false,
          object_url: null,
          content_hash: null,
          visual_signature: null
        }
      ])
    
    if (error) {
      console.error('Error tracking failed search:', error)
    }
  } catch (error) {
    console.error('Error in trackFailedSearch:', error)
  }
}

/**
 * Initialize the Supabase storage bucket if it doesn't exist
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET)
    
    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true
      })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
      } else {
        console.log(`Created storage bucket: ${STORAGE_BUCKET}`)
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error)
  }
}

// Initialize storage when the module is imported
initializeStorage()
