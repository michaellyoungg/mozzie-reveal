import { useGameState } from '../hooks/useGameSelectors'

export default function Leaderboard() {
  const { players, roundActive } = useGameState()
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <h3 className="m-0 mb-6 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-2xl font-bold text-center">
        Leaderboard ({players.length} players)
      </h3>
      <div className="flex flex-col gap-3">
        {sortedPlayers.map((player, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3.5 py-4 px-5 bg-gradient-to-br from-gray-50 to-gray-100 border-[3px] border-gray-200 rounded-2xl transition-all duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
              !player.online ? 'opacity-50 border-dashed' : ''
            } ${
              idx === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-500 font-bold shadow-[0_4px_16px_rgba(245,158,11,0.3)]' : ''
            } ${
              idx === 1 ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500' : ''
            } ${
              idx === 2 ? 'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-500' : ''
            }`}
          >
            <span className="font-bold bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent min-w-[35px] text-lg">
              #{idx + 1}
            </span>
            <span className="flex-1 font-semibold text-gray-700">
              {player.name}
              {player.has_guessed && roundActive && ' ✓'}
              {!player.online && ' 💤'}
            </span>
            <span className="font-bold text-green-500 text-lg">{player.score.toFixed(1)} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}
