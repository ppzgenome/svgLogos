import axios from 'axios'

interface LogoSearchResult {
  id: string
  url: string
  source: string
  sourceProvider: string
}

interface MultiLogoSearchResult {
  successes: LogoSearchResult[]
  failures: string[]
}

// Source providers with their URLs
const LOGO_SOURCES = {
  simpleIcons: {
    name: 'Simple Icons',
    urls: [
      (term: string) => `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${term}.svg`,
      (term: string) => `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${term}.svg`,
      (term: string) => `https://raw.githubusercontent.com/simple-icons/simple-icons/master/icons/${term}.svg`
    ]
  },
  vectorLogoZone: {
    name: 'Vector Logo Zone',
    urls: [
      (term: string) => `https://www.vectorlogo.zone/logos/${term}/${term}-icon.svg`,
      (term: string) => `https://www.vectorlogo.zone/logos/${term}/${term}.svg`
    ]
  },
  iconify: {
    name: 'Iconify',
    urls: [
      (term: string) => `https://api.iconify.design/${term}.svg`,
      (term: string) => `https://api.iconify.design/logos/${term}.svg`,
      (term: string) => `https://api.iconify.design/logos-${term}.svg`
    ]
  },
  svgPorn: {
    name: 'SVG Porn',
    urls: [
      (term: string) => `https://cdn.svgporn.com/logos/${term}.svg`,
      (term: string) => `https://cdn.svgporn.com/logos/${term}-icon.svg`
    ]
  },
  gilbarbara: {
    name: 'Gil Barbara Logos',
    urls: [
      (term: string) => `https://raw.githubusercontent.com/gilbarbara/logos/master/logos/${term}.svg`,
      (term: string) => `https://raw.githubusercontent.com/gilbarbara/logos/master/logos/${term}-icon.svg`
    ]
  },
  wikimedia: {
    name: 'Wikimedia Commons',
    urls: [
      (term: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/archive/${term}_logo.svg`,
      (term: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/archive/${term}-logo.svg`
    ]
  },
  brandLogos: {
    name: 'Brand Logos',
    urls: [
      (term: string) => `https://www.brandlogos.net/logos/${term}-logo.svg`,
      (term: string) => `https://www.brandlogos.net/logos/${term}_logo.svg`
    ]
  }
}

// Cache for storing successful searches
const searchCache = new Map<string, LogoSearchResult>()

// Track used sources for each term to enable rotation
const usedSources = new Map<string, Set<string>>()

// Track failed sources to avoid retrying them immediately
const failedSources = new Map<string, Set<string>>()

// Clear failed sources after a certain time to allow retrying
const FAILED_SOURCE_RESET_TIME = 1000 * 60 * 5 // 5 minutes

// Periodically clear old failed sources
setInterval(() => {
  failedSources.clear()
}, FAILED_SOURCE_RESET_TIME)

// Enhanced helper to check if a URL returns a valid SVG
const isValidSvgUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: { 
        Accept: 'image/svg+xml',
        // Add user agent to avoid being blocked by some servers
        'User-Agent': 'SVGLogos/1.0 (https://github.com/ppzgenome/svgLogos)'
      }
    })
    
    // Check HTTP status
    if (response.status !== 200) {
      return false
    }
    
    // Check content type header
    const contentType = response.headers['content-type']
    const isContentTypeSvg = contentType && 
      (contentType.includes('svg') || 
       contentType.includes('image/svg+xml'))
    
    // Check if response data contains SVG markers
    const responseText = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data)
    
    const hasSvgTags = responseText.includes('<svg') && 
                       responseText.includes('</svg>')
    
    const hasXmlNamespace = responseText.includes('xmlns="http://www.w3.org/2000/svg"')
    
    // Ensure it's a proper SVG by checking multiple criteria
    return (isContentTypeSvg || (hasSvgTags && hasXmlNamespace))
  } catch (error) {
    // Log error for debugging but don't throw
    console.error(`Error checking SVG URL ${url}:`, error)
    return false
  }
}

// Helper to sanitize and normalize search terms
const normalizeTerm = (term: string): string => {
  return term.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
}

export const searchLogo = async (term: string): Promise<LogoSearchResult> => {
  const normalizedTerm = normalizeTerm(term)
  
  // Check cache first
  const cachedResult = searchCache.get(normalizedTerm)
  if (cachedResult) {
    return cachedResult
  }

  // Initialize used sources for this term if not exists
  if (!usedSources.has(normalizedTerm)) {
    usedSources.set(normalizedTerm, new Set())
  }

  // Initialize failed sources for this term if not exists
  if (!failedSources.has(normalizedTerm)) {
    failedSources.set(normalizedTerm, new Set())
  }

  const termFailedSources = failedSources.get(normalizedTerm)!

  // Try each provider in order, skipping known failed sources
  for (const [providerId, provider] of Object.entries(LOGO_SOURCES)) {
    // Skip providers that have failed recently for this term
    if (termFailedSources.has(providerId)) {
      continue
    }

    try {
      for (const urlGenerator of provider.urls) {
        const url = urlGenerator(normalizedTerm)
        if (await isValidSvgUrl(url)) {
          const result = {
            id: `${providerId}-${normalizedTerm}`,
            url,
            source: providerId,
            sourceProvider: provider.name
          }
          
          // Add to used sources
          usedSources.get(normalizedTerm)?.add(providerId)
          
          // Cache the result
          searchCache.set(normalizedTerm, result)
          return result
        }
      }
      
      // If we get here, all URLs for this provider failed
      termFailedSources.add(providerId)
    } catch (error) {
      // If there's an error with this provider, mark it as failed and continue
      console.error(`Error with provider ${providerId}:`, error)
      termFailedSources.add(providerId)
      continue
    }
  }

  // If no SVG is found, throw an error
  throw new Error(`No SVG logo found for: ${term}`)
}

