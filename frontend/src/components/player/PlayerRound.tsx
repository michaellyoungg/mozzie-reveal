import { useGameState } from '../../hooks/useGameSelectors'
import BreedPercentageRound from '../rounds/BreedPercentageRound'
import NumericGuessRound from '../rounds/NumericGuessRound'
import MultiSelectRound from '../rounds/MultiSelectRound'
import MultipleChoiceRound from '../rounds/MultipleChoiceRound'

export default function PlayerRound() {
  const { roundData, hasGuessed, roundActive } = useGameState()

  if (hasGuessed && roundActive) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="text-5xl mb-4">&#10003;</div>
        <h2 className="text-[#6C5B7B] text-xl md:text-2xl mb-3 font-bold">Guess submitted!</h2>
        <p className="text-base md:text-lg text-[#6C5B7B]/70 animate-pulse">Waiting for reveal...</p>
      </div>
    )
  }

  if (!roundData || !roundActive) return null

  return (
    <div className="my-4 md:my-6">
      <h2 className="text-[#6C5B7B] text-xl md:text-2xl text-center mb-4 md:mb-6 font-bold">{roundData.title}</h2>
      <p className="text-base md:text-lg text-[#6C5B7B] my-3 mb-5 md:mb-6 leading-relaxed text-center">{roundData.question}</p>

      {roundData.type === 'breed_percentage' && (
        <BreedPercentageRound availableBreeds={roundData.available_breeds} />
      )}
      {roundData.type === 'numeric_guess' && (
        <NumericGuessRound unit={roundData.unit} />
      )}
      {roundData.type === 'multi_select' && (
        <MultiSelectRound options={roundData.options} />
      )}
      {roundData.type === 'multiple_choice' && (
        <MultipleChoiceRound options={roundData.options} />
      )}
    </div>
  )
}
