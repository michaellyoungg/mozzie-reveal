import { Notification as NotificationType } from '../types/game'

interface NotificationProps {
  notification: NotificationType
}

export default function Notification({ notification }: NotificationProps) {
  const getBackgroundClass = () => {
    switch (notification.type) {
      case 'info':
        return 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
      case 'success':
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white'
      case 'warning':
        return 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
      case 'error':
        return 'bg-gradient-to-br from-red-500 to-red-600 text-white'
      default:
        return 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
    }
  }

  return (
    <div className={`fixed top-8 right-8 py-4 px-6 rounded-2xl font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.15)] animate-[slideInBounce_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)] z-[1000] ${getBackgroundClass()}`}>
      {notification.message}
    </div>
  )
}
