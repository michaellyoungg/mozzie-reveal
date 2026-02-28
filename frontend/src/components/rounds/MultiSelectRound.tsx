import { useState } from 'react'
import { gameActions } from '../../hooks/useGameSelectors'

interface MultiSelectRoundProps {
  options: string[]
}

export default function MultiSelectRound({ options }: MultiSelectRoundProps) {
  const [selections, setSelections] = useState<string[]>([])

  const toggleSelection = (option: string) => {
    setSelections(selections.includes(option)
      ? selections.filter(s => s !== option)
      : [...selections, option]
    )
  }

  const handleSubmit = () => {
    gameActions.submitGuess({ type: 'multi_select', selections })
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
        {options.map(option => (
          <label key={option} className="flex items-center gap-3 md:gap-4 py-4 px-4 md:py-5 md:px-6 bg-white border-[3px] border-transparent rounded-xl md:rounded-2xl cursor-pointer transition-all duration-200 shadow-md md:shadow-[0_2px_8px_rgba(0,0,0,0.08)] select-none active:scale-[0.98] md:hover:border-violet-200 md:hover:translate-x-1 min-h-[56px]">
            <div className="relative min-w-[44px] min-h-[44px] flex items-center justify-center">
              <input
                type="checkbox"
                checked={selections.includes(option)}
                onChange={() => toggleSelection(option)}
                className="absolute w-full h-full cursor-pointer rounded-lg border-[3px] border-bubble-deep appearance-none bg-white transition-all duration-200 checked:bg-linear-to-br checked:from-bubble checked:to-bubble-deep checked:border-bubble checked:after:content-['✓'] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:text-white checked:after:text-xl checked:after:font-bold"
                aria-label={`Select ${option}`}
              />
            </div>
            <span className="text-base md:text-lg font-semibold text-slate-600 flex-1">{option}</span>
          </label>
        ))}
      </div>
      <button
        className="w-full min-h-[44px] py-4 md:py-6 text-lg md:text-[1.3rem] font-bold bg-linear-to-br from-green-500 to-green-600 text-white border-none rounded-xl md:rounded-[20px] cursor-pointer transition-all duration-300 shadow-md md:shadow-[0_8px_24px_rgba(16,185,129,0.3)] active:scale-95 md:hover:bg-linear-to-br md:hover:from-green-600 md:hover:to-green-700 md:hover:-translate-y-1 md:hover:scale-[1.02] md:hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        onClick={handleSubmit}
        disabled={selections.length === 0}
      >
        Submit Selections
      </button>
    </div>
  )
}
