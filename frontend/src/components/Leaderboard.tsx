import { useGameState } from '../hooks/useGameSelectors'

export default function Leaderboard() {
  const { players, roundActive } = useGameState()
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-lg md:shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <h3 className="m-0 mb-4 md:mb-6 bg-linear-to-br from-bubble to-bubble-deep bg-clip-text text-transparent text-xl md:text-2xl font-bold text-center">
        Leaderboard ({players.length} players)
      </h3>
      <div className="flex flex-col gap-2 md:gap-3">
        {sortedPlayers.map((player, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 md:gap-3.5 py-3 px-4 md:py-4 md:px-5 bg-linear-to-br from-gray-50 to-gray-100 border-[3px] border-gray-200 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-[0.98] md:hover:translate-x-1 md:hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
              !player.online ? 'opacity-50 border-dashed' : ''
            } ${
              idx === 0 ? 'bg-linear-to-br from-amber-100 to-amber-200 border-amber-500 font-bold shadow-md md:shadow-[0_4px_16px_rgba(245,158,11,0.3)]' : ''
            } ${
              idx === 1 ? 'bg-linear-to-br from-indigo-100 to-indigo-200 border-indigo-400' : ''
            } ${
              idx === 2 ? 'bg-linear-to-br from-violet-100 to-violet-200 border-violet-400' : ''
            }`}
          >
            <span className="font-bold bg-linear-to-br from-bubble to-bubble-deep bg-clip-text text-transparent min-w-[28px] md:min-w-[35px] text-base md:text-lg">
              #{idx + 1}
            </span>
            <span className="flex-1 font-semibold text-gray-700 text-sm md:text-base">
              {player.name}
              {player.has_guessed && roundActive && ' ✓'}
              {!player.online && ' 💤'}
            </span>
            <span className="font-bold text-emerald-500 text-base md:text-lg whitespace-nowrap">{player.score.toFixed(1)} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}
