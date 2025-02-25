import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const words = ['Consistent', 'Efficient', 'Sleek']

export const Hero = () => {
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="section-bg py-32">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
            Logo Creation
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            for presentations, websites, marketing, and more.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
