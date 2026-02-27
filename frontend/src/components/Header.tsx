import { useGameState, gameActions } from '../hooks/useGameSelectors'

export default function Header() {
  const { config, currentRound, playerName, showAdmin } = useGameState()

  if (!config) return null
  return (
    <div className="flex justify-between items-center mb-8 bg-white py-6 px-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      <h1 className="m-0 bg-gradient-to-br from-party-pink to-party-purple bg-clip-text text-transparent text-[2rem] font-bold tracking-tight">
        {config.title}
      </h1>
      <div className="text-base font-semibold text-[#6C5B7B] bg-gradient-to-br from-pink-100 to-purple-100 py-3 px-6 rounded-xl shadow-[0_2px_8px_rgba(108,91,123,0.1)]">
        Round {currentRound !== null ? currentRound + 1 : 0} of {config.total_rounds}
      </div>
      <div className="text-lg text-[#6C5B7B] font-semibold flex items-center gap-2">
        Playing as: <strong>{playerName}</strong>
      </div>
      <button
        className="py-3 px-6 bg-gradient-to-br from-[#FFA500] to-[#FF8C00] text-white border-none rounded-2xl font-bold text-[0.95rem] cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(255,165,0,0.3)] hover:-translate-y-1 hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,165,0,0.4)]"
        onClick={gameActions.toggleAdmin}
      >
        {showAdmin ? 'Hide' : 'Show'} Admin
      </button>
    </div>
  )
}
