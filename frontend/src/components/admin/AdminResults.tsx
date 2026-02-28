import { useGameState, gameActions } from '../../hooks/useGameSelectors'
import RoundResults from '../RoundResults'

export default function AdminResults() {
  const { config, currentRound } = useGameState()

  const isLastRound = config && currentRound !== null && currentRound >= config.total_rounds - 1

  return (
    <div className="flex flex-col gap-4">
      <RoundResults />

      {isLastRound ? (
        <div className="text-center py-6 bg-linear-to-br from-amber-50 to-amber-100 rounded-2xl border-2 border-amber-300">
          <div className="text-4xl mb-3">&#127942;</div>
          <h2 className="text-amber-900 text-xl md:text-2xl font-bold m-0">Game Over!</h2>
          <p className="text-amber-700 mt-2 m-0">Check the final leaderboard below</p>
        </div>
      ) : (
        <button
          onClick={gameActions.nextRound}
          className="w-full min-h-[52px] py-4 px-6 text-lg font-bold bg-linear-to-br from-blue-500 to-blue-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 shadow-md active:scale-95 md:hover:-translate-y-1 md:hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]"
        >
          Next Round
        </button>
      )}
    </div>
  )
}
