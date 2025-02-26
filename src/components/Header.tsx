import { motion } from 'framer-motion'

export const Header = () => {
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
          
          <div className="flex gap-4">
            <button className="btn-secondary">
              Login
            </button>
            <button className="btn-primary">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
