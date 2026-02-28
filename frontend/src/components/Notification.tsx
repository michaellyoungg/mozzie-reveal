import { useGameState } from '../hooks/useGameSelectors'

export default function Notification() {
  const { notification } = useGameState()

  if (!notification) return null
  const getBackgroundClass = () => {
    switch (notification.type) {
      case 'info':
        return 'bg-linear-to-br from-indigo-600 to-purple-600 text-white'
      case 'success':
        return 'bg-linear-to-br from-green-500 to-green-600 text-white'
      case 'warning':
        return 'bg-linear-to-br from-amber-500 to-amber-600 text-white'
      case 'error':
        return 'bg-linear-to-br from-red-500 to-red-600 text-white'
      default:
        return 'bg-linear-to-br from-indigo-600 to-purple-600 text-white'
    }
  }

  return (
    <div className={`fixed top-3 left-3 right-3 md:top-6 md:left-auto md:right-6 md:w-auto py-3 px-5 rounded-xl text-sm md:text-base font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.15)] animate-slide-in-bounce z-[1000] text-center md:text-left ${getBackgroundClass()}`}>
      {notification.message}
    </div>
  )
}
