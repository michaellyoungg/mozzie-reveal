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
          className="w-full h-auto block animate-fadeIn select-none"
          draggable={false}
        />
        <div className="flex justify-center gap-2 md:gap-3 mt-4 md:mt-5">
          {PUPPY_PHOTOS.map((_, idx) => (
            <button
              key={idx}
              className={`min-w-[44px] min-h-[44px] rounded-full border-none cursor-pointer transition-all duration-300 p-0 flex items-center justify-center ${
                idx === currentPhotoIndex
                  ? 'bg-gradient-to-br from-party-pink to-party-purple shadow-[0_0_0_4px_rgba(255,107,157,0.2)]'
                  : 'bg-party-pink/30 active:bg-party-pink/60'
              }`}
              onClick={() => setCurrentPhotoIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
            >
              <span className={`block w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all ${
                idx === currentPhotoIndex
                  ? 'bg-white scale-110'
                  : 'bg-party-pink/60'
              }`} />
            </button>
          ))}
        </div>
      </div>
      <h2 className="bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent mt-4 mb-0 font-bold text-xl md:text-2xl lg:text-[1.8rem]">{config.puppy_name}</h2>
    </div>
  )
}
