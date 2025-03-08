import { motion } from 'framer-motion'
import { BuyMeCoffeeButton } from './BuyMeCoffeeButton'

export const Footer = () => {
  return (
    <footer className="section-bg py-12">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="mb-4">
            <BuyMeCoffeeButton />
          </div>
          <p className="text-gray-600">&copy; {new Date().getFullYear()} svgLogos. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  )
}