export const searchLogoAlternative = async (term: string, currentUrl: string, currentProvider?: string): Promise<LogoSearchResult> => {
  const normalizedTerm = normalizeTerm(term)
  
  // Clear the cache for this term to force a new search
  searchCache.delete(normalizedTerm)
  
  // Get used sources for this term
  const termUsedSources = usedSources.get(normalizedTerm) || new Set()
  
  // Get failed sources for this term
  const termFailedSources = failedSources.get(normalizedTerm) || new Set()
  
  // Create a prioritized list of providers
  // Start with providers we haven't used yet and haven't failed
  const unusedProviders = Object.entries(LOGO_SOURCES)
    .filter(([providerId]) => 
      !termUsedSources.has(providerId) && 
      !termFailedSources.has(providerId)
    )
    
  // Then add providers we've used before, but not the current one and not failed
  const usedProviders = Object.entries(LOGO_SOURCES)
    .filter(([providerId]) => 
      termUsedSources.has(providerId) && 
      providerId !== currentProvider &&
      !termFailedSources.has(providerId)
    )
    
  // Finally add the current provider as last resort if it hasn't failed
  const currentProviderEntry = currentProvider && !termFailedSources.has(currentProvider) ? 
    Object.entries(LOGO_SOURCES).find(([providerId]) => providerId === currentProvider) : 
    undefined
    
  // Combine all providers in priority order
  const prioritizedProviders = [
    ...unusedProviders,
    ...usedProviders,
    ...(currentProviderEntry ? [currentProviderEntry] : [])
  ]
  
  // Try each provider in priority order
  for (const [providerId, provider] of prioritizedProviders) {
    try {
      // Skip URLs that match the current URL
      const urlsToTry = provider.urls
        .map(urlGen => urlGen(normalizedTerm))
        .filter(url => url !== currentUrl)
        
      for (const url of urlsToTry) {
        if (await isValidSvgUrl(url)) {
          const result = {
            id: `${providerId}-${normalizedTerm}-${Math.random().toString(36).substring(2, 9)}`,
            url,
            source: providerId,
            sourceProvider: provider.name
          }
          
          // Add to used sources
          if (!usedSources.has(normalizedTerm)) {
            usedSources.set(normalizedTerm, new Set())
          }
          usedSources.get(normalizedTerm)?.add(providerId)
          
          // Don't cache this result to allow for more refreshes
          return result
        }
      }
      
      // If we get here, all URLs for this provider failed
      if (!termFailedSources.has(providerId)) {
        if (!failedSources.has(normalizedTerm)) {
          failedSources.set(normalizedTerm, new Set())
        }
        failedSources.get(normalizedTerm)?.add(providerId)
      }
    } catch (error) {
      // If there's an error with this provider, mark it as failed and continue
      console.error(`Error with provider ${providerId}:`, error)
      if (!failedSources.has(normalizedTerm)) {
        failedSources.set(normalizedTerm, new Set())
      }
      failedSources.get(normalizedTerm)?.add(providerId)
      continue
    }
  }
  
  // If no alternative is found, throw an error
  throw new Error(`No alternative SVG logo found for: ${term}`)
}

export const searchMultipleLogos = async (terms: string[]): Promise<MultiLogoSearchResult> => {
  // Define a type for our search result that includes success/failure info
  type SearchResult = {
    term: string;
    logo?: LogoSearchResult;
    success: boolean;
    error?: unknown;
  };

  const results = await Promise.allSettled(
    terms.map(async (term) => {
      try {
        const logo = await searchLogo(term)
        return { term, logo, success: true } as SearchResult
      } catch (error) {
        return { term, error, success: false } as SearchResult
      }
    })
  )
  
  // Separate successful and failed results
  const successfulResults: LogoSearchResult[] = []
  const failedTerms: string[] = []
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      if (result.value.success && result.value.logo) {
        successfulResults.push(result.value.logo)
      } else {
        failedTerms.push(result.value.term)
      }
    } else {
      // Handle rejected promises (should be rare)
      console.error('Search promise rejected:', result.reason)
    }
  })

  // If no logos found at all, throw an error
  if (successfulResults.length === 0) {
    throw new Error('No logos found. Try different search terms.')
  }

  // Return both successful and failed results
  return {
    successes: successfulResults,
    failures: failedTerms
  }
}
