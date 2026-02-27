import { useState } from 'react'
import { gameActions } from '../../hooks/useGameSelectors'

interface MultipleChoiceRoundProps {
  options: string[]
}

export default function MultipleChoiceRound({ options }: MultipleChoiceRoundProps) {
  const [selection, setSelection] = useState<string | null>(null)

  const handleSubmit = () => {
    if (selection) {
      gameActions.submitGuess({ type: 'multiple_choice', selection })
    }
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
        {options.map(option => (
          <button
            key={option}
            className={`min-h-[44px] py-4 px-5 md:py-6 md:px-8 text-base md:text-lg font-semibold text-[#6C5B7B] bg-white border-[3px] border-transparent rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 shadow-md md:shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-left font-fredoka active:scale-95 md:hover:-translate-y-1 md:hover:shadow-[0_8px_20px_rgba(255,107,157,0.25)] md:hover:border-pink-100 ${
              selection === option
                ? 'bg-gradient-to-br from-party-pink to-party-purple text-white border-party-pink scale-[1.02] shadow-md md:shadow-[0_8px_24px_rgba(255,107,157,0.4)] md:hover:scale-[1.02] md:hover:-translate-y-0.5'
                : ''
            }`}
            onClick={() => setSelection(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        className="w-full min-h-[44px] py-4 md:py-6 text-lg md:text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-xl md:rounded-[20px] cursor-pointer transition-all duration-300 shadow-md md:shadow-[0_8px_24px_rgba(16,185,129,0.3)] active:scale-95 md:hover:bg-gradient-to-br md:hover:from-green-600 md:hover:to-green-700 md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        onClick={handleSubmit}
        disabled={!selection}
      >
        Submit Answer
      </button>
    </div>
  )
}
