import { useRef, useCallback, TouchEvent } from 'react'

interface SwipeCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface SwipeConfig {
  minSwipeDistance?: number
}

/**
 * Custom hook for detecting swipe gestures on touch devices
 * Follows mobile web best practices for gesture handling
 *
 * @param callbacks - Object containing swipe direction handlers
 * @param config - Configuration for swipe sensitivity
 * @returns Touch event handlers to attach to an element
 *
 * @example
 * const swipeHandlers = useSwipe({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right')
 * })
 *
 * return <div {...swipeHandlers}>Swipe me!</div>
 */
export function useSwipe(
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) {
  const { minSwipeDistance = 50 } = config
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const touchEnd = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const distanceX = touchStart.current.x - touchEnd.current.x
    const distanceY = touchStart.current.y - touchEnd.current.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontalSwipe) {
      // Horizontal swipe
      if (Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) {
          // Swiped left
          callbacks.onSwipeLeft?.()
        } else {
          // Swiped right
          callbacks.onSwipeRight?.()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(distanceY) > minSwipeDistance) {
        if (distanceY > 0) {
          // Swiped up
          callbacks.onSwipeUp?.()
        } else {
          // Swiped down
          callbacks.onSwipeDown?.()
        }
      }
    }
  }, [callbacks, minSwipeDistance])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
