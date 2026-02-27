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
    <div className="max-w-7xl mx-auto px-4 py-3 md:px-6 md:py-6">
      <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-xl md:text-2xl lg:text-[2rem] font-bold tracking-tight text-center md:text-left">
        Mozzie's Breed Reveal Party!
      </h1>
      <div className="bg-white p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl lg:rounded-[32px] shadow-lg md:shadow-xl lg:shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[500px] mx-auto my-8 md:my-12 lg:my-16 text-center animate-[popIn_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
        <p className="text-base md:text-lg text-[#6C5B7B] mb-5 md:mb-6 font-medium leading-relaxed">
          Welcome to the celebration! Can you guess Mozzie's breed mix?
        </p>
        <h2 className="text-[#6C5B7B] text-lg md:text-xl mb-5 md:mb-6 font-bold">Enter your name to join</h2>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Your name"
          autoFocus
          className="w-full min-h-[44px] p-4 md:p-5 text-base md:text-lg border-[3px] border-gray-200 rounded-xl md:rounded-2xl mb-3 md:mb-4 font-fredoka transition-all duration-300 focus:outline-none focus:border-party-pink focus:shadow-[0_0_0_4px_rgba(255,107,157,0.1)]"
        />
        <button
          onClick={handleSubmit}
          disabled={!nameInput.trim() || isConnecting}
          className="w-full min-h-[44px] p-4 md:p-5 text-lg md:text-xl font-bold bg-gradient-to-br from-party-pink to-party-purple text-white border-none rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 shadow-md md:shadow-[0_6px_20px_rgba(255,107,157,0.3)] active:scale-95 md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_10px_30px_rgba(255,107,157,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isConnecting ? 'Connecting...' : 'Join the Party!'}
        </button>
      </div>
    </div>
  )
}
