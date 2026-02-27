import { useState } from 'react'
import { BreedGuess } from '../../types/game'
import { useGameActions } from '../../hooks/useGameSelectors'

interface BreedPercentageRoundProps {
  availableBreeds: string[]
}

export default function BreedPercentageRound({ availableBreeds }: BreedPercentageRoundProps) {
  const [selectedBreeds, setSelectedBreeds] = useState<BreedGuess[]>([])
  const { submitGuess } = useGameActions()

  const addBreed = (breedName: string) => {
    if (!selectedBreeds.find(b => b.name === breedName)) {
      setSelectedBreeds([...selectedBreeds, { name: breedName, percentage: 10 }])
    }
  }

  const removeBreed = (breedName: string) => {
    setSelectedBreeds(selectedBreeds.filter(b => b.name !== breedName))
  }

  const updatePercentage = (breedName: string, percentage: number) => {
    setSelectedBreeds(selectedBreeds.map(b =>
      b.name === breedName ? { ...b, percentage: Math.max(0, Math.min(100, percentage)) } : b
    ))
  }

  const handleSubmit = () => {
    submitGuess({ type: 'breed_percentage', guesses: selectedBreeds })
  }

  const totalPercentage = selectedBreeds.reduce((sum, b) => sum + b.percentage, 0)
  const remainingBreeds = availableBreeds.filter(
    b => !selectedBreeds.find(s => s.name === b)
  )

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-[3px] border-blue-500 rounded-[20px] p-6 mb-8">
        <h3 className="m-0 mb-4 text-blue-900 font-bold">Your Guesses ({totalPercentage.toFixed(1)}%)</h3>
        {selectedBreeds.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8 font-medium">Add breeds from the list below</p>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedBreeds.map(breed => (
              <div key={breed.name} className="bg-white border-[3px] border-blue-500 rounded-2xl p-5 transition-all duration-300 animate-[slideInLeft_0.3s_ease] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(59,130,246,0.2)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-blue-950 text-lg">{breed.name}</span>
                  <button
                    className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none rounded-full w-9 h-9 text-2xl leading-none cursor-pointer transition-all duration-300 flex items-center justify-center shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:scale-125 hover:rotate-90 hover:shadow-[0_6px_18px_rgba(239,68,68,0.4)]"
                    onClick={() => removeBreed(breed.name)}
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={breed.percentage}
                    onChange={(e) => updatePercentage(breed.name, parseFloat(e.target.value))}
                    className="w-full h-2 rounded bg-gradient-to-r from-blue-500 to-blue-400 outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(59,130,246,0.5)] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-120"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={breed.percentage}
                    onChange={(e) => updatePercentage(breed.name, parseFloat(e.target.value) || 0)}
                    className="w-20 p-3 border-[3px] border-blue-100 rounded-xl text-lg font-bold text-center font-fredoka text-blue-900"
                  />
                  <span className="font-bold text-blue-500 text-xl">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="my-8">
        <h3 className="text-[#6C5B7B] mb-5 font-bold">Available Breeds</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {remainingBreeds.map(breed => (
            <button
              key={breed}
              className="py-5 px-4 bg-gradient-to-br from-gray-100 to-gray-200 border-[3px] border-transparent rounded-2xl text-base font-semibold cursor-pointer transition-all duration-300 text-center text-gray-700 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:border-green-700 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
              onClick={() => addBreed(breed)}
            >
              + {breed}
            </button>
          ))}
        </div>
      </div>

      <button
        className="w-full py-6 text-[1.3rem] font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[20px] cursor-pointer transition-all duration-300 mt-8 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        onClick={handleSubmit}
        disabled={selectedBreeds.length === 0}
      >
        Submit Guesses
      </button>
    </>
  )
}
