import { useState, useEffect } from 'react'

const PUPPY_PHOTOS = [
  '/PXL_20260130_222909317.jpg',
  '/PXL_20260201_195112570.jpg',
  '/PXL_20260206_013619475.jpg',
  '/PXL_20260210_003411072.jpg',
  '/PXL_20260220_234251765.jpg',
  '/PXL_20260221_001100324.jpg'
]

export default function Slideshow({ puppyName }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Auto-rotate slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % PUPPY_PHOTOS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="puppy-container">
      <div className="slideshow">
        <img
          src={PUPPY_PHOTOS[currentPhotoIndex]}
          alt={puppyName}
          className="puppy-image"
        />
        <div className="slideshow-dots">
          {PUPPY_PHOTOS.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentPhotoIndex ? 'active' : ''}`}
              onClick={() => setCurrentPhotoIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      <h2>{puppyName}</h2>
    </div>
  )
}
