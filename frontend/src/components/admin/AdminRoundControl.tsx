import { useGameState, gameActions } from '../../hooks/useGameSelectors'

export default function AdminRoundControl() {
  const { roundData, players, currentRound } = useGameState()

  if (!roundData) return null

  const submittedCount = players.filter(p => p.has_guessed).length

  return (
    <div className="flex flex-col gap-4">
      {/* Round info */}
      <div className="bg-linear-to-br from-indigo-50 to-indigo-100 p-4 md:p-6 rounded-2xl border-2 border-indigo-200">
        <div className="text-sm font-semibold text-indigo-500 mb-1">
          Round {currentRound !== null ? currentRound + 1 : '?'}
        </div>
        <h3 className="m-0 mb-2 text-indigo-900 font-bold text-lg md:text-xl">{roundData.title}</h3>
        <p className="text-sm md:text-base text-indigo-700 m-0">{roundData.question}</p>
      </div>

      {/* Submission tracker */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="m-0 text-gray-800 font-bold text-base md:text-lg">Submissions</h3>
          <span className="text-lg font-bold text-indigo-600 bg-indigo-50 py-1.5 px-4 rounded-xl">
            {submittedCount}/{players.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {players.map((player, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                player.has_guessed
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className={`text-lg font-bold ${
                player.has_guessed ? 'text-green-600' : 'text-gray-300'
              }`}>
                {player.has_guessed ? '\u2713' : '\u25CB'}
              </span>
              <span className="text-sm md:text-base font-semibold text-gray-800 flex-1">
                {player.name}
              </span>
              {!player.online && (
                <span className="text-xs text-gray-400 font-medium">offline</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reveal button */}
      <button
        onClick={gameActions.revealAnswer}
        className="w-full min-h-[52px] py-4 px-6 text-lg font-bold bg-linear-to-br from-amber-500 to-amber-600 text-white border-none rounded-xl cursor-pointer transition-all duration-300 shadow-md active:scale-95 md:hover:-translate-y-1 md:hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)]"
      >
        Reveal Answer
      </button>
    </div>
  )
}
