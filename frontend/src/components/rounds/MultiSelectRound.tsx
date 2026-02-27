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
      <div className="flex flex-col gap-4 mb-8">
        {options.map(option => (
          <label key={option} className="flex items-center gap-4 py-5 px-6 bg-white border-[3px] border-transparent rounded-2xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] select-none hover:border-pink-100 hover:translate-x-1">
            <input
              type="checkbox"
              checked={selections.includes(option)}
              onChange={() => toggleSelection(option)}
              className="w-7 h-7 cursor-pointer rounded-lg border-[3px] border-party-purple appearance-none relative bg-white transition-all duration-200 checked:bg-gradient-to-br checked:from-party-pink checked:to-party-purple checked:border-party-pink checked:after:content-['✓'] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:text-white checked:after:text-xl checked:after:font-bold"
            />
            <span className="text-lg font-semibold text-[#6C5B7B] flex-1">{option}</span>
          </label>
        ))}
      </div>
      <button
        className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        onClick={handleSubmit}
        disabled={selections.length === 0}
      >
        Submit Selections
      </button>
    </div>
  )
}
