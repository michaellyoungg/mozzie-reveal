import { useGameState, gameActions } from '../../hooks/useGameSelectors'
import Slideshow from '../Slideshow'

export default function AdminLobby() {
  const { players } = useGameState()

  return (
    <>
      <div className="bg-linear-to-br from-amber-50 to-amber-100 p-4 md:p-6 rounded-2xl border-2 border-amber-300 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="m-0 text-amber-900 font-bold text-lg md:text-xl">Players ({players.length})</h3>
          {players.length === 0 && (
            <span className="text-sm text-amber-700 animate-pulse">Waiting for players...</span>
          )}
        </div>

        {players.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {players.map((player, idx) => (
              <span
                key={idx}
                className={`py-2 px-4 rounded-xl text-sm font-semibold ${
                  player.online
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {player.name}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={gameActions.startRound}
          disabled={players.length === 0}
          className="w-full min-h-[52px] py-4 px-6 text-lg font-bold bg-linear-to-br from-green-500 to-green-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 shadow-md active:scale-95 md:hover:-translate-y-1 md:hover:shadow-[0_6px_20px_rgba(76,175,80,0.4)] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          Start Round 1
        </button>
      </div>
    </>
  )
}
