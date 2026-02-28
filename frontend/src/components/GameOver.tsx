import { useGameState } from '../hooks/useGameSelectors'
import Leaderboard from './Leaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

export default function GameOver() {
  const { players, config } = useGameState()
  const podium = [...players].sort((a, b) => b.score - a.score).slice(0, 3)

  return (
    <div className="flex flex-col gap-4 md:gap-5 animate-fade-in">
      {/* Trophy banner */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg text-center py-6 md:py-8">
        <div className="text-5xl md:text-6xl mb-3">🏆</div>
        <h2 className="m-0 bg-linear-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent text-2xl md:text-3xl font-bold">
          Game Over!
        </h2>
        {config && (
          <p className="m-0 mt-2 text-gray-500 text-base md:text-lg">
            {config.puppy_name}'s Breed Reveal is complete!
          </p>
        )}
      </div>

      {/* Podium */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-3 md:gap-4">
          {podium.map((player, idx) => (
            <div
              key={player.name}
              className={`flex items-center gap-3 md:gap-4 py-4 px-5 md:py-5 md:px-6 rounded-xl border-3 transition-all ${
                idx === 0
                  ? 'bg-linear-to-br from-amber-50 to-amber-100 border-amber-400 shadow-md'
                  : idx === 1
                    ? 'bg-linear-to-br from-gray-50 to-gray-100 border-gray-300'
                    : 'bg-linear-to-br from-orange-50 to-orange-100 border-orange-300'
              }`}
            >
              <span className="text-3xl md:text-4xl">{MEDALS[idx]}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-bold truncate ${
                  idx === 0 ? 'text-lg md:text-xl text-amber-900' : 'text-base md:text-lg text-gray-800'
                }`}>
                  {player.name}
                </div>
              </div>
              <span className={`font-bold whitespace-nowrap ${
                idx === 0 ? 'text-xl md:text-2xl text-amber-600' : 'text-lg md:text-xl text-gray-600'
              }`}>
                {player.score.toFixed(1)} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full leaderboard */}
      <Leaderboard />
    </div>
  )
}
