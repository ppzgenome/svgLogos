import { motion } from 'framer-motion'
import { useState } from 'react'
import { AboutModal } from './AboutModal'
import { BuyMeCoffeeButton } from './BuyMeCoffeeButton'

export const Header = () => {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold logo-gradient"
          >
            svgLogos
          </motion.div>
          
          <div className="flex gap-4 items-center">
            <BuyMeCoffeeButton />
            <button 
              className="btn-secondary"
              onClick={() => setIsAboutModalOpen(true)}
            >
              About
            </button>
            <AboutModal 
              isOpen={isAboutModalOpen}
              onClose={() => setIsAboutModalOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
