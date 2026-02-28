import { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameSelectors'
import { useSwipe } from '../hooks/useSwipe'

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

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % PUPPY_PHOTOS.length)
  }

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + PUPPY_PHOTOS.length) % PUPPY_PHOTOS.length)
  }

  // Swipe gesture handlers for mobile
  const swipeHandlers = useSwipe({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious
  })

  // Auto-rotate slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(goToNext, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center mb-6 md:mb-8">
      <div
        className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-[0_12px_40px_rgba(0,0,0,0.15)] touch-pan-y"
        {...swipeHandlers}
      >
        <img
          src={PUPPY_PHOTOS[currentPhotoIndex]}
          alt={config.puppy_name}
          className="w-full h-auto block animate-fade-in select-none"
          draggable={false}
        />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-0">
          {PUPPY_PHOTOS.map((_, idx) => (
            <button
              key={idx}
              className="min-w-[34px] min-h-[44px] border-none cursor-pointer p-0 flex items-center justify-center bg-transparent"
              onClick={() => setCurrentPhotoIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
            >
              <span className={`block rounded-full transition-all duration-300 ${
                idx === currentPhotoIndex
                  ? 'w-2.5 h-2.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.3)]'
                  : 'w-2 h-2 bg-white/50'
              }`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
