import { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameSelectors'

const PUPPY_PHOTOS = [
  '/PXL_20260130_222909317.jpg',
  '/PXL_20260201_195112570.jpg',
  '/PXL_20260206_013619475.jpg',
  '/PXL_20260210_003411072.jpg',
  '/PXL_20260220_234251765.jpg',
  '/PXL_20260221_001100324.jpg'
]

export default function Slideshow() {
  const { config } = useGameState()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0)

  if (!config) return null

  // Auto-rotate slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % PUPPY_PHOTOS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center mb-8">
      <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        <img
          src={PUPPY_PHOTOS[currentPhotoIndex]}
          alt={config.puppy_name}
          className="w-full h-auto block animate-fadeIn"
        />
        <div className="flex justify-center gap-3 mt-5">
          {PUPPY_PHOTOS.map((_, idx) => (
            <button
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-none cursor-pointer transition-all duration-300 p-0 ${
                idx === currentPhotoIndex
                  ? 'bg-gradient-to-br from-party-pink to-party-purple scale-[1.4] shadow-[0_0_0_4px_rgba(255,107,157,0.2)]'
                  : 'bg-party-pink/30 hover:bg-party-pink/60 hover:scale-[1.3]'
              }`}
              onClick={() => setCurrentPhotoIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      <h2 className="bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent mt-4 mb-0 font-bold text-[1.8rem]">{config.puppy_name}</h2>
    </div>
  )
}
