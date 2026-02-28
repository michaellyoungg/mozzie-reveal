import { useState, useEffect, useRef } from 'react'
import { useGameState } from '../hooks/useGameSelectors'

const PUPPY_PHOTOS = [
  '/PXL_20260130_222909317.jpg',
  '/PXL_20260201_195112570.jpg',
  '/PXL_20260206_013619475.jpg',
  '/PXL_20260210_003411072.jpg',
  '/PXL_20260220_234251765.jpg',
  '/PXL_20260221_001100324.jpg'
]

const AUTO_ROTATE_MS = 4000
const SWIPE_THRESHOLD = 50

export default function Slideshow() {
  const { config } = useGameState()
  const [currentIndex, setCurrentIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startX: 0, currentX: 0, dragging: false })

  if (!config) return null

  // Auto-rotate — resets whenever currentIndex changes (swipe, dot tap, or auto)
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % PUPPY_PHOTOS.length)
    }, AUTO_ROTATE_MS)
    return () => clearInterval(id)
  }, [currentIndex])

  // Touch handlers — manipulate DOM directly for zero-lag drag feedback
  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startX: e.touches[0].clientX, currentX: e.touches[0].clientX, dragging: true }
    if (trackRef.current) trackRef.current.style.transition = 'none'
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging || !trackRef.current) return
    dragRef.current.currentX = e.touches[0].clientX
    const delta = dragRef.current.currentX - dragRef.current.startX
    const containerWidth = trackRef.current.parentElement!.clientWidth
    const dragPercent = (delta / containerWidth) * 100
    trackRef.current.style.transform = `translateX(${-currentIndex * 100 + dragPercent}%)`
  }

  const onTouchEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false

    if (trackRef.current) trackRef.current.style.transition = 'transform 300ms ease-out'

    const delta = dragRef.current.currentX - dragRef.current.startX

    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta < 0) {
        setCurrentIndex(prev => (prev + 1) % PUPPY_PHOTOS.length)
      } else {
        setCurrentIndex(prev => (prev - 1 + PUPPY_PHOTOS.length) % PUPPY_PHOTOS.length)
      }
    } else {
      // Snap back
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-currentIndex * 100}%)`
      }
    }
  }

  return (
    <div className="text-center mb-6 md:mb-8">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        <div
          ref={trackRef}
          className="flex touch-pan-y"
          style={{
            transform: `translateX(${-currentIndex * 100}%)`,
            transition: 'transform 300ms ease-out'
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {PUPPY_PHOTOS.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt={config.puppy_name}
              className="w-full h-auto flex-shrink-0 select-none"
              draggable={false}
            />
          ))}
        </div>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-0">
          {PUPPY_PHOTOS.map((_, idx) => (
            <button
              key={idx}
              className="min-w-[34px] min-h-[44px] border-none cursor-pointer p-0 flex items-center justify-center bg-transparent"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
            >
              <span className={`block rounded-full transition-all duration-300 ${
                idx === currentIndex
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
