import { useGameState, gameActions } from '../hooks/useGameSelectors'

interface AdminPanelProps {
  totalRounds: number
}

export default function AdminPanel({ totalRounds }: AdminPanelProps) {
  const { players, roundActive, currentRound, results } = useGameState()
  const submittedCount = players.filter(p => p.has_guessed).length

  return (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-3xl mb-8 border-[3px] border-[#FFA500] shadow-[0_4px_16px_rgba(255,165,0,0.2)]">
      <h3 className="m-0 mb-4 text-[#8B4513] font-bold">Admin Controls</h3>

      {roundActive && (
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl mb-6 shadow-[0_4px_12px_rgba(33,150,243,0.15)]">
          <h4 className="m-0 mb-4 text-blue-800 text-lg font-bold">Submission Status</h4>
          <div className="text-xl font-bold text-blue-900 mb-4 p-3 bg-white rounded-xl text-center">
            {submittedCount} / {players.length} players submitted
          </div>
          <div className="flex flex-col gap-3">
            {players.map((player, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 py-3.5 px-4 bg-white rounded-xl border-2 border-transparent transition-all duration-200 ${
                  player.has_guessed
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100'
                    : 'border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100'
                }`}
              >
                <span className={`text-xl font-bold ${
                  player.has_guessed ? 'text-green-800' : 'text-[#F57C00] opacity-50'
                }`}>
                  {player.has_guessed ? '✓' : '○'}
                </span>
                <span className="text-base font-semibold text-gray-800 flex-1">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {!roundActive && currentRound === null && (
          <button
            onClick={gameActions.startRound}
            className="py-4 px-6 text-lg font-bold bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-[14px] cursor-pointer transition-all duration-300 font-fredoka shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(76,175,80,0.4)]"
          >
            Start Round 1
          </button>
        )}
        {roundActive && (
          <button
            onClick={gameActions.revealAnswer}
            className="py-4 px-6 text-lg font-bold bg-gradient-to-br from-[#FFA500] to-[#FF8C00] text-white border-none rounded-[14px] cursor-pointer transition-all duration-300 font-fredoka shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(255,165,0,0.4)]"
          >
            Reveal Answer
          </button>
        )}
        {!roundActive && results && currentRound !== null && currentRound < totalRounds - 1 && (
          <button
            onClick={gameActions.nextRound}
            className="py-4 px-6 text-lg font-bold bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none rounded-[14px] cursor-pointer transition-all duration-300 font-fredoka shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(33,150,243,0.4)]"
          >
            Next Round
          </button>
        )}
      </div>
    </div>
  )
}
