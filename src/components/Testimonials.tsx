import { motion } from 'framer-motion'
import { FiStar } from 'react-icons/fi'

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    quote: "svgLogos has completely transformed our design workflow. The batch formatting feature saved us countless hours of manual work.",
    author: "Sarah Johnson",
    position: "Creative Director, McKinsey",
    rating: 5
  },
  {
    id: 2,
    quote: "The one-shot logo search is a game-changer. We can now find and download multiple logos in seconds instead of tedious searching.",
    author: "Michael Chen",
    position: "Marketing Lead, Google",
    rating: 5
  },
  {
    id: 3,
    quote: "As a web developer, I appreciate the high-quality SVG format. The logos are crisp, scalable, and perfect for responsive design.",
    author: "Alex Rodriguez",
    position: "Frontend Developer, CYW USA",
    rating: 5
  },
  {
    id: 4,
    quote: "The ability to batch process logos has streamlined our branding projects. What used to take days now takes hours.",
    author: "Emily Zhang",
    position: "Brand Strategist, Amazon",
    rating: 5
  },
  {
    id: 5,
    quote: "I've tried many logo tools, but svgLogos stands out for its simplicity and powerful features. It's become essential for our design team.",
    author: "David Wilson",
    position: "UI/UX Director, The Verge",
    rating: 5
  },
  {
    id: 6,
    quote: "The consistency in logo formatting across our presentations has improved dramatically since we started using svgLogos.",
    author: "Priya Patel",
    position: "Marketing Director, Deloitte",
    rating: 5
  }
]

export const Testimonials = () => {
  return (
    <section className="section-bg py-20">
      <div className="section-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          What My Users Say
        </motion.h2>
        
        <div className="testimonial-banner overflow-hidden">
          <div className="testimonial-scroll">
            {/* First set of testimonials */}
            <div className="testimonial-container">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="testimonial-item relative"
                >
                  {/* Card content */}
                  <div className="card transition-all duration-300 flex flex-col p-8 relative bg-white rounded-lg z-10 h-full">
                    {/* Star rating */}
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <p className="text-gray-600 italic mb-6">
                      "{testimonial.quote}"
                    </p>
                    
                    {/* Author info */}
                    <div className="mt-auto">
                      <h3 className="text-lg font-semibold text-primary">
                        {testimonial.author}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {testimonial.position}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Duplicate set for seamless looping */}
            <div className="testimonial-container">
              {testimonials.map((testimonial) => (
                <div
                  key={`dup-${testimonial.id}`}
                  className="testimonial-item relative"
                >
                  {/* Card content */}
                  <div className="card transition-all duration-300 flex flex-col p-8 relative bg-white rounded-lg z-10 h-full">
                    {/* Star rating */}
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <p className="text-gray-600 italic mb-6">
                      "{testimonial.quote}"
                    </p>
                    
                    {/* Author info */}
                    <div className="mt-auto">
                      <h3 className="text-lg font-semibold text-primary">
                        {testimonial.author}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {testimonial.position}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
