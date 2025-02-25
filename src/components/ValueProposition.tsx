import { motion } from 'framer-motion'
import { FiSearch, FiSliders, FiCode } from 'react-icons/fi'

const valueCards = [
  {
    title: 'One-shot Logo Search',
    description: 'Search and download multiple logos at once, no more tedious Googling.',
    icon: FiSearch,
  },
  {
    title: 'Batch Formatting',
    description: 'Consistently apply styles and formatting to multiple logos in one shot.',
    icon: FiSliders,
  },
  {
    title: 'SVG Logo Format',
    description: 'Crisp, high-quality, and resolution-independent.',
    icon: FiCode,
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export const ValueProposition = () => {
  return (
    <section className="section-bg py-20">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {valueCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                variants={item}
                className="relative group"
              >
                {/* Gradient border that appears on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition duration-300"></div>
                
                {/* Card content */}
                <div className="card hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center p-8 relative bg-white rounded-lg z-10">
                  <Icon className="w-8 h-8 text-primary mb-6" />
                  <h3 className="text-xl font-semibold text-primary mb-4 transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 transition-colors duration-300">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
