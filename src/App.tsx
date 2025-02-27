import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ValueProposition } from './components/ValueProposition'
import { WorkArea } from './components/WorkArea'
import { Testimonials } from './components/Testimonials'
import { Footer } from './components/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <ValueProposition />
        <WorkArea />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}

export default App
