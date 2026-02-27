import { useState } from 'react'

interface MultipleChoiceRoundProps {
  options: string[]
  onSubmit: (selection: string) => void
}

export default function MultipleChoiceRound({ options, onSubmit }: MultipleChoiceRoundProps) {
  const [selection, setSelection] = useState<string | null>(null)

  const handleSubmit = () => {
    if (selection) {
      onSubmit(selection)
    }
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        {options.map(option => (
          <button
            key={option}
            className={`py-6 px-8 text-lg font-semibold text-[#6C5B7B] bg-white border-[3px] border-transparent rounded-2xl cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-left font-fredoka hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,157,0.25)] hover:border-pink-100 ${
              selection === option
                ? 'bg-gradient-to-br from-party-pink to-party-purple text-white border-party-pink scale-[1.02] shadow-[0_8px_24px_rgba(255,107,157,0.4)] hover:scale-[1.02] hover:-translate-y-0.5'
                : ''
            }`}
            onClick={() => setSelection(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        onClick={handleSubmit}
        disabled={!selection}
      >
        Submit Answer
      </button>
    </div>
  )
}
