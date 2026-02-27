import { useState } from 'react'
import { useGameActions } from '../../hooks/useGameSelectors'

interface NumericGuessRoundProps {
  unit: string
}

export default function NumericGuessRound({ unit }: NumericGuessRoundProps) {
  const [value, setValue] = useState<number>(50)
  const { submitGuess } = useGameActions()

  const handleSubmit = () => {
    submitGuess({ type: 'numeric', value })
  }

  return (
    <div className="flex flex-col gap-8 max-w-[500px] mx-auto">
      <div className="flex items-center justify-center gap-4 bg-gradient-to-br from-pink-100 to-purple-100 p-8 rounded-[20px] shadow-[0_4px_16px_rgba(108,91,123,0.15)]">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          className="text-5xl font-bold w-[120px] text-center p-2 border-[3px] border-party-pink rounded-2xl bg-white text-[#6C5B7B] font-fredoka focus:outline-none focus:border-party-purple focus:shadow-[0_0_0_4px_rgba(255,107,157,0.2)]"
          min="0"
          step="1"
        />
        <span className="text-[2rem] font-bold text-party-purple">{unit}</span>
      </div>
      <input
        type="range"
        min="0"
        max="120"
        step="1"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full h-3 rounded-[10px] bg-gradient-to-r from-pink-100 to-party-purple outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-party-pink [&::-webkit-slider-thumb]:to-party-purple [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(255,107,157,0.4)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-120 [&::-webkit-slider-thumb]:hover:shadow-[0_6px_16px_rgba(255,107,157,0.6)]"
      />
      <button
        className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)]"
        onClick={handleSubmit}
      >
        Submit Guess
      </button>
    </div>
  )
}
