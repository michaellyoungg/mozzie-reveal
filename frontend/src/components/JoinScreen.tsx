import { useState } from 'react'
import { gameActions } from '../hooks/useGameSelectors'

export default function JoinScreen() {
  const [nameInput, setNameInput] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState<boolean>(false)

  const handleSubmit = () => {
    if (nameInput.trim()) {
      setIsConnecting(true)
      gameActions.joinGame(nameInput.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 md:px-6">
      <h1 className="m-0 mb-6 bg-linear-to-br from-bubble to-bubble-deep bg-clip-text text-transparent text-2xl md:text-3xl font-bold tracking-tight text-center">
        Mozzie's Breed Reveal Party!
      </h1>
      <div className="bg-white/95 backdrop-blur-sm p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-lg md:shadow-xl w-full max-w-[420px] text-center animate-pop-in">
        <p className="text-base md:text-lg text-slate-500 mb-5 md:mb-6 font-medium leading-relaxed">
          Welcome to the celebration! Lets learn about this lil pup!
        </p>
        <h2 className="text-slate-600 text-lg md:text-xl mb-5 md:mb-6 font-bold">Enter your name to join</h2>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyUp={handleKeyPress}
          placeholder="Your name"
          autoFocus
          className="w-full min-h-[44px] p-4 md:p-5 text-base md:text-lg border-[3px] border-gray-200 rounded-xl md:rounded-2xl mb-3 md:mb-4 font-fredoka transition-all duration-300 focus:outline-none focus:border-bubble focus:shadow-[0_0_0_4px_rgba(167,139,250,0.15)]"
        />
        <button
          onClick={handleSubmit}
          disabled={!nameInput.trim() || isConnecting}
          className="w-full min-h-[44px] p-4 md:p-5 text-lg md:text-xl font-bold bg-linear-to-br from-bubble to-bubble-deep text-white border-none rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 shadow-md md:shadow-[0_6px_20px_rgba(167,139,250,0.3)] active:scale-95 md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_10px_30px_rgba(167,139,250,0.4)] disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isConnecting ? 'Connecting...' : 'Join the Party!'}
        </button>
      </div>
    </div>
  )
}
