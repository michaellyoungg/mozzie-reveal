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
    <div className="max-w-[1400px] mx-auto p-6">
      <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">
        Mozzie's Breed Reveal Party!
      </h1>
      <div className="bg-white p-12 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[500px] mx-auto my-16 text-center animate-[popIn_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
        <p className="text-lg text-[#6C5B7B] mb-6 font-medium leading-relaxed">
          Welcome to the celebration! Can you guess Mozzie's breed mix?
        </p>
        <h2 className="text-[#6C5B7B] mb-6 font-bold">Enter your name to join</h2>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Your name"
          autoFocus
          className="w-full p-5 text-lg border-[3px] border-gray-200 rounded-2xl mb-4 font-fredoka transition-all duration-300 focus:outline-none focus:border-party-pink focus:shadow-[0_0_0_4px_rgba(255,107,157,0.1)]"
        />
        <button
          onClick={handleSubmit}
          disabled={!nameInput.trim() || isConnecting}
          className="w-full p-5 text-xl font-bold bg-gradient-to-br from-party-pink to-party-purple text-white border-none rounded-2xl cursor-pointer transition-all duration-300 shadow-[0_6px_20px_rgba(255,107,157,0.3)] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(255,107,157,0.4)] disabled:bg-gray-200 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isConnecting ? 'Connecting...' : 'Join the Party!'}
        </button>
      </div>
    </div>
  )
}
