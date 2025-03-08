import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LogoBanner } from './LogoBanner'
import { ReversedLogoBannerNoGradient } from './ReversedLogoBannerNoGradient'
import { listLogosFromFolder } from '../services/internalLogoService'

const words = ['Consistent', 'Efficient', 'Sleek']

export const Hero = () => {
  const [currentWord, setCurrentWord] = useState(0)
  const [firstBannerLogoData, setFirstBannerLogoData] = useState<Array<{ id: string; url: string }>>([])
  const [secondBannerLogoData, setSecondBannerLogoData] = useState<Array<{ id: string; url: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Word animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Fetch logos from Supabase storage folders
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        setIsLoading(true)
        
        // Fetch logos from the first banner folder
        const firstBannerLogos = await listLogosFromFolder('Scrolling banner logos 1')
        
        // Fetch logos from the second banner folder
        const secondBannerLogos = await listLogosFromFolder('Scrolling banner logos 2')
        
        // Filter out any placeholder logos
        const filteredSecondBannerLogos = secondBannerLogos.filter(
          logo => !logo.url.includes('emptyFolderPlaceholder')
        )
        
        // Set the logo data for each banner
        setFirstBannerLogoData(firstBannerLogos.map(logo => ({ id: logo.id, url: logo.url })))
        setSecondBannerLogoData(filteredSecondBannerLogos.map(logo => ({ id: logo.id, url: logo.url })))
      } catch (error) {
        console.error('Failed to fetch logos from Supabase storage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogos()
  }, [])

  return (
    <section className="section-bg pt-32 pb-0 relative">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
            <span className="inline-block min-w-[200px]">
              <motion.span
                key={currentWord}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-primary"
              >
                {words[currentWord]}
              </motion.span>
            </span>
            <br />
            Logo Curation
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            for presentations, websites, marketing, and more.
          </p>
        </motion.div>
      </div>
      <LogoBanner logos={firstBannerLogoData} isLoading={isLoading} />
      <div className="mt-2"></div>
      <ReversedLogoBannerNoGradient logos={secondBannerLogoData} isLoading={isLoading} />
    </section>
  )
}
